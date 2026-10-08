require('dotenv').config();
const path=require('path');
const crypto=require('crypto');
const express=require('express');
const fs=require('fs');
const multer=require('multer');
const helmet=require('helmet');
const Stripe=require('stripe');
const {calculateOrder,getProducts,getProductMap,createProduct,updateProduct,updateProductImages}=require('./catalog');
const {createCustomer,authenticateCustomer,getCustomerById,getCustomerByEmail,verifyCustomerPassword,updateCustomerProfile,updateCustomerAddress,markCustomerEmailVerified,setCustomerPassword,changeCustomerPassword,changeCustomerEmail,emailAvailable,getCustomerFavorites,addCustomerFavorite,removeCustomerFavorite,createCustomerSession,getCustomerFromSession,destroyCustomerSession,destroyCustomerSessionsByCustomerId,issueCustomerActionToken,getCustomerActionToken,consumeCustomerActionToken,revokeCustomerActionTokens}=require('./customers');
const {sanitizeCheckout,normalizeItems,inventoryFor,saveDraft,getDraft,calculateCheckoutTotals,createLocalCashOrder,createBankTransferOrder,saveBankTransferProof,getBankTransferProofMeta,markBankTransferPaid,finalizeStripeOrder,finalizePayPalOrder,findOrderByPayPalOrderId,finalizeMercadoPagoOrder,findOrderByMercadoPagoOrderId,finalizeMercadoPagoPayment,findOrderByMercadoPagoPaymentId,getInventory,findOrder,listOrders,listCustomerOrders,updateOrderStatus,updateOrderShipment,setInventoryStock,reconcileInventoryForProduct,initializeInventoryForProduct,inventorySummary,adminSummary,ADMIN_ORDER_STATUSES}=require('./orders');
const {getHomepage,saveHomepage}=require('./homepage');
const siteTexts=require('./site-texts');
const {getLocalDeliverySettings,saveLocalDeliverySettings,isEligibleAddress,publicSettings}=require('./local-delivery');
const {adminList:promotionList,createPromotion,updatePromotion,deletePromotion}=require('./promotions');
const paypal=require('./paypal');
const mercadopago=require('./mercadopago');
const {getBankTransferSettings,saveBankTransferSettings,publicAvailability}=require('./bank-transfer');
const emailService=require('./email');
const emailTemplates=require('./email-templates');
const sizeGuide=require('./size-guide');
const newsletter=require('./newsletter');
const collaborationsAccess=require('./collaborations-access');
const maintenanceMode=require('./maintenance-mode');
const {initDatabase,backendName,usingPostgres}=require('./database');
const postgresMaintenance=require('./postgres-maintenance');
const adminState=require('./admin-state');

const app=express();
// V127.41 — endurecimiento de producción. No confiamos ciegamente en
// X-Forwarded-For: Express calcula req.ip únicamente según el proxy configurado.
const configuredProxyHops=Number.parseInt(process.env.TRUST_PROXY_HOPS||'',10);
const trustProxySetting=Number.isInteger(configuredProxyHops)&&configuredProxyHops>0
  ? configuredProxyHops
  : (process.env.NODE_ENV==='production'?1:false);
app.set('trust proxy',trustProxySetting);
app.disable('x-powered-by');
app.use(helmet({
  // La tienda todavía usa algunos scripts inline y Stripe.js. La CSP se deja
  // desactivada en esta versión para no romper checkout; se activará con nonces
  // al migrar la parte pública a producción definitiva.
  contentSecurityPolicy:false,
  crossOriginEmbedderPolicy:false,
  hsts:process.env.NODE_ENV==='production'?{maxAge:15552000,includeSubDomains:true}:false,
  referrerPolicy:{policy:'strict-origin-when-cross-origin'}
}));
app.use((req,res,next)=>{
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=(), payment=(self)');
  if(req.path.startsWith('/api/'))res.setHeader('Cache-Control','no-store');
  next();
});
// Mantiene sincronizadas las configuraciones del panel entre instancias de Wasmer.
// La consulta real a PostgreSQL se limita internamente a una vez cada 5 segundos.
app.use((req,res,next)=>{
  adminState.refreshIfNeeded().then(()=>next()).catch(err=>{
    console.error('No fue posible refrescar la persistencia del panel:',err.message);
    next();
  });
});
const projectRoot=path.join(__dirname,'..');
// V127.43 — en Wasmer los archivos web viven en /public para evitar que el
// detector clasifique todo el proyecto como sitio estático. En instalaciones
// antiguas sin /public se conserva la estructura histórica como respaldo.
const publicRoot=path.join(projectRoot,'public');
const root=fs.existsSync(publicRoot)?publicRoot:projectRoot;
const productUploadsDir=path.join(root,'assets','productos','uploads');
fs.mkdirSync(productUploadsDir,{recursive:true});
const imageMimeExt={
  'image/jpeg':'.jpg',
  'image/png':'.png',
  'image/webp':'.webp'
};
const productImageStorage=multer.diskStorage({
  destination:(req,file,cb)=>cb(null,productUploadsDir),
  filename:(req,file,cb)=>{
    const ext=imageMimeExt[file.mimetype]||'';
    cb(null,`${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  }
});
const productImageUpload=multer({
  storage:productImageStorage,
  limits:{fileSize:8*1024*1024,files:8},
  fileFilter:(req,file,cb)=>imageMimeExt[file.mimetype]
    ? cb(null,true)
    : cb(new Error('Las imágenes deben ser JPG, PNG o WEBP.'))
});
function uploadProductImages(req,res,next){
  productImageUpload.array('images',8)(req,res,err=>{
    if(!err)return next();
    const message=err.code==='LIMIT_FILE_SIZE'
      ? 'Una de las imágenes supera el límite de 8 MB.'
      : err.code==='LIMIT_FILE_COUNT'
        ? 'Puedes subir hasta 8 imágenes a la vez.'
        : (err.message||'No fue posible subir las imágenes.');
    res.status(400).json({error:message});
  });
}
function uploadedProductPaths(req){
  return (Array.isArray(req.files)?req.files:[]).map(file=>`assets/productos/uploads/${file.filename}`);
}
function cleanupUploadedPaths(paths=[]){
  for(const rel of paths){
    try{fs.unlinkSync(path.join(root,rel));}catch{}
  }
}

const emailLogoUploadsDir=path.join(root,'assets','email','uploads');
fs.mkdirSync(emailLogoUploadsDir,{recursive:true});
const emailLogoStorage=multer.diskStorage({
  destination:(req,file,cb)=>cb(null,emailLogoUploadsDir),
  filename:(req,file,cb)=>{const ext=imageMimeExt[file.mimetype]||'';cb(null,`email-logo-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`)}
});
const emailLogoUpload=multer({storage:emailLogoStorage,limits:{fileSize:4*1024*1024,files:1},fileFilter:(req,file,cb)=>imageMimeExt[file.mimetype]?cb(null,true):cb(new Error('El logo debe ser JPG, PNG o WEBP.'))});
function uploadEmailLogo(req,res,next){emailLogoUpload.single('logo')(req,res,err=>{if(!err)return next();const message=err.code==='LIMIT_FILE_SIZE'?'El logo supera el límite de 4 MB.':(err.message||'No fue posible subir el logo.');res.status(400).json({error:message})})}
function maybeDeleteUnusedUpload(relPath){
  const clean=String(relPath||'').replace(/^\/+/, '');
  if(!clean.startsWith('assets/productos/uploads/'))return;
  const used=getProducts().some(product=>
    product.img===clean ||
    (product.images||[]).includes(clean) ||
    Object.values(product.variantImages||{}).includes(clean)
  );
  if(!used){
    try{fs.unlinkSync(path.join(root,clean));}catch{}
  }
}
const heroUploadsDir=path.join(root,'assets','portada','uploads');
fs.mkdirSync(heroUploadsDir,{recursive:true});
const heroImageStorage=multer.diskStorage({
  destination:(req,file,cb)=>cb(null,heroUploadsDir),
  filename:(req,file,cb)=>{const ext=imageMimeExt[file.mimetype]||'';cb(null,`${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`)}
});
const heroImageUpload=multer({storage:heroImageStorage,limits:{fileSize:12*1024*1024,files:1},fileFilter:(req,file,cb)=>imageMimeExt[file.mimetype]?cb(null,true):cb(new Error('La portada debe ser JPG, PNG o WEBP.'))});
function uploadHeroImage(req,res,next){heroImageUpload.single('image')(req,res,err=>{if(!err)return next();const message=err.code==='LIMIT_FILE_SIZE'?'La imagen supera el límite de 12 MB.':(err.message||'No fue posible subir la imagen.');res.status(400).json({error:message})})}
const heroVideoMimeExt={
  'video/mp4':'.mp4',
  'video/webm':'.webm'
};
const heroVideoStorage=multer.diskStorage({
  destination:(req,file,cb)=>cb(null,heroUploadsDir),
  filename:(req,file,cb)=>{const ext=heroVideoMimeExt[file.mimetype]||'';cb(null,`video-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`)}
});
const heroVideoUpload=multer({storage:heroVideoStorage,limits:{fileSize:120*1024*1024,files:1},fileFilter:(req,file,cb)=>heroVideoMimeExt[file.mimetype]?cb(null,true):cb(new Error('El video de portada debe ser MP4 o WEBM.'))});
function uploadHeroVideo(req,res,next){heroVideoUpload.single('video')(req,res,err=>{if(!err)return next();const message=err.code==='LIMIT_FILE_SIZE'?'El video supera el límite de 120 MB.':(err.message||'No fue posible subir el video.');res.status(400).json({error:message})})}

// V127.28 — recursos personalizables de la página de mantenimiento.
const maintenanceUploadsDir=path.join(root,'assets','maintenance','uploads');
fs.mkdirSync(maintenanceUploadsDir,{recursive:true});
const maintenanceImageStorage=multer.diskStorage({
  destination:(req,file,cb)=>cb(null,maintenanceUploadsDir),
  filename:(req,file,cb)=>{const ext=imageMimeExt[file.mimetype]||'';cb(null,`background-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`)}
});
const maintenanceImageUpload=multer({storage:maintenanceImageStorage,limits:{fileSize:12*1024*1024,files:1},fileFilter:(req,file,cb)=>imageMimeExt[file.mimetype]?cb(null,true):cb(new Error('La imagen de mantenimiento debe ser JPG, PNG o WEBP.'))});
function uploadMaintenanceImage(req,res,next){maintenanceImageUpload.single('image')(req,res,err=>{if(!err)return next();const message=err.code==='LIMIT_FILE_SIZE'?'La imagen supera el límite de 12 MB.':(err.message||'No fue posible subir la imagen.');res.status(400).json({error:message})})}
const maintenanceVideoStorage=multer.diskStorage({
  destination:(req,file,cb)=>cb(null,maintenanceUploadsDir),
  filename:(req,file,cb)=>{const ext=heroVideoMimeExt[file.mimetype]||'';cb(null,`background-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`)}
});
const maintenanceVideoUpload=multer({storage:maintenanceVideoStorage,limits:{fileSize:120*1024*1024,files:1},fileFilter:(req,file,cb)=>heroVideoMimeExt[file.mimetype]?cb(null,true):cb(new Error('El video de mantenimiento debe ser MP4 o WEBM.'))});
function uploadMaintenanceVideo(req,res,next){maintenanceVideoUpload.single('video')(req,res,err=>{if(!err)return next();const message=err.code==='LIMIT_FILE_SIZE'?'El video supera el límite de 120 MB.':(err.message||'No fue posible subir el video.');res.status(400).json({error:message})})}
const maintenanceAssetUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1},fileFilter:(req,file,cb)=>{
  const ext=path.extname(String(file.originalname||'')).toLowerCase();
  if(!['.svg','.png','.jpg','.jpeg','.webp'].includes(ext))return cb(new Error('El logo o icono debe ser SVG, PNG, JPG o WEBP.'));
  cb(null,true);
}});
function uploadMaintenanceAsset(req,res,next){maintenanceAssetUpload.single('asset')(req,res,err=>{if(!err)return next();const message=err.code==='LIMIT_FILE_SIZE'?'El archivo supera el límite de 5 MB.':(err.message||'No fue posible subir el recurso.');res.status(400).json({error:message})})}
const ribbonIconUploadsDir=path.join(root,'assets','portada','separadores','uploads');
fs.mkdirSync(ribbonIconUploadsDir,{recursive:true});
const ribbonSvgUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:512*1024,files:1},fileFilter:(req,file,cb)=>{const ext=path.extname(String(file.originalname||'')).toLowerCase();const allowedMime=['image/svg+xml','text/xml','application/xml','application/octet-stream'];if(ext!=='.svg')return cb(new Error('El separador debe ser un archivo SVG.'));if(!allowedMime.includes(file.mimetype))return cb(new Error('El archivo seleccionado no parece ser un SVG válido.'));cb(null,true)}});
function uploadRibbonSvg(req,res,next){ribbonSvgUpload.single('icon')(req,res,err=>{if(!err)return next();const message=err.code==='LIMIT_FILE_SIZE'?'El SVG supera el límite de 512 KB.':(err.message||'No fue posible subir el SVG.');res.status(400).json({error:message})})}
const benefitUploadsDir=path.join(root,'assets','beneficios','uploads');
fs.mkdirSync(benefitUploadsDir,{recursive:true});
const benefitIconUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:2*1024*1024,files:1},fileFilter:(req,file,cb)=>{
  const ext=path.extname(String(file.originalname||'')).toLowerCase();
  const allowed=['.svg','.png','.jpg','.jpeg','.webp'];
  if(!allowed.includes(ext))return cb(new Error('El archivo debe ser SVG, PNG, JPG o WEBP.'));
  cb(null,true);
}});
function uploadBenefitIcon(req,res,next){benefitIconUpload.single('icon')(req,res,err=>{if(!err)return next();const message=err.code==='LIMIT_FILE_SIZE'?'El icono supera el límite de 2 MB.':(err.message||'No fue posible subir el icono.');res.status(400).json({error:message})})}
function rasterLooksValid(buffer,ext){
  const b=Buffer.from(buffer||'');
  if(ext==='.png')return b.length>8&&b.slice(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if(ext==='.jpg'||ext==='.jpeg')return b.length>3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff;
  if(ext==='.webp')return b.length>12&&b.slice(0,4).toString('ascii')==='RIFF'&&b.slice(8,12).toString('ascii')==='WEBP';
  return false;
}
const transferProofsDir=path.join(__dirname,'data','transfer-proofs');
fs.mkdirSync(transferProofsDir,{recursive:true});
const transferProofUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:8*1024*1024,files:1},fileFilter:(req,file,cb)=>{
  const ext=path.extname(String(file.originalname||'')).toLowerCase();
  const allowed=['.jpg','.jpeg','.png','.webp','.pdf'];
  if(!allowed.includes(ext))return cb(new Error('El comprobante debe ser JPG, PNG, WEBP o PDF.'));
  cb(null,true);
}});
function uploadTransferProof(req,res,next){transferProofUpload.single('proof')(req,res,err=>{if(!err)return next();const message=err.code==='LIMIT_FILE_SIZE'?'El comprobante supera el límite de 8 MB.':(err.message||'No fue posible subir el comprobante.');res.status(400).json({error:message})})}
function validatedProofExtension(buffer){
  const b=Buffer.from(buffer||'');
  if(b.length>8&&b.slice(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])))return '.png';
  if(b.length>3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return '.jpg';
  if(b.length>12&&b.slice(0,4).toString('ascii')==='RIFF'&&b.slice(8,12).toString('ascii')==='WEBP')return '.webp';
  if(b.length>5&&b.slice(0,5).toString('ascii')==='%PDF-')return '.pdf';
  return '';
}
function removeStoredTransferProof(storedName){
  const name=path.basename(String(storedName||''));
  if(!name)return;
  try{fs.unlinkSync(path.join(transferProofsDir,name));}catch{}
}

function validateRibbonSvg(buffer){
  const svg=Buffer.from(buffer||'').toString('utf8').trim();
  if(!/<svg\b[^>]*>/i.test(svg))throw new Error('El archivo no contiene un SVG válido.');
  const blocked=[/<!doctype/i,/<!entity/i,/<script\b/i,/<foreignObject\b/i,/<iframe\b/i,/<object\b/i,/<embed\b/i,/javascript\s*:/i,/vbscript\s*:/i,/\son[a-z]+\s*=/i,/(?:href|xlink:href)\s*=\s*["']\s*(?:https?:|\/\/|data:)/i,/url\(\s*["']?\s*(?:https?:|\/\/|data:)/i,/@import/i];
  if(blocked.some(re=>re.test(svg)))throw new Error('El SVG contiene elementos o referencias externas no permitidas.');
  return svg;
}

const secretKey=String(process.env.STRIPE_SECRET_KEY||'').trim();
const publishableKey=String(process.env.STRIPE_PUBLISHABLE_KEY||'').trim();
const webhookSecret=String(process.env.STRIPE_WEBHOOK_SECRET||'').trim();
const stripe=secretKey?new Stripe(secretKey):null;
function stripeKeyMode(key){
  const value=String(key||'').trim();
  if(value.startsWith('sk_test_')||value.startsWith('pk_test_')||value.startsWith('rk_test_'))return 'test';
  if(value.startsWith('sk_live_')||value.startsWith('pk_live_')||value.startsWith('rk_live_'))return 'live';
  return 'unknown';
}
const stripeSecretMode=stripeKeyMode(secretKey);
const stripePublishableMode=stripeKeyMode(publishableKey);
const stripeKeyMismatch=!!(secretKey&&publishableKey&&stripeSecretMode!=='unknown'&&stripePublishableMode!=='unknown'&&stripeSecretMode!==stripePublishableMode);
const adminPassword=String(process.env.ADMIN_PASSWORD||'');
const rawAdminPath=String(process.env.ADMIN_PATH||'').trim();
const adminPath=rawAdminPath
  ? '/'+rawAdminPath.replace(/^\/+|\/+$/g,'').replace(/[^a-zA-Z0-9_-]/g,'')
  : '';
const blockedAdminPaths=new Set(['/admin','/admin/','/admin.html']);
const loginAttempts=new Map();
function requestIp(req){
  return String(req.ip||req.socket?.remoteAddress||'unknown').trim();
}
function createRateLimiter({windowMs=15*60*1000,max=20,prefix='',keyFn,message='Demasiadas solicitudes. Inténtalo nuevamente en unos minutos.'}={}){
  const store=new Map();
  let calls=0;
  return function rateLimiter(req,res,next){
    const now=Date.now();
    if((++calls%100)===0||store.size>5000){
      for(const [key,row] of store){if(!row||row.resetAt<=now)store.delete(key)}
      if(store.size>10000){
        const oldest=[...store.entries()].sort((a,b)=>(a[1]?.resetAt||0)-(b[1]?.resetAt||0)).slice(0,store.size-8000);
        for(const [key] of oldest)store.delete(key);
      }
    }
    const rawKey=String(keyFn?keyFn(req):requestIp(req)||'unknown').slice(0,500);
    const key=`${prefix}${rawKey}`;
    let row=store.get(key);
    if(!row||row.resetAt<=now)row={count:0,resetAt:now+windowMs};
    if(row.count>=max){
      res.setHeader('Retry-After',String(Math.max(1,Math.ceil((row.resetAt-now)/1000))));
      return res.status(429).json({error:message});
    }
    row.count+=1;
    store.set(key,row);
    next();
  };
}
const registerLimiter=createRateLimiter({windowMs:60*60*1000,max:8,prefix:'register:'});
const checkoutLimiter=createRateLimiter({windowMs:15*60*1000,max:30,prefix:'checkout:'});
const manualOrderLimiter=createRateLimiter({windowMs:30*60*1000,max:8,prefix:'manual-order:',message:'Has creado varios pedidos recientemente. Espera unos minutos antes de intentarlo nuevamente.'});
const orderLookupLimiter=createRateLimiter({windowMs:15*60*1000,max:12,prefix:'order-lookup:',message:'Has realizado varias consultas. Espera unos minutos antes de volver a consultar un pedido.'});
const transferProofLimiter=createRateLimiter({windowMs:30*60*1000,max:8,prefix:'transfer-proof:'});
const promotionsLimiter=createRateLimiter({windowMs:15*60*1000,max:60,prefix:'promotions:'});
const paymentFinalizeLocks=new Map();
async function runPaymentFinalizationOnce(key,fn){
  const normalized=String(key||'').slice(0,240);
  if(!normalized)return fn();
  const current=paymentFinalizeLocks.get(normalized);
  if(current)return current;
  const pending=Promise.resolve().then(fn).finally(()=>{if(paymentFinalizeLocks.get(normalized)===pending)paymentFinalizeLocks.delete(normalized)});
  paymentFinalizeLocks.set(normalized,pending);
  return pending;
}
function loginWindow(ip){
  const now=Date.now(),windowMs=15*60*1000;
  const current=loginAttempts.get(ip);
  if(!current||current.resetAt<=now){
    const fresh={count:0,resetAt:now+windowMs};
    loginAttempts.set(ip,fresh);
    return fresh;
  }
  return current;
}
const adminSessions=new Map();
const customerLoginAttempts=new Map();
const contactAttempts=new Map();
const accountActionAttempts=new Map();
const newsletterAttempts=new Map();
const legacyAttemptMaps=[loginAttempts,customerLoginAttempts,contactAttempts,accountActionAttempts,newsletterAttempts];

// V127.9 — protección temporal de Colaboraciones administrable desde el panel.
// COLLABORATIONS_PASSWORD solo sirve como valor inicial la primera vez.
// Después, el estado y el hash de la contraseña se guardan en server/data/collaborations-access.json.
const collaborationsSessions=new Map();
const collaborationsLoginAttempts=new Map();
legacyAttemptMaps.push(collaborationsLoginAttempts);
const pruneTimer=setInterval(()=>{
  const now=Date.now();
  for(const map of legacyAttemptMaps){
    for(const [key,row] of map){if(!row||Number(row.resetAt||0)<=now)map.delete(key)}
  }
  for(const [token,row] of adminSessions){if(!row||Number(row.expiresAt||0)<=now)adminSessions.delete(token)}
  for(const [token,row] of collaborationsSessions){if(!row||Number(row.expiresAt||0)<=now)collaborationsSessions.delete(token)}
},5*60*1000);
if(typeof pruneTimer.unref==='function')pruneTimer.unref();
function collaborationsLoginWindow(ip){
  const now=Date.now(),windowMs=15*60*1000;
  const current=collaborationsLoginAttempts.get(ip);
  if(!current||current.resetAt<=now){
    const fresh={count:0,resetAt:now+windowMs};
    collaborationsLoginAttempts.set(ip,fresh);
    return fresh;
  }
  return current;
}
function newsletterWindow(ip){
  const now=Date.now(),windowMs=15*60*1000;
  const current=newsletterAttempts.get(ip);
  if(!current||current.resetAt<=now){const fresh={count:0,resetAt:now+windowMs};newsletterAttempts.set(ip,fresh);return fresh}
  return current;
}
function contactWindow(ip){
  const now=Date.now(),windowMs=15*60*1000;
  const current=contactAttempts.get(ip);
  if(!current||current.resetAt<=now){
    const fresh={count:0,resetAt:now+windowMs};
    contactAttempts.set(ip,fresh);
    return fresh;
  }
  return current;
}
function customerLoginWindow(ip){
  const now=Date.now(),windowMs=15*60*1000;
  const current=customerLoginAttempts.get(ip);
  if(!current||current.resetAt<=now){
    const fresh={count:0,resetAt:now+windowMs};
    customerLoginAttempts.set(ip,fresh);
    return fresh;
  }
  return current;
}
function accountActionWindow(key){
  const now=Date.now(),windowMs=15*60*1000;
  const current=accountActionAttempts.get(key);
  if(!current||current.resetAt<=now){
    const fresh={count:0,resetAt:now+windowMs};
    accountActionAttempts.set(key,fresh);
    return fresh;
  }
  return current;
}
function parseCookies(req){
  return Object.fromEntries(String(req.headers.cookie||'').split(';').map(v=>v.trim()).filter(Boolean).map(v=>{const i=v.indexOf('=');return i<0?[v,'']:[v.slice(0,i),decodeURIComponent(v.slice(i+1))]}));
}
async function customerSession(req){
  const token=parseCookies(req).nr_customer_session||'';
  const customer=await getCustomerFromSession(token);
  return customer?{token,customer}:null;
}
function setCustomerCookie(req,res,token){
  const secure=(req.secure||process.env.NODE_ENV==='production')?'; Secure':'';
  res.setHeader('Set-Cookie',`nr_customer_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure}`);
}
function clearCustomerCookie(req,res){
  const secure=(req.secure||process.env.NODE_ENV==='production')?'; Secure':'';
  res.setHeader('Set-Cookie',`nr_customer_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
}
async function requireCustomer(req,res,next){
  try{
    const current=await customerSession(req);
    if(!current)return res.status(401).json({error:'Inicia sesión para continuar.'});
    req.customer=current.customer;
    req.customerToken=current.token;
    next();
  }catch(err){next(err)}
}
function safeEqual(a,b){
  const A=Buffer.from(String(a||'')),B=Buffer.from(String(b||''));
  return A.length===B.length&&crypto.timingSafeEqual(A,B);
}
function collaborationsSession(req){
  const token=parseCookies(req).nr_collaborations_session||'';
  const session=token&&collaborationsSessions.get(token);
  if(!session)return null;
  if(session.expiresAt<Date.now()){collaborationsSessions.delete(token);return null;}
  session.expiresAt=Date.now()+12*60*60*1000;
  return {token,session};
}
function setCollaborationsCookie(req,res,token){
  const secure=(req.secure||process.env.NODE_ENV==='production')?'; Secure':'';
  res.setHeader('Set-Cookie',`nr_collaborations_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure}`);
}
function clearCollaborationsCookie(req,res){
  const secure=(req.secure||process.env.NODE_ENV==='production')?'; Secure':'';
  res.setHeader('Set-Cookie',`nr_collaborations_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`);
}
function adminSession(req){
  const token=parseCookies(req).nr_admin_session;
  const session=token&&adminSessions.get(token);
  if(!session)return null;
  if(session.expiresAt<Date.now()){adminSessions.delete(token);return null;}
  session.expiresAt=Date.now()+8*60*60*1000;
  return {token,session};
}
function requireAdmin(req,res,next){
  if(!adminPassword)return res.status(503).json({error:'Configura ADMIN_PASSWORD en server/.env.'});
  if(!adminSession(req))return res.status(401).json({error:'Sesión de administración no válida.'});
  next();
}

function escapeMaintenanceHtml(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function maintenanceAssetUrl(value){const clean=String(value||'').replace(/^\/+/, '');return clean?'/'+clean:''}
function maintenanceTextStyle(block={}){
  const family=String(block.fontFamily||'Helvetica Neue').replace(/["'<>]/g,'');
  return [
    `width:min(${Number(block.maxWidth)||700}px,92vw)`,
    `font-family:${family.includes(' ')?`"${family}"`:family},Arial,sans-serif`,
    `font-size:${Number(block.fontSize)||16}px`,
    `font-weight:${Number(block.fontWeight)||400}`,
    `font-style:${block.italic?'italic':'normal'}`,
    `color:${block.color||'#242424'}`,
    `background:${block.backgroundColor||'transparent'}`,
    `padding:${Number(block.paddingY)||0}px ${Number(block.paddingX)||0}px`,
    `letter-spacing:${Number(block.letterSpacing)||0}px`,
    `line-height:${Number(block.lineHeight)||1.4}`,
    `text-align:${block.align||'center'}`,
    `text-transform:${block.uppercase?'uppercase':'none'}`
  ].join(';');
}
function maintenanceHtml(){
  const s=maintenanceMode.status();
  const t=s.texts||{};
  const bg=s.background||{};
  const logo=s.logo||{};
  const icon=s.icon||{};
  let html=fs.readFileSync(path.join(root,'maintenance.html'),'utf8');
  const replacements={
    PAGE_TITLE:t.title?.text||'Sitio en mantenimiento',
    BG_MODE:bg.mode||'color',BG_COLOR:bg.color||'#f7f7f5',BG_X:bg.positionX??50,BG_Y:bg.positionY??50,
    BG_IMAGE_CSS:bg.image?`url("${maintenanceAssetUrl(bg.image)}")`:'none',BG_VIDEO_URL:maintenanceAssetUrl(bg.video),
    VIDEO_HIDDEN:bg.video?'':'hidden',OVERLAY_COLOR:bg.overlayColor||'#000000',OVERLAY_OPACITY:bg.overlayOpacity??0,
    LOGO_URL:maintenanceAssetUrl(logo.src||'assets/logo-ninos-rancios.svg'),LOGO_HIDDEN:logo.visible===false?'hidden':'',LOGO_X:logo.x??50,LOGO_Y:logo.y??20,LOGO_WIDTH:logo.width??310,LOGO_MOBILE_WIDTH:logo.mobileWidth??230,
    ICON_URL:maintenanceAssetUrl(icon.src),ICON_HIDDEN:icon.visible&&icon.src?'':'hidden',ICON_X:icon.x??50,ICON_Y:icon.y??34,ICON_WIDTH:icon.width??70,ICON_MOBILE_WIDTH:icon.mobileWidth??58
  };
  for(const [key,prefix] of [['eyebrow','EYEBROW'],['title','TITLE'],['message','MESSAGE'],['footer','FOOTER']]){
    const b=t[key]||{};
    replacements[`${prefix}_X`]=b.x??50;replacements[`${prefix}_Y`]=b.y??50;
    replacements[`${prefix}_STYLE`]=maintenanceTextStyle(b);replacements[`${prefix}_MOBILE_SIZE`]=b.mobileFontSize??14;
    replacements[`${prefix}_HIDDEN`]=b.visible===false?'hidden':'';replacements[`${prefix}_TEXT`]=b.text||'';
  }
  const rawCssKeys=new Set(['BG_COLOR','BG_X','BG_Y','BG_IMAGE_CSS','OVERLAY_COLOR','OVERLAY_OPACITY','LOGO_X','LOGO_Y','LOGO_WIDTH','LOGO_MOBILE_WIDTH','ICON_X','ICON_Y','ICON_WIDTH','ICON_MOBILE_WIDTH','EYEBROW_X','EYEBROW_Y','EYEBROW_STYLE','EYEBROW_MOBILE_SIZE','TITLE_X','TITLE_Y','TITLE_STYLE','TITLE_MOBILE_SIZE','MESSAGE_X','MESSAGE_Y','MESSAGE_STYLE','MESSAGE_MOBILE_SIZE','FOOTER_X','FOOTER_Y','FOOTER_STYLE','FOOTER_MOBILE_SIZE']);
  const rawTokenKeys=new Set(['VIDEO_HIDDEN','LOGO_HIDDEN','ICON_HIDDEN','EYEBROW_HIDDEN','TITLE_HIDDEN','MESSAGE_HIDDEN','FOOTER_HIDDEN']);
  for(const [key,value] of Object.entries(replacements)){
    const rendered=(rawCssKeys.has(key)||rawTokenKeys.has(key))?String(value??''):escapeMaintenanceHtml(value);
    html=html.replaceAll(`{{${key}}}`,rendered);
  }
  return html;
}
function sendMaintenancePage(res,status=503){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  if(status===503)res.setHeader('Retry-After','3600');
  return res.status(status).type('html').send(maintenanceHtml());
}
function notifyOrderCreated(order,source='pedido'){
  if(!order?.orderNumber)return;
  emailService.notifyOrderCreated(order).then(result=>{
    const sent=[result?.customer?.sent?'cliente':'',result?.store?.sent?'tienda':''].filter(Boolean).join(' + ');
    if(sent)console.log(`Correo ${source} ${order.orderNumber}: enviado a ${sent}.`);
  }).catch(err=>console.error(`Correo ${source} ${order.orderNumber}:`,err.message));
}
function notifyOrderStatus(order){
  if(!order?.orderNumber)return;
  emailService.notifyOrderStatus(order).then(result=>{if(result?.sent)console.log(`Correo de estado ${order.orderNumber}: ${order.status}`)}).catch(err=>console.error(`Correo de estado ${order.orderNumber}:`,err.message));
}
async function adminProductList(){
  const inv=await getInventory();
  return getProducts().map(p=>{
    const variants=inv[p.id]||{};
    let stock=0;
    for(const sizes of Object.values(variants))for(const qty of Object.values(sizes||{}))stock+=Math.max(0,Number(qty)||0);
    return {...p,image:p.img||'',stock};
  });
}

app.post('/api/stripe/webhook',express.raw({type:'application/json'}),async(req,res)=>{
  if(!stripe||!webhookSecret)return res.status(503).send('Stripe webhook no configurado.');
  let event;
  try{event=stripe.webhooks.constructEvent(req.body,req.headers['stripe-signature'],webhookSecret)}
  catch(err){return res.status(400).send('Webhook inválido.');}
  try{
    if(event.type==='payment_intent.succeeded'){
      const paymentIntent=event.data.object;
      const order=await runPaymentFinalizationOnce(`stripe:${paymentIntent.id}`,()=>finalizeStripeOrder(stripe,paymentIntent.id));
      notifyOrderCreated(order,'Stripe');
      console.log('Pedido confirmado por webhook:',order.orderNumber);
    }
    res.json({received:true});
  }catch(err){console.error('Webhook finalize order error:',err.message);res.status(500).json({received:false});}
});


app.post('/api/paypal/webhook',express.raw({type:'application/json',limit:'250kb'}),async(req,res)=>{
  if(!paypal.isConfigured())return res.status(503).send('PayPal no configurado');
  if(!paypal.webhookConfigured())return res.status(503).send('PAYPAL_WEBHOOK_ID no configurado');
  let event;
  try{
    event=JSON.parse(Buffer.isBuffer(req.body)?req.body.toString('utf8'):String(req.body||''));
  }catch{
    return res.status(400).send('Payload inválido');
  }
  try{
    const valid=await paypal.verifyWebhookSignature(req.headers,event);
    if(!valid){
      console.warn('PayPal webhook rechazado: firma inválida.');
      return res.status(400).send('Firma inválida');
    }
    const type=String(event?.event_type||'');
    if(type==='PAYMENT.CAPTURE.COMPLETED'){
      const orderId=String(event?.resource?.supplementary_data?.related_ids?.order_id||'').trim();
      if(orderId){
        const existing=await findOrderByPayPalOrderId(orderId);
        if(!existing){
          const paypalOrder=await paypal.getOrder(orderId);
          const order=await runPaymentFinalizationOnce(`paypal:${orderId}`,()=>finalizePayPalOrder(paypalOrder,orderId));
          notifyOrderCreated(order,'PayPal');
          console.log(`PayPal webhook: pago completado y pedido confirmado ${order.orderNumber} (${orderId})`);
        }else{
          notifyOrderCreated(existing,'PayPal');
          console.log(`PayPal webhook: pago completado ya procesado ${existing.orderNumber} (${orderId})`);
        }
      }else{
        console.log('PayPal webhook: PAYMENT.CAPTURE.COMPLETED recibido sin order_id relacionado.');
      }
    }else if(type==='PAYMENT.CAPTURE.DENIED'){
      console.warn(`PayPal webhook: pago denegado (${event?.resource?.id||'sin id'}).`);
    }else if(type==='PAYMENT.CAPTURE.REFUNDED'){
      console.log(`PayPal webhook: reembolso recibido (${event?.resource?.id||'sin id'}).`);
    }else{
      console.log(`PayPal webhook recibido: ${type||'evento sin tipo'}`);
    }
    return res.sendStatus(200);
  }catch(err){
    console.error('PayPal webhook error:',err.message);
    return res.status(500).send('Error procesando webhook');
  }
});


app.post('/api/mercadopago/webhook',express.json({limit:'250kb'}),(req,res)=>{
  if(!mercadopago.isConfigured())return res.status(503).send('Mercado Pago no configurado');
  if(!mercadopago.webhookConfigured())return res.status(503).send('MERCADOPAGO_WEBHOOK_SECRET no configurado');
  const dataId=String(req.query?.['data.id']||req.body?.data?.id||'').trim();
  if(!dataId)return res.status(400).send('Falta data.id');
  if(!mercadopago.verifyWebhookSignature(req.headers,dataId)){
    console.warn('Mercado Pago webhook rechazado: firma inválida.');
    return res.status(401).send('Firma inválida');
  }
  const type=String(req.query?.type||req.body?.type||'').trim().toLowerCase();
  res.sendStatus(200);
  if(type!=='payment')return;
  setImmediate(async()=>{
    try{
      const existing=await findOrderByMercadoPagoPaymentId(dataId);
      const payment=await mercadopago.getPayment(dataId);
      if(mercadopago.paid(payment)){
        if(existing){
          notifyOrderCreated(existing,'Mercado Pago');
          console.log(`Mercado Pago webhook: pago aprobado ya procesado ${existing.orderNumber} (${dataId})`);
        }else{
          const order=await runPaymentFinalizationOnce(`mercadopago:${dataId}`,()=>finalizeMercadoPagoPayment(payment,payment.external_reference||''));
          notifyOrderCreated(order,'Mercado Pago');
          console.log(`Mercado Pago webhook: pago aprobado y pedido confirmado ${order.orderNumber} (${dataId})`);
        }
      }else{
        console.log(`Mercado Pago webhook: pago ${dataId} en ${payment.status||'sin estado'} / ${payment.status_detail||'sin detalle'}`);
      }
    }catch(err){console.error('Mercado Pago webhook error:',err.message)}
  });
});

app.use(express.json({limit:'100kb'}));
app.get('/api/email/config',(req,res)=>res.json(emailService.publicConfig()));
app.post('/api/newsletter/subscribe',async(req,res)=>{
  try{
    if(!newsletter.isConfigured())return res.status(503).json({error:'La suscripción al boletín todavía no está configurada.'});
    const ip=requestIp(req),attempt=newsletterWindow(ip);
    if(attempt.count>=6)return res.status(429).json({error:'Has realizado varios intentos. Espera unos minutos antes de volver a intentarlo.'});
    const body=req.body||{};
    if(String(body.website||'').trim())return res.json({ok:true,message:'¡Gracias por unirte!'});
    if(body.consent!==true)return res.status(400).json({error:'Acepta recibir novedades y promociones para suscribirte.'});
    const email=emailService.emailAddress(body.email);
    if(!email)return res.status(400).json({error:'Ingresa un correo electrónico válido.'});
    attempt.count++;
    await newsletter.subscribe(email);
    let welcomeEmailSent=false;
    try{
      const welcome=await emailService.sendNewsletterWelcome(email);
      welcomeEmailSent=!!welcome?.sent;
    }catch(mailErr){
      console.error('Newsletter welcome email:',mailErr.message);
    }
    res.json({ok:true,welcomeEmailSent,message:'¡Gracias por unirte! Tu correo quedó suscrito a Niños Rancios.'});
  }catch(err){
    console.error('Newsletter:',err.message);
    res.status(502).json({error:'No fue posible completar la suscripción en este momento. Inténtalo nuevamente.'});
  }
});
app.post('/api/contact',async(req,res)=>{
  try{
    if(!emailService.isConfigured())return res.status(503).json({error:'El servicio de correo todavía no está configurado.'});
    const ip=requestIp(req),attempt=contactWindow(ip);
    if(attempt.count>=5)return res.status(429).json({error:'Has enviado varios mensajes. Espera unos minutos antes de intentarlo nuevamente.'});
    const body=req.body||{};
    if(String(body.website||'').trim())return res.json({ok:true});
    const nombre=String(body.nombre||'').trim().slice(0,100);
    const apellidos=String(body.apellidos||'').trim().slice(0,100);
    const email=emailService.emailAddress(body.email);
    const asunto=String(body.asunto||'').trim().slice(0,160);
    const mensaje=String(body.mensaje||'').trim().slice(0,4000);
    if(!nombre)return res.status(400).json({error:'Ingresa tu nombre.'});
    if(!email)return res.status(400).json({error:'Ingresa un correo electrónico válido.'});
    if(mensaje.length<5)return res.status(400).json({error:'Escribe un mensaje antes de enviarlo.'});
    attempt.count++;
    await emailService.sendContactMessage({nombre,apellidos,email,asunto,mensaje});
    res.json({ok:true,message:'Recibimos tu mensaje. Te responderemos lo antes posible.'});
  }catch(err){
    console.error('Formulario de contacto:',err.message);
    res.status(502).json({error:'No fue posible enviar el mensaje en este momento. Inténtalo nuevamente.'});
  }
});
app.post('/api/account/register',registerLimiter,async(req,res)=>{
  try{
    const customer=await createCustomer(req.body||{});
    const token=await createCustomerSession(customer.id);
    setCustomerCookie(req,res,token);
    let welcomeEmailSent=false;
    try{await emailService.sendWelcome(customer);welcomeEmailSent=true}catch(mailErr){console.error('Correo de bienvenida:',mailErr.message)}
    res.status(201).json({ok:true,customer,authenticated:true,welcomeEmailSent,message:'Cuenta creada correctamente.'});
  }catch(err){res.status(400).json({error:err.message||'No fue posible crear la cuenta.'});}
});
app.post('/api/account/login',async(req,res)=>{
  const ip=requestIp(req),attempt=customerLoginWindow(ip);
  if(attempt.count>=8)return res.status(429).json({error:'Demasiados intentos. Espera unos minutos antes de volver a intentar.'});
  try{
    const customer=await authenticateCustomer(req.body?.email,req.body?.password);
    if(!customer){attempt.count+=1;return res.status(401).json({error:'Correo o contraseña incorrectos.'});}
    const activeCustomer=customer.emailVerified===false?await markCustomerEmailVerified(customer.id):customer;
    customerLoginAttempts.delete(ip);
    const token=await createCustomerSession(activeCustomer.id);
    setCustomerCookie(req,res,token);
    res.json({ok:true,customer:activeCustomer});
  }catch(err){console.error('Inicio de sesión:',err.message);res.status(500).json({error:'No fue posible iniciar sesión en este momento.'});}
});
app.post('/api/account/verification/resend',async(req,res)=>{
  const ip=requestIp(req),attempt=accountActionWindow(`verify:${ip}`);
  if(attempt.count>=5)return res.status(429).json({error:'Espera unos minutos antes de solicitar otro correo.'});
  attempt.count+=1;
  const generic='Si la cuenta existe y necesita verificación, enviaremos un nuevo correo.';
  try{
    const customer=await getCustomerByEmail(req.body?.email);
    if(customer&&!customer.emailVerified){
      const token=issueCustomerActionToken('verify-email',customer.id,{},24*60*60*1000);
      await emailService.sendAccountVerification(customer,token);
    }
  }catch(err){console.error('Reenviar verificación:',err.message)}
  res.json({ok:true,message:generic});
});
app.post('/api/account/verify-email',async(req,res)=>{
  try{
    const token=String(req.body?.token||'').trim();
    const action=getCustomerActionToken(token,'verify-email');
    if(!action)return res.status(400).json({error:'El enlace de verificación no es válido o ya caducó.'});
    const customer=await markCustomerEmailVerified(action.customerId);
    consumeCustomerActionToken(token,'verify-email');
    revokeCustomerActionTokens(customer.id,'verify-email');
    try{await emailService.sendWelcome(customer)}catch(err){console.error('Correo de bienvenida:',err.message)}
    await destroyCustomerSessionsByCustomerId(customer.id);
    const sessionToken=await createCustomerSession(customer.id);
    setCustomerCookie(req,res,sessionToken);
    res.json({ok:true,customer,message:'Tu correo quedó verificado y tu cuenta ya está activa.'});
  }catch(err){res.status(400).json({error:err.message||'No fue posible verificar el correo.'});}
});
app.post('/api/account/password/forgot',async(req,res)=>{
  const ip=requestIp(req),attempt=accountActionWindow(`forgot:${ip}`);
  if(attempt.count>=5)return res.status(429).json({error:'Espera unos minutos antes de solicitar otro enlace.'});
  attempt.count+=1;
  const generic='Si existe una cuenta asociada a ese correo, recibirás instrucciones para restablecer tu contraseña.';
  try{
    const customer=await getCustomerByEmail(req.body?.email);
    if(customer){
      const token=issueCustomerActionToken('password-reset',customer.id,{},60*60*1000);
      await emailService.sendPasswordReset(customer,token);
    }
  }catch(err){console.error('Recuperar contraseña:',err.message)}
  res.json({ok:true,message:generic});
});
app.post('/api/account/password/reset',async(req,res)=>{
  try{
    const token=String(req.body?.token||'').trim();
    const action=getCustomerActionToken(token,'password-reset');
    if(!action)return res.status(400).json({error:'El enlace para restablecer la contraseña no es válido o ya caducó.'});
    const customer=await setCustomerPassword(action.customerId,req.body?.password,{verifyEmail:true});
    consumeCustomerActionToken(token,'password-reset');
    revokeCustomerActionTokens(customer.id,'password-reset');
    await destroyCustomerSessionsByCustomerId(customer.id);
    try{await emailService.sendPasswordChanged(customer)}catch(err){console.error('Aviso de contraseña:',err.message)}
    res.json({ok:true,message:'Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión.'});
  }catch(err){res.status(400).json({error:err.message||'No fue posible cambiar la contraseña.'});}
});
app.post('/api/account/logout',async(req,res)=>{
  try{const current=await customerSession(req);if(current)await destroyCustomerSession(current.token)}catch(err){console.error('Cerrar sesión:',err.message)}
  clearCustomerCookie(req,res);res.json({ok:true});
});
app.get('/api/account/session',async(req,res)=>{
  try{const current=await customerSession(req);res.json({authenticated:!!current,customer:current?.customer||null})}
  catch(err){console.error('Sesión de cliente:',err.message);res.status(500).json({authenticated:false,customer:null,error:'No fue posible consultar la sesión.'})}
});
app.patch('/api/account/profile',requireCustomer,async(req,res)=>{
  try{res.json({ok:true,customer:await updateCustomerProfile(req.customer.id,req.body||{})});}
  catch(err){res.status(400).json({error:err.message});}
});
app.patch('/api/account/address',requireCustomer,async(req,res)=>{
  try{res.json({ok:true,customer:await updateCustomerAddress(req.customer.id,req.body||{})});}
  catch(err){res.status(400).json({error:err.message});}
});
app.post('/api/account/password/change',requireCustomer,async(req,res)=>{
  try{
    const customer=await changeCustomerPassword(req.customer.id,req.body?.currentPassword,req.body?.newPassword);
    await destroyCustomerSessionsByCustomerId(customer.id);
    const sessionToken=await createCustomerSession(customer.id);
    setCustomerCookie(req,res,sessionToken);
    try{await emailService.sendPasswordChanged(customer)}catch(err){console.error('Aviso de contraseña:',err.message)}
    res.json({ok:true,customer,message:'Contraseña actualizada.'});
  }catch(err){res.status(400).json({error:err.message||'No fue posible cambiar la contraseña.'});}
});
app.post('/api/account/email/change-request',requireCustomer,async(req,res)=>{
  const ip=requestIp(req),attempt=accountActionWindow(`email-change:${ip}:${req.customer.id}`);
  if(attempt.count>=5)return res.status(429).json({error:'Espera unos minutos antes de solicitar otro cambio de correo.'});
  try{
    if(!await verifyCustomerPassword(req.customer.id,req.body?.password))return res.status(400).json({error:'La contraseña actual no es correcta.'});
    const newEmail=String(req.body?.newEmail||'').trim().toLowerCase();
    if(!await emailAvailable(newEmail,req.customer.id))return res.status(400).json({error:'Ingresa otro correo electrónico válido y disponible.'});
    const token=issueCustomerActionToken('email-change',req.customer.id,{newEmail},60*60*1000);
    await emailService.sendEmailChangeVerification(req.customer,newEmail,token);
    attempt.count+=1;
    res.json({ok:true,message:`Enviamos un enlace de confirmación a ${newEmail}.`});
  }catch(err){res.status(400).json({error:err.message||'No fue posible solicitar el cambio de correo.'});}
});
app.post('/api/account/email/change-confirm',async(req,res)=>{
  try{
    const token=String(req.body?.token||'').trim();
    const action=getCustomerActionToken(token,'email-change');
    if(!action)return res.status(400).json({error:'El enlace para cambiar el correo no es válido o ya caducó.'});
    const current=await getCustomerById(action.customerId);
    if(!current)return res.status(400).json({error:'La cuenta ya no existe.'});
    const result=await changeCustomerEmail(action.customerId,action.extra?.newEmail);
    consumeCustomerActionToken(token,'email-change');
    revokeCustomerActionTokens(result.customer.id,'email-change');
    await destroyCustomerSessionsByCustomerId(result.customer.id);
    const sessionToken=await createCustomerSession(result.customer.id);
    setCustomerCookie(req,res,sessionToken);
    try{await Promise.all([emailService.sendEmailChangedNotice(result.oldEmail,result.customer),emailService.sendEmailChangedConfirmation(result.customer,result.oldEmail)])}catch(err){console.error('Avisos de cambio de correo:',err.message)}
    res.json({ok:true,customer:result.customer,message:'Tu correo electrónico fue actualizado y verificado.'});
  }catch(err){res.status(400).json({error:err.message||'No fue posible cambiar el correo.'});}
});
app.get('/api/account/orders',requireCustomer,async(req,res)=>{
  try{res.json({orders:await listCustomerOrders(req.customer.id)})}
  catch(err){res.status(500).json({error:'No fue posible cargar tus pedidos.'})}
});
async function customerFavoritesPayload(customerId){
  const ids=await getCustomerFavorites(customerId);
  const inventory=await getInventory();
  const products=Object.fromEntries(getProducts().map(product=>{
    const variants=inventory[product.id]||{};
    let stock=0;
    for(const sizes of Object.values(variants))for(const qty of Object.values(sizes||{}))stock+=Math.max(0,Number(qty)||0);
    const hasInventory=Object.prototype.hasOwnProperty.call(inventory,product.id);
    return [product.id,{...product,stock,soldOut:hasInventory&&stock<=0}];
  }));
  const favoriteIds=ids.filter(id=>!!products[id]);
  return {favoriteIds,products:favoriteIds.map(id=>products[id])};
}
app.get('/api/account/favorites',requireCustomer,async(req,res)=>{
  try{res.json(await customerFavoritesPayload(req.customer.id))}
  catch(err){res.status(400).json({error:err.message||'No fue posible cargar tus favoritos.'})}
});
app.post('/api/account/favorites/:productId',requireCustomer,async(req,res)=>{
  try{
    const productId=String(req.params.productId||'').trim();
    if(!getProductMap()[productId])return res.status(404).json({error:'El producto ya no está disponible.'});
    await addCustomerFavorite(req.customer.id,productId);
    res.json({ok:true,...await customerFavoritesPayload(req.customer.id)});
  }catch(err){res.status(400).json({error:err.message||'No fue posible guardar el producto en favoritos.'})}
});
app.delete('/api/account/favorites/:productId',requireCustomer,async(req,res)=>{
  try{
    await removeCustomerFavorite(req.customer.id,String(req.params.productId||'').trim());
    res.json({ok:true,...await customerFavoritesPayload(req.customer.id)});
  }catch(err){res.status(400).json({error:err.message||'No fue posible quitar el producto de favoritos.'})}
});

// V127.9 — acceso temporal a Colaboraciones
app.get('/api/collaborations/session',(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  const protectedPage=collaborationsAccess.isEnabled();
  res.json({configured:protectedPage,authenticated:!protectedPage||!!collaborationsSession(req)});
});
app.post('/api/collaborations/unlock',(req,res)=>{
  if(!collaborationsAccess.isEnabled())return res.json({ok:true,public:true});
  const ip=requestIp(req),attempt=collaborationsLoginWindow(ip);
  if(attempt.count>=5)return res.status(429).json({error:'Demasiados intentos. Espera unos minutos antes de volver a intentar.'});
  const password=String(req.body?.password||'');
  if(!collaborationsAccess.verify(password)){
    attempt.count+=1;
    return res.status(401).json({error:'Contraseña incorrecta.'});
  }
  collaborationsLoginAttempts.delete(ip);
  const token=crypto.randomBytes(32).toString('hex');
  collaborationsSessions.set(token,{createdAt:Date.now(),expiresAt:Date.now()+12*60*60*1000});
  setCollaborationsCookie(req,res,token);
  res.json({ok:true});
});
app.post('/api/collaborations/logout',(req,res)=>{
  const current=collaborationsSession(req);
  if(current)collaborationsSessions.delete(current.token);
  clearCollaborationsCookie(req,res);
  res.json({ok:true});
});

// V127.47 — cualquier cambio realizado desde el panel se refleja en PostgreSQL.
// Los módulos históricos pueden seguir leyendo/escribiendo JSON y archivos locales,
// pero esos archivos se restauran al arrancar y se vuelven a guardar tras cada cambio.
app.use('/api/admin',(req,res,next)=>{
  const method=String(req.method||'GET').toUpperCase();
  const mutating=['POST','PATCH','PUT','DELETE'].includes(method);
  const skip=req.path==='/login'||req.path==='/logout';
  if(mutating&&!skip){
    res.on('finish',()=>{if(res.statusCode>=200&&res.statusCode<400)adminState.scheduleSnapshot(`${method} /api/admin${req.path}`)});
  }
  next();
});

app.post('/api/admin/login',(req,res)=>{
  if(!adminPassword)return res.status(503).json({error:'Configura ADMIN_PASSWORD en server/.env antes de usar el panel.'});
  const ip=requestIp(req),attempt=loginWindow(ip);
  if(attempt.count>=5)return res.status(429).json({error:'Demasiados intentos. Espera unos minutos antes de volver a intentar.'});
  const password=String(req.body?.password||'');
  if(!safeEqual(password,adminPassword)){
    attempt.count+=1;
    return res.status(401).json({error:'Contraseña incorrecta.'});
  }
  loginAttempts.delete(ip);
  const token=crypto.randomBytes(32).toString('hex');
  adminSessions.set(token,{createdAt:Date.now(),expiresAt:Date.now()+8*60*60*1000});
  const secure=(req.secure||process.env.NODE_ENV==='production')?'; Secure':'';
  res.setHeader('Set-Cookie',`nr_admin_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure}`);
  res.json({ok:true});
});
app.post('/api/admin/logout',(req,res)=>{
  const current=adminSession(req);if(current)adminSessions.delete(current.token);
  res.setHeader('Set-Cookie','nr_admin_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  res.json({ok:true});
});
app.get('/api/admin/session',(req,res)=>res.json({configured:!!adminPassword,authenticated:!!adminSession(req)}));
app.get('/api/admin/dashboard',requireAdmin,async(req,res)=>{try{res.json({summary:await adminSummary()})}catch(err){res.status(500).json({error:err.message})}});
app.get('/api/admin/persistence',requireAdmin,async(req,res)=>{try{res.json(await adminState.status())}catch(err){res.status(500).json({error:err.message||'No fue posible consultar la persistencia del panel.'})}});
app.get('/api/admin/maintenance',requireAdmin,(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  res.json({settings:maintenanceMode.status()});
});
app.patch('/api/admin/maintenance',requireAdmin,(req,res)=>{
  try{res.json({ok:true,settings:maintenanceMode.save(req.body||{})})}
  catch(err){res.status(400).json({error:err.message||'No fue posible actualizar el modo mantenimiento.'})}
});

app.post('/api/admin/maintenance/background-image',requireAdmin,uploadMaintenanceImage,(req,res)=>{
  if(!req.file)return res.status(400).json({error:'Selecciona una imagen.'});
  res.json({ok:true,path:`assets/maintenance/uploads/${req.file.filename}`});
});
app.post('/api/admin/maintenance/background-video',requireAdmin,uploadMaintenanceVideo,(req,res)=>{
  if(!req.file)return res.status(400).json({error:'Selecciona un video.'});
  res.json({ok:true,path:`assets/maintenance/uploads/${req.file.filename}`});
});
app.post('/api/admin/maintenance/asset/:slot',requireAdmin,uploadMaintenanceAsset,(req,res)=>{
  if(!req.file)return res.status(400).json({error:'Selecciona un archivo.'});
  const slot=String(req.params.slot||'').toLowerCase();
  if(!['logo','icon'].includes(slot))return res.status(400).json({error:'Tipo de recurso inválido.'});
  try{
    const ext=path.extname(String(req.file.originalname||'')).toLowerCase();
    const normalizedExt=ext==='.jpeg'?'.jpg':ext;
    const filename=`${slot}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${normalizedExt}`;
    if(ext==='.svg'){
      const svg=validateRibbonSvg(req.file.buffer);
      fs.writeFileSync(path.join(maintenanceUploadsDir,filename),svg,'utf8');
    }else{
      if(!rasterLooksValid(req.file.buffer,ext))throw new Error('La imagen no coincide con un formato válido.');
      fs.writeFileSync(path.join(maintenanceUploadsDir,filename),req.file.buffer);
    }
    res.json({ok:true,path:`assets/maintenance/uploads/${filename}`});
  }catch(err){res.status(400).json({error:err.message||'No fue posible guardar el recurso.'})}
});
app.get('/api/admin/collaborations',requireAdmin,(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  res.json({settings:collaborationsAccess.status()});
});
app.patch('/api/admin/collaborations',requireAdmin,(req,res)=>{
  try{
    const previous=collaborationsAccess.status();
    const settings=collaborationsAccess.save(req.body||{});
    if(previous.enabled!==settings.enabled||String(req.body?.password||'')){
      collaborationsSessions.clear();
      collaborationsLoginAttempts.clear();
    }
    res.json({ok:true,settings});
  }catch(err){
    res.status(400).json({error:err.message||'No fue posible actualizar el acceso a Colaboraciones.'});
  }
});
app.get('/api/admin/email-templates',requireAdmin,(req,res)=>res.json({config:emailTemplates.get(),defaults:emailTemplates.DEFAULTS}));
app.get('/api/admin/size-guide',requireAdmin,(req,res)=>res.json({guide:sizeGuide.get(),defaults:sizeGuide.DEFAULT}));
app.patch('/api/admin/size-guide',requireAdmin,(req,res)=>{
  try{return res.json({guide:sizeGuide.save(req.body||{})})}catch(err){return res.status(400).json({error:err.message||'No fue posible guardar la guía de tallas.'})}
});
app.patch('/api/admin/email-templates',requireAdmin,(req,res)=>{
  try{res.json({ok:true,config:emailTemplates.save(req.body||{})})}
  catch(err){res.status(400).json({error:err.message||'No fue posible guardar las plantillas de correo.'})}
});
app.post('/api/admin/email-templates/reset',requireAdmin,(req,res)=>{
  try{res.json({ok:true,config:emailTemplates.reset()})}
  catch(err){res.status(400).json({error:err.message||'No fue posible restaurar las plantillas.'})}
});

app.post('/api/admin/email-logo',requireAdmin,uploadEmailLogo,(req,res)=>{
  if(!req.file)return res.status(400).json({error:'Selecciona una imagen para el logo.'});
  res.json({ok:true,path:`assets/email/uploads/${req.file.filename}`});
});
app.post('/api/admin/email/send',requireAdmin,async(req,res)=>{
  try{res.json(await emailService.sendManualEmail(req.body||{}))}
  catch(err){res.status(400).json({error:err.message||'No fue posible enviar el correo.'})}
});
app.get('/api/admin/email/history',requireAdmin,(req,res)=>{
  try{res.json({messages:emailService.listManualEmails(60)})}
  catch(err){res.status(400).json({error:err.message||'No fue posible cargar el historial de correo.'})}
});
app.get('/api/admin/site-texts',requireAdmin,(req,res)=>res.json({settings:siteTexts.getSiteTexts(),catalog:siteTexts.buildCatalog()}));
app.patch('/api/admin/site-texts',requireAdmin,(req,res)=>{
  try{res.json({ok:true,settings:siteTexts.saveSiteTexts(req.body||{})})}
  catch(err){res.status(400).json({error:err.message||'No fue posible guardar los textos del sitio.'})}
});
app.get('/api/admin/homepage',requireAdmin,(req,res)=>res.json({homepage:getHomepage()}));
app.patch('/api/admin/homepage',requireAdmin,(req,res)=>{
  try{res.json({ok:true,homepage:saveHomepage(req.body||{})})}
  catch(err){res.status(400).json({error:err.message||'No fue posible guardar la portada.'})}
});
app.post('/api/admin/homepage/image',requireAdmin,uploadHeroImage,(req,res)=>{
  if(!req.file)return res.status(400).json({error:'Selecciona una imagen.'});
  res.json({ok:true,path:`assets/portada/uploads/${req.file.filename}`});
});
app.post('/api/admin/homepage/video',requireAdmin,uploadHeroVideo,(req,res)=>{
  if(!req.file)return res.status(400).json({error:'Selecciona un video.'});
  res.json({ok:true,path:`assets/portada/uploads/${req.file.filename}`});
});
app.post('/api/admin/homepage/ribbon-icon',requireAdmin,uploadRibbonSvg,(req,res)=>{
  if(!req.file)return res.status(400).json({error:'Selecciona un archivo SVG.'});
  try{
    const svg=validateRibbonSvg(req.file.buffer);
    const filename=`${Date.now()}-${crypto.randomBytes(8).toString('hex')}.svg`;
    fs.writeFileSync(path.join(ribbonIconUploadsDir,filename),svg,'utf8');
    res.json({ok:true,path:`assets/portada/separadores/uploads/${filename}`});
  }catch(err){res.status(400).json({error:err.message||'No fue posible guardar el SVG.'})}
});
app.post('/api/admin/homepage/benefit-icon/:index',requireAdmin,uploadBenefitIcon,(req,res)=>{
  if(!req.file)return res.status(400).json({error:'Selecciona un icono o imagen.'});
  const index=Number(req.params.index);
  if(!Number.isInteger(index)||index<0||index>2)return res.status(400).json({error:'Beneficio inválido.'});
  try{
    const ext=path.extname(String(req.file.originalname||'')).toLowerCase();
    const normalizedExt=ext==='.jpeg'?'.jpg':ext;
    const filename=`benefit-${index+1}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${normalizedExt}`;
    if(ext==='.svg'){
      const svg=validateRibbonSvg(req.file.buffer);
      fs.writeFileSync(path.join(benefitUploadsDir,filename),svg,'utf8');
    }else{
      if(!rasterLooksValid(req.file.buffer,ext))throw new Error('La imagen no coincide con un formato válido.');
      fs.writeFileSync(path.join(benefitUploadsDir,filename),req.file.buffer);
    }
    res.json({ok:true,path:`assets/beneficios/uploads/${filename}`});
  }catch(err){res.status(400).json({error:err.message||'No fue posible guardar el icono.'})}
});
app.get('/api/admin/local-delivery',requireAdmin,(req,res)=>res.json({settings:getLocalDeliverySettings()}));
app.patch('/api/admin/local-delivery',requireAdmin,(req,res)=>{
  try{res.json({ok:true,settings:saveLocalDeliverySettings(req.body||{})})}
  catch(err){res.status(400).json({error:err.message||'No fue posible guardar la entrega local.'})}
});
app.get('/api/admin/bank-transfer',requireAdmin,(req,res)=>res.json({settings:getBankTransferSettings()}));
app.patch('/api/admin/bank-transfer',requireAdmin,(req,res)=>{
  try{res.json({ok:true,settings:saveBankTransferSettings(req.body||{})})}
  catch(err){res.status(400).json({error:err.message||'No fue posible guardar la transferencia bancaria.'})}
});

app.get('/api/admin/promotions',requireAdmin,async(req,res)=>{try{res.json({promotions:await promotionList(),products:await adminProductList()})}catch(err){res.status(500).json({error:err.message})}});
app.post('/api/admin/promotions',requireAdmin,async(req,res)=>{
  try{res.status(201).json({ok:true,promotion:await createPromotion(req.body||{}),promotions:await promotionList()})}
  catch(err){res.status(400).json({error:err.message||'No fue posible crear la promoción.'})}
});
app.patch('/api/admin/promotions/:id',requireAdmin,async(req,res)=>{
  try{res.json({ok:true,promotion:await updatePromotion(req.params.id,req.body||{}),promotions:await promotionList()})}
  catch(err){res.status(400).json({error:err.message||'No fue posible actualizar la promoción.'})}
});
app.delete('/api/admin/promotions/:id',requireAdmin,async(req,res)=>{
  try{await deletePromotion(req.params.id);res.json({ok:true,promotions:await promotionList()})}
  catch(err){res.status(400).json({error:err.message||'No fue posible eliminar la promoción.'})}
});
app.get('/api/admin/orders',requireAdmin,async(req,res)=>{try{res.json({orders:await listOrders(),statuses:ADMIN_ORDER_STATUSES})}catch(err){res.status(500).json({error:err.message})}});
app.patch('/api/admin/orders/:orderNumber/status',requireAdmin,async(req,res)=>{
  try{
    const order=await updateOrderStatus(req.params.orderNumber,req.body?.status);
    // V127.39: al seleccionar "Enviado" desde el panel no enviamos aún el
    // correo. Primero damos oportunidad de capturar paquetería, guía y URL.
    // El correo de envío se dispara al pulsar "Guardar datos de envío".
    if(order.status!=='Enviado')notifyOrderStatus(order);
    res.json({order,statusEmailPending:order.status==='Enviado'});
  }
  catch(err){res.status(400).json({error:err.message});}
});
app.patch('/api/admin/orders/:orderNumber/shipment',requireAdmin,async(req,res)=>{
  try{
    const order=await updateOrderShipment(req.params.orderNumber,req.body||{});
    let statusEmailTriggered=false;
    if(order.status==='Enviado'){
      notifyOrderStatus(order);
      statusEmailTriggered=true;
    }
    res.json({order,statusEmailTriggered});
  }
  catch(err){res.status(400).json({error:err.message});}
});
app.patch('/api/admin/orders/:orderNumber/payment',requireAdmin,async(req,res)=>{
  try{const order=await markBankTransferPaid(req.params.orderNumber);notifyOrderStatus(order);res.json({order})}
  catch(err){res.status(400).json({error:err.message||'No fue posible confirmar el pago.'});}
});
app.get('/api/admin/orders/:orderNumber/transfer-proof',requireAdmin,async(req,res)=>{
  try{
    const proof=await getBankTransferProofMeta(req.params.orderNumber);
    const name=path.basename(String(proof.storedName||''));
    const filePath=path.join(transferProofsDir,name);
    if(!name||!fs.existsSync(filePath))return res.status(404).json({error:'El archivo del comprobante no está disponible.'});
    res.setHeader('Content-Type',proof.mimeType||'application/octet-stream');
    res.setHeader('Content-Disposition',`inline; filename*=UTF-8''${encodeURIComponent(proof.originalName||name)}`);
    res.sendFile(filePath);
  }catch(err){res.status(404).json({error:err.message||'Comprobante no encontrado.'});}
});
app.get('/api/admin/inventory',requireAdmin,async(req,res)=>{try{res.json({...await inventorySummary(),products:await adminProductList()})}catch(err){res.status(500).json({error:err.message})}});
app.patch('/api/admin/inventory',requireAdmin,async(req,res)=>{
  try{const inventory=await setInventoryStock(req.body?.productId,req.body?.color,req.body?.size,req.body?.qty);res.json({ok:true,inventory});}
  catch(err){res.status(400).json({error:err.message});}
});
app.get('/api/admin/products',requireAdmin,async(req,res)=>{try{res.json({products:await adminProductList()})}catch(err){res.status(500).json({error:err.message})}});
app.post('/api/admin/products',requireAdmin,uploadProductImages,async(req,res)=>{
  const uploadedPaths=uploadedProductPaths(req);
  try{
    if(!uploadedPaths.length)throw new Error('Selecciona al menos una imagen para el producto.');
    const initialStock=Number.parseInt(req.body?.initialStock,10);
    const product=createProduct({
      name:req.body?.name,
      price:req.body?.price,
      category:req.body?.category,
      descriptionHtml:req.body?.descriptionHtml,
      colors:req.body?.colors,
      sizes:req.body?.sizes,
      img:uploadedPaths[0],
      images:uploadedPaths
    });
    await initializeInventoryForProduct(product,Number.isInteger(initialStock)?initialStock:0);
    const adminProduct=(await adminProductList()).find(item=>item.id===product.id)||product;
    res.status(201).json({ok:true,product:adminProduct,products:await adminProductList()});
  }catch(err){
    cleanupUploadedPaths(uploadedPaths);
    res.status(400).json({error:err.message||'No fue posible crear el producto.'});
  }
});
app.post('/api/admin/products/:id/images',requireAdmin,uploadProductImages,async(req,res)=>{
  const uploadedPaths=uploadedProductPaths(req);
  try{
    if(!uploadedPaths.length)throw new Error('Selecciona al menos una imagen.');
    const product=updateProductImages(req.params.id,{addImages:uploadedPaths});
    const adminProduct=(await adminProductList()).find(item=>item.id===product.id)||product;
    res.json({ok:true,product:adminProduct});
  }catch(err){
    cleanupUploadedPaths(uploadedPaths);
    res.status(400).json({error:err.message||'No fue posible añadir las imágenes.'});
  }
});
app.patch('/api/admin/products/:id/images/primary',requireAdmin,async(req,res)=>{
  try{
    const product=updateProductImages(req.params.id,{primaryImage:req.body?.image});
    const adminProduct=(await adminProductList()).find(item=>item.id===product.id)||product;
    res.json({ok:true,product:adminProduct});
  }catch(err){res.status(400).json({error:err.message});}
});
app.delete('/api/admin/products/:id/images',requireAdmin,async(req,res)=>{
  try{
    const removeImage=String(req.body?.image||'');
    const product=updateProductImages(req.params.id,{removeImage});
    maybeDeleteUnusedUpload(removeImage);
    const adminProduct=(await adminProductList()).find(item=>item.id===product.id)||product;
    res.json({ok:true,product:adminProduct});
  }catch(err){res.status(400).json({error:err.message});}
});
app.patch('/api/admin/products/:id',requireAdmin,async(req,res)=>{
  try{
    const product=updateProduct(req.params.id,req.body||{});
    await reconcileInventoryForProduct(product);
    res.json({ok:true,product,products:await adminProductList()});
  }catch(err){res.status(400).json({error:err.message});}
});
app.get('/api/stripe/status',(req,res)=>res.json({
  configured:!!stripe,
  publishableConfigured:!!publishableKey,
  webhookConfigured:!!webhookSecret,
  mode:stripeSecretMode,
  keyMismatch:stripeKeyMismatch
}));
app.get('/api/stripe/config',(req,res)=>res.json({
  serverConfigured:!!stripe,
  publishableKey:stripeKeyMismatch?'':publishableKey,
  webhookConfigured:!!webhookSecret,
  mode:stripeSecretMode,
  keyMismatch:stripeKeyMismatch
}));
app.get('/api/homepage',(req,res)=>res.json({homepage:getHomepage()}));
app.get('/api/site-texts',(req,res)=>res.json({settings:siteTexts.getSiteTexts()}));
app.get('/api/size-guide',(req,res)=>res.json({guide:sizeGuide.get()}));
app.get('/api/local-delivery',(req,res)=>res.json({settings:publicSettings()}));
app.get('/api/bank-transfer',(req,res)=>res.json({settings:publicAvailability()}));
app.post('/api/local-delivery/check',(req,res)=>{
  const settings=getLocalDeliverySettings();
  res.json({eligible:isEligibleAddress(req.body||{},settings),settings:publicSettings(settings)});
});
app.get('/api/products',(req,res)=>res.json({products:getProducts()}));
app.get('/api/inventory',async(req,res)=>{try{res.json({inventory:await getInventory()})}catch(err){res.status(500).json({error:err.message})}});
app.post('/api/promotions/evaluate',promotionsLimiter,async(req,res)=>{
  try{
    const {items,promoCode,checkout}=req.body||{};
    const normalizedItems=normalizeItems(items);
    const totals=await calculateCheckoutTotals(normalizedItems,promoCode,checkout||{});
    res.json({
      ok:true,
      totals:{subtotal:totals.subtotal/100,discount:totals.discount/100,shipping:totals.shipping/100,total:totals.total/100},
      promotion:totals.promotion||null
    });
  }catch(err){res.status(400).json({ok:false,error:err.message||'No fue posible validar la promoción.'})}
});

app.post('/api/stripe/create-payment-intent',checkoutLimiter,async(req,res)=>{
  if(!stripe)return res.status(503).json({error:'Falta STRIPE_SECRET_KEY en el servidor.'});
  try{
    const {items,promoCode,email,checkout}=req.body||{};
    const normalizedItems=normalizeItems(items);
    await inventoryFor(normalizedItems);
    const order=await calculateCheckoutTotals(normalizedItems,promoCode,checkout||{});
    const paymentIntent=await stripe.paymentIntents.create({
      amount:order.total,
      currency:'mxn',
      payment_method_types:['card'],
      receipt_email:email||undefined,
      metadata:{store:'Niños Rancios',integration:'v116-stripe',environment:stripeSecretMode}
    });
    const signedInCustomer=(await customerSession(req))?.customer||null;
    await saveDraft(paymentIntent.id,{
      items:normalizedItems,
      promoCode:String(promoCode||''),
      checkout:sanitizeCheckout(checkout||{}),
      customerId:signedInCustomer?.id||''
    });
    res.json({clientSecret:paymentIntent.client_secret,amount:order.total,paymentIntentId:paymentIntent.id,mode:stripeSecretMode});
  }catch(err){
    console.error('Stripe create-payment-intent error:',err.message);
    res.status(400).json({error:'No fue posible preparar el pago. Revisa el carrito y el inventario.'});
  }
});

app.post('/api/stripe/update-payment-draft',checkoutLimiter,async(req,res)=>{
  try{
    const {paymentIntentId,items,promoCode,checkout}=req.body||{};
    if(!paymentIntentId)return res.status(400).json({error:'Falta paymentIntentId.'});
    const normalizedItems=normalizeItems(items);
    await inventoryFor(normalizedItems);
    const signedInCustomer=(await customerSession(req))?.customer||null;
    await saveDraft(paymentIntentId,{
      items:normalizedItems,
      promoCode:String(promoCode||''),
      checkout:sanitizeCheckout(checkout||{}),
      customerId:signedInCustomer?.id||''
    });
    res.json({ok:true});
  }catch(err){res.status(400).json({error:'No fue posible actualizar los datos del pedido.'});}
});

app.post('/api/stripe/finalize-order',checkoutLimiter,async(req,res)=>{
  if(!stripe)return res.status(503).json({error:'Stripe no configurado.'});
  try{
    const paymentIntentId=String(req.body?.paymentIntentId||'');
    if(!paymentIntentId)return res.status(400).json({error:'Falta el identificador del pago.'});
    const order=await runPaymentFinalizationOnce(`stripe:${paymentIntentId}`,()=>finalizeStripeOrder(stripe,paymentIntentId));
    notifyOrderCreated(order,'Stripe');
    res.json({ok:true,order});
  }catch(err){
    console.error('Finalize order error:',err.message);
    res.status(400).json({error:err.message||'No fue posible confirmar el pedido.'});
  }
});


app.get('/api/mercadopago/config',(req,res)=>{
  const publicBaseUrl=String(process.env.PUBLIC_BASE_URL||'').trim().replace(/\/+$/,'');
  res.json({configured:mercadopago.isConfigured(),mode:mercadopago.getMode(),webhookConfigured:mercadopago.webhookConfigured(),publicBaseUrlConfigured:/^https:\/\//i.test(publicBaseUrl)});
});
app.post('/api/mercadopago/create-order',checkoutLimiter,async(req,res)=>{
  if(!mercadopago.isConfigured())return res.status(503).json({error:'Falta configurar MERCADOPAGO_ACCESS_TOKEN en el servidor.'});
  try{
    const {items,promoCode,checkout,requestId}=req.body||{};
    const normalizedItems=normalizeItems(items);
    if(!normalizedItems.length)return res.status(400).json({error:'El carrito está vacío.'});
    await inventoryFor(normalizedItems);
    const cleanCheckout=sanitizeCheckout(checkout||{});
    const totals=await calculateCheckoutTotals(normalizedItems,promoCode,cleanCheckout);
    const signedInCustomer=(await customerSession(req))?.customer||null;
    const baseUrl=String(process.env.PUBLIC_BASE_URL||'').trim().replace(/\/+$/,'');
    if(!/^https:\/\//i.test(baseUrl))throw new Error('Para probar Mercado Pago configura PUBLIC_BASE_URL con una URL pública HTTPS (por ejemplo, tu túnel de Cloudflare).');
    const key=mercadopago.cleanIdempotency(requestId);
    const externalReference=`nr-${key}`;
    const successUrl=`${baseUrl}/payment-success.html?provider=mercadopago&mp_ref=${encodeURIComponent(key)}`;
    const pendingUrl=`${baseUrl}/payment-success.html?provider=mercadopago&mp_ref=${encodeURIComponent(key)}&mp_pending=1`;
    const failureUrl=`${baseUrl}/checkout.html?mercadopago=failed`;
    const notificationUrl=`${baseUrl}/api/mercadopago/webhook`;
    const preference=await mercadopago.createPreference({
      amountCents:totals.total,email:cleanCheckout.email,successUrl,failureUrl,pendingUrl,notificationUrl,
      externalReference,idempotencyKey:key
    });
    const checkoutUrl=mercadopago.getMode()==='test'?(preference?.sandbox_init_point||preference?.init_point):preference?.init_point;
    if(!preference?.id||!checkoutUrl)throw new Error('Mercado Pago no devolvió la URL del checkout.');
    await saveDraft(`mercadopago-reference:${externalReference}`,{
      provider:'mercadopago',items:normalizedItems,promoCode:String(promoCode||''),checkout:cleanCheckout,
      customerId:signedInCustomer?.id||'',mercadoPagoRequestId:key,mercadoPagoPreferenceId:preference.id,externalReference
    });
    await saveDraft(`mercadopago-return:${key}`,{mercadoPagoPreferenceId:preference.id,externalReference});
    res.json({ok:true,preferenceId:preference.id,checkoutUrl,mode:mercadopago.getMode()});
  }catch(err){
    console.error('Mercado Pago create-preference error:',err.message);
    res.status(Number(err.status)>=400&&Number(err.status)<500?400:502).json({error:err.message||'No fue posible iniciar Mercado Pago.'});
  }
});
app.post('/api/mercadopago/finalize-order',checkoutLimiter,async(req,res)=>{
  if(!mercadopago.isConfigured())return res.status(503).json({error:'Mercado Pago no configurado.'});
  try{
    const returnToken=String(req.body?.returnToken||'').trim();
    const browserPaymentId=String(req.body?.paymentId||'').trim();
    if(!returnToken)return res.status(400).json({error:'Falta la referencia de regreso de Mercado Pago.'});
    const link=await getDraft(`mercadopago-return:${returnToken}`);
    const externalReference=String(link?.externalReference||`nr-${returnToken}`).trim();
    let payment=null;
    if(browserPaymentId)payment=await mercadopago.getPayment(browserPaymentId);
    if(!payment)payment=await mercadopago.findLatestPaymentByReference(externalReference);
    if(!payment)return res.status(202).json({ok:false,pending:true,status:'not_found',statusDetail:'payment_not_found'});
    if(String(payment.external_reference||'')!==externalReference)throw new Error('La referencia del pago de Mercado Pago no coincide con este pedido.');
    const existing=await findOrderByMercadoPagoPaymentId(payment.id);
    if(existing){notifyOrderCreated(existing,'Mercado Pago');return res.json({ok:true,order:existing,alreadyFinalized:true});}
    if(!mercadopago.paid(payment))return res.status(202).json({ok:false,pending:true,status:payment.status||'',statusDetail:payment.status_detail||''});
    const order=await runPaymentFinalizationOnce(`mercadopago:${payment.id||externalReference}`,()=>finalizeMercadoPagoPayment(payment,externalReference));
    notifyOrderCreated(order,'Mercado Pago');
    res.json({ok:true,order});
  }catch(err){
    console.error('Mercado Pago finalize-order error:',err.message);
    res.status(Number(err.status)>=400&&Number(err.status)<500?400:502).json({error:err.message||'No fue posible confirmar el pago de Mercado Pago.'});
  }
});

app.get('/api/paypal/config',(req,res)=>{
  res.json({configured:paypal.isConfigured(),mode:paypal.getMode(),webhookConfigured:paypal.webhookConfigured()});
});
app.post('/api/paypal/create-order',checkoutLimiter,async(req,res)=>{
  if(!paypal.isConfigured())return res.status(503).json({error:'Falta configurar PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET en el servidor.'});
  try{
    const {items,promoCode,checkout,requestId}=req.body||{};
    const normalizedItems=normalizeItems(items);
    if(!normalizedItems.length)return res.status(400).json({error:'El carrito está vacío.'});
    await inventoryFor(normalizedItems);
    const cleanCheckout=sanitizeCheckout(checkout||{});
    const totals=await calculateCheckoutTotals(normalizedItems,promoCode,cleanCheckout);
    const signedInCustomer=(await customerSession(req))?.customer||null;
    const baseUrl=String(process.env.PUBLIC_BASE_URL||`${req.protocol}://${req.get('host')}`).replace(/\/+$/,'');
    const paypalOrder=await paypal.createOrder({
      amountCents:totals.total,
      checkout:cleanCheckout,
      returnUrl:`${baseUrl}/payment-success.html?provider=paypal`,
      cancelUrl:`${baseUrl}/checkout.html?paypal_cancelled=1`,
      requestId:String(requestId||'').trim()||paypal.makeRequestId('nr-create')
    });
    if(!paypalOrder.id||!paypalOrder.approvalUrl)throw new Error('PayPal no devolvió el enlace de aprobación.');
    await saveDraft(`paypal:${paypalOrder.id}`,{
      provider:'paypal',items:normalizedItems,promoCode:String(promoCode||''),checkout:cleanCheckout,
      customerId:signedInCustomer?.id||'',paypalRequestId:String(requestId||'')
    });
    res.json({ok:true,orderId:paypalOrder.id,approveUrl:paypalOrder.approvalUrl,mode:paypal.getMode()});
  }catch(err){
    console.error('PayPal create-order error:',err.message);
    res.status(Number(err.status)>=400&&Number(err.status)<500?400:502).json({error:err.message||'No fue posible iniciar el pago con PayPal.'});
  }
});
app.post('/api/paypal/capture-order',checkoutLimiter,async(req,res)=>{
  if(!paypal.isConfigured())return res.status(503).json({error:'PayPal no configurado.'});
  try{
    const orderId=String(req.body?.orderId||'').trim();
    if(!orderId)return res.status(400).json({error:'Falta el identificador de PayPal.'});
    const existing=await findOrderByPayPalOrderId(orderId);
    if(existing){notifyOrderCreated(existing,'PayPal');return res.json({ok:true,order:existing,alreadyFinalized:true});}
    const captured=await paypal.captureOrder(orderId,`nr-capture-${orderId}`.slice(0,108));
    const order=await runPaymentFinalizationOnce(`paypal:${orderId}`,()=>finalizePayPalOrder(captured,orderId));
    notifyOrderCreated(order,'PayPal');
    res.json({ok:true,order});
  }catch(err){
    console.error('PayPal capture-order error:',err.message);
    res.status(Number(err.status)>=400&&Number(err.status)<500?400:502).json({error:err.message||'No fue posible confirmar el pago con PayPal.'});
  }
});

app.post('/api/orders/cash-on-delivery',manualOrderLimiter,async(req,res)=>{
  try{
    const signedInCustomer=(await customerSession(req))?.customer||null;
    const order=await createLocalCashOrder(req.body||{},signedInCustomer?.id||'');
    notifyOrderCreated(order,'contraentrega');
    res.status(201).json({ok:true,order});
  }catch(err){res.status(400).json({error:err.message||'No fue posible crear el pedido contraentrega.'});}
});

app.post('/api/orders/bank-transfer',manualOrderLimiter,async(req,res)=>{
  try{
    const signedInCustomer=(await customerSession(req))?.customer||null;
    const order=await createBankTransferOrder(req.body||{},signedInCustomer?.id||'');
    notifyOrderCreated(order,'transferencia');
    res.status(201).json({ok:true,order});
  }catch(err){res.status(400).json({error:err.message||'No fue posible crear el pedido por transferencia.'});}
});
app.post('/api/orders/transfer-proof',transferProofLimiter,uploadTransferProof,async(req,res)=>{
  let storedName='';
  try{
    if(!req.file?.buffer)throw new Error('Selecciona un comprobante.');
    const ext=validatedProofExtension(req.file.buffer);
    if(!ext)throw new Error('El contenido del archivo no coincide con un JPG, PNG, WEBP o PDF válido.');
    const orderNumber=String(req.body?.orderNumber||'').trim();
    const email=String(req.body?.email||'').trim();
    const existing=await findOrder(orderNumber,email);
    if(!existing)throw new Error('No encontramos el pedido con esos datos.');
    if(existing.paymentMethod!=='Transferencia bancaria')throw new Error('Este pedido no utiliza transferencia bancaria.');
    let oldName='';
    try{oldName=(await getBankTransferProofMeta(orderNumber))?.storedName||''}catch{}
    storedName=`${Date.now()}-${crypto.randomBytes(12).toString('hex')}${ext}`;
    fs.writeFileSync(path.join(transferProofsDir,storedName),req.file.buffer);
    const saved=await saveBankTransferProof(orderNumber,email,{storedName,originalName:req.file.originalname,mimeType:ext==='.pdf'?'application/pdf':req.file.mimetype,size:req.file.size});
    if(oldName&&oldName!==storedName)removeStoredTransferProof(oldName);
    res.json({ok:true,order:saved.order});
  }catch(err){
    if(storedName)removeStoredTransferProof(storedName);
    res.status(400).json({error:err.message||'No fue posible guardar el comprobante.'});
  }
});

app.post('/api/orders/lookup',orderLookupLimiter,async(req,res)=>{
  const orderNumber=String(req.body?.orderNumber||'').trim();
  const email=String(req.body?.email||'').trim();
  if(!orderNumber||!email)return res.status(400).json({error:'Ingresa el número de pedido y el correo utilizado en la compra.'});
  const order=await findOrder(orderNumber,email);
  if(!order)return res.status(404).json({error:'No encontramos un pedido que coincida con ese número y correo.'});
  res.json({order});
});

app.get('/maintenance.html',(req,res)=>sendMaintenancePage(res,200));

// V127.27 — modo mantenimiento global. El panel privado y las sesiones de admin
// pueden seguir viendo la tienda completa para revisar cambios antes de publicarlos.
app.use((req,res,next)=>{
  if(!maintenanceMode.isEnabled())return next();
  if(req.method!=='GET'&&req.method!=='HEAD')return next();
  const requestPath=req.path||'/';
  if(requestPath.startsWith('/api/'))return next();
  if(requestPath==='/maintenance.html')return next();
  if(blockedAdminPaths.has(requestPath))return next();
  if(adminPath&&(requestPath===adminPath||requestPath===adminPath+'/'))return next();
  if(adminSession(req))return next();
  const criticalPages=new Set(['/payment-success.html','/verify-email.html','/reset-password.html']);
  if(criticalPages.has(requestPath))return next();
  const isPublicDocument=requestPath==='/'||requestPath.endsWith('.html')||requestPath==='/partners'||requestPath==='/partners/';
  if(!isPublicDocument)return next();
  return sendMaintenancePage(res,503);
});

app.get([...blockedAdminPaths],(req,res)=>{
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  res.status(404).send('Not found');
});
if(adminPath){
  app.get([adminPath,adminPath+'/'],(req,res)=>{
    res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
    res.sendFile(path.join(root,'admin.html'));
  });
}
// Mientras la protección esté activa, partners.html no se entrega sin una sesión válida.
app.get(['/partners','/partners/','/partners.html'],(req,res)=>{
  if(!collaborationsAccess.isEnabled())return res.sendFile(path.join(root,'partners.html'));
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  res.setHeader('Cache-Control','no-store');
  if(collaborationsSession(req))return res.sendFile(path.join(root,'partners.html'));
  return res.sendFile(path.join(root,'partners-lock.html'));
});

// V127.41 — nunca publicar la raíz completa del proyecto. Antes Express podía
// entregar /server/data/*.json y otros archivos privados. Solo se sirven los
// recursos públicos y los archivos frontend permitidos de la raíz.
const staticOptions={index:false,dotfiles:'deny',fallthrough:true,maxAge:process.env.NODE_ENV==='production'?'1h':0};
app.use('/assets',express.static(path.join(root,'assets'),staticOptions));
app.use('/icons',express.static(path.join(root,'icons'),staticOptions));
const publicRootFiles=new Set(
  fs.readdirSync(root,{withFileTypes:true})
    .filter(entry=>entry.isFile()&&/\.(?:html|css|js)$/i.test(entry.name)&&entry.name!=='admin.html')
    .map(entry=>entry.name)
);
app.get('/',(req,res)=>res.sendFile(path.join(root,'index.html')));
app.get(/^\/([^/]+\.(?:html|css|js))$/i,(req,res,next)=>{
  const filename=String(req.params?.[0]||'');
  if(!publicRootFiles.has(filename))return next();
  return res.sendFile(path.join(root,filename));
});
// Defensa explícita para rutas privadas incluso si en el futuro cambia la capa estática.
app.use(['/server','/server/*'],(req,res)=>res.status(404).send('Not found'));
app.use((req,res)=>res.status(404).send('Not found'));
const port=Number(process.env.PORT||4242);
async function runPostgresMaintenanceOnStartup(){
  const action=String(process.env.POSTGRES_MAINTENANCE_ACTION||'').trim().toLowerCase();
  if(!action)return;
  if(!['check','migrate'].includes(action)){
    console.warn('PostgreSQL maintenance: POSTGRES_MAINTENANCE_ACTION debe ser check, migrate o vacío.');
    return;
  }
  try{
    if(action==='check'){
      const result=await postgresMaintenance.check();
      console.log('PostgreSQL maintenance check OK: '+JSON.stringify(result));
      return;
    }
    const force=String(process.env.POSTGRES_MIGRATION_FORCE||'').trim().toLowerCase()==='true';
    const result=await postgresMaintenance.migrate({force});
    console.log(`PostgreSQL maintenance migrate ${result.status}: ${JSON.stringify(result.counts)}`);
  }catch(err){
    console.error(`PostgreSQL maintenance ${action} ERROR: ${err.message}`);
  }
}
async function startServer(){
  // V127.45 — tareas PostgreSQL aisladas del backend comercial. Permiten
  // comprobar/migrar la base mientras la tienda continúa en DATA_BACKEND=json.
  await runPostgresMaintenanceOnStartup();
  await initDatabase();
  const adminStateStatus=await adminState.restore();
  if(usingPostgres())console.log(`Persistencia del panel: PostgreSQL (restaurados ${adminStateStatus.restored||0}, inicializados ${adminStateStatus.seeded||0})`);
  app.listen(port,()=>{
  console.log(`Niños Rancios: http://localhost:${port}`);
  console.log(`Persistencia: ${backendName()}${usingPostgres()?' (transacciones PostgreSQL activas)':' (compatibilidad JSON local)'}`);
  if(adminPath)console.log(`Panel privado: http://localhost:${port}${adminPath}`);
  else console.log('Panel privado deshabilitado: configura ADMIN_PATH en server/.env');
  if(stripe){
    console.log(`Stripe: ${stripeSecretMode==='live'?'MODO REAL':stripeSecretMode==='test'?'modo de prueba':'clave configurada'}`);
    if(!webhookSecret)console.warn('Stripe: falta STRIPE_WEBHOOK_SECRET. El retorno del checkout puede confirmar el pedido, pero configura el webhook antes de publicar.');
    if(!publishableKey)console.warn('Stripe: falta STRIPE_PUBLISHABLE_KEY en .env. Se usará el valor de respaldo del frontend si existe.');
    if(stripeKeyMismatch)console.error('Stripe: STRIPE_SECRET_KEY y STRIPE_PUBLISHABLE_KEY pertenecen a entornos distintos (test/live).');
  }else console.warn('Stripe no está configurado: falta STRIPE_SECRET_KEY.');
  if(paypal.isConfigured()){
    console.log(`PayPal: ${paypal.getMode()==='live'?'MODO REAL':'modo sandbox'}`);
    if(!paypal.webhookConfigured())console.warn('PayPal: falta PAYPAL_WEBHOOK_ID. El checkout funciona, pero configura el webhook antes de publicar.');
  }else console.warn('PayPal no está configurado: faltan PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET.');
  const bankSettings=getBankTransferSettings();
  console.log(`Transferencia bancaria: ${publicAvailability(bankSettings).enabled?'activa':'desactivada / pendiente de configurar'}`);
  console.log(`Correo Brevo: ${emailService.isConfigured()?'configurado':'pendiente de configurar'}`);
  console.log(`Colaboraciones: ${collaborationsAccess.isEnabled()?'protegida con contraseña':'pública'}`);
  console.log(`Modo mantenimiento: ${maintenanceMode.isEnabled()?'ACTIVO':'desactivado'}`);
  console.log(`Newsletter Brevo: ${newsletter.isConfigured()?'configurado':'pendiente de configurar'}`);
  if(emailService.isConfigured()&&!emailService.publicConfig().storeNotificationConfigured)console.warn('Correo Brevo: falta STORE_NOTIFICATION_EMAIL para avisos de pedidos y formulario de contacto.');
  });
}
startServer().catch(err=>{console.error('No fue posible iniciar Niños Rancios:',err.message);process.exitCode=1});
