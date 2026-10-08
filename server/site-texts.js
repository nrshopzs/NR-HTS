const fs=require('fs');
const path=require('path');

const dataDir=path.join(__dirname,'data');
const file=path.join(dataDir,'site-texts.json');
const projectRoot=path.join(__dirname,'..');
const publicRoot=fs.existsSync(path.join(projectRoot,'public'))?path.join(projectRoot,'public'):projectRoot;

const DEFAULT={version:1,global:{},pages:{}};
const EXCLUDED_PAGES=new Set(['admin.html','maintenance.html','partners-lock.html']);
const COMMON=[
  'Inicio','Tienda','Mujer','Hombre','Nosotros','Contacto','Iniciar sesión','Perfil','Mis Pedidos','Mis Favoritos','Cerrar Sesión',
  'Carrito','MXN ($)','MXN','PAGO SEGURO EN LÍNEA','Cifrado SSL · Compra 100% segura','ATENCIÓN RÁPIDA','Estamos aquí para ayudarte',
  'ENVÍOS RÁPIDOS','Envíos rápidos y seguros','Aviso de privacidad','Envíos','Cambios y devoluciones','Consultar pedido','Puntos de venta',
  'Facebook','Instagram','Colaboraciones','Empleos','Promociones','¡ÚNETE!','Email','Quiero recibir novedades y promociones. Puedo darme de baja en cualquier momento.',
  'Enviar','©2026 Niños Rancios. Todos los derechos reservados.','Agregar al carrito','Agotado','Selecciona','Selecciona color y talla para continuar.',
  'Seguir comprando','Finalizar compra','Subtotal','Total','Cantidad','Color','Talla','Pedido','Estado','Paquetería','Guía','Por confirmar'
];
const PAGE_LABELS={
  'index.html':'Inicio','shop-all.html':'Tienda','woman.html':'Mujer','men.html':'Hombre','product.html':'Producto','about-us.html':'Nosotros',
  'contact.html':'Contacto','privacy.html':'Aviso de privacidad','returns.html':'Cambios y devoluciones','shipping.html':'Envíos','stockists.html':'Puntos de venta',
  'partners.html':'Colaboraciones','jobs.html':'Empleos','offers.html':'Promociones','account.html':'Mi cuenta','cart.html':'Carrito','checkout.html':'Checkout',
  'order-lookup.html':'Consultar pedido','payment-success.html':'Pago completado','verify-email.html':'Verificar correo','reset-password.html':'Restablecer contraseña'
};

function ensure(){
  fs.mkdirSync(dataDir,{recursive:true});
  if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify(DEFAULT,null,2)+'\n','utf8');
}
function cleanText(value,max=2000){return String(value??'').replace(/\u0000/g,'').slice(0,max)}
function cleanKey(value){return cleanText(value,500).replace(/\s+/g,' ').trim()}
function sanitizeMap(raw){
  const out={};
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
  for(const [source,value] of Object.entries(raw)){
    const key=cleanKey(source);if(!key)continue;
    out[key]=cleanText(value,2000);
    if(Object.keys(out).length>=1500)break;
  }
  return out;
}
function sanitize(raw={}){
  const pages={};
  const sourcePages=raw.pages&&typeof raw.pages==='object'?raw.pages:{};
  for(const [name,map] of Object.entries(sourcePages)){
    const page=String(name||'').trim().toLowerCase();
    if(!/^[a-z0-9._-]+\.html$/.test(page))continue;
    pages[page]=sanitizeMap(map);
    if(Object.keys(pages).length>=100)break;
  }
  return {version:1,global:sanitizeMap(raw.global),pages};
}
function getSiteTexts(){ensure();try{return sanitize(JSON.parse(fs.readFileSync(file,'utf8')))}catch{return sanitize(DEFAULT)}}
function saveSiteTexts(raw){const next=sanitize(raw);ensure();fs.writeFileSync(file,JSON.stringify(next,null,2)+'\n','utf8');return next}
function decodeEntities(value){
  const map={'&nbsp;':' ','&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&apos;':"'"};
  return String(value||'').replace(/&(nbsp|amp|lt|gt|quot|apos|#39);/gi,m=>map[m.toLowerCase()]||m)
    .replace(/&#(\d+);/g,(_,n)=>{try{return String.fromCodePoint(Number(n))}catch{return _}})
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>{try{return String.fromCodePoint(parseInt(n,16))}catch{return _}});
}
function validCatalogText(value){
  const text=cleanKey(decodeEntities(value));
  if(!text||text.length<2||text.length>500)return '';
  if(/^[-–—•|]+$/.test(text))return '';
  if(/^https?:\/\//i.test(text))return '';
  if(/^[{}\[\]();,:.]+$/.test(text))return '';
  return text;
}
function extractTexts(html){
  let src=String(html||'')
    .replace(/<!--[\s\S]*?-->/g,' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi,' ');
  const out=[];
  const add=v=>{const t=validCatalogText(v);if(t)out.push(t)};
  for(const match of src.matchAll(/\b(?:placeholder|title|aria-label|alt)\s*=\s*(["'])(.*?)\1/gi))add(match[2]);
  src=src.replace(/<[^>]+>/g,'\n');
  src.split(/\n+/).forEach(add);
  return [...new Set(out)].sort((a,b)=>a.localeCompare(b,'es'));
}

function buildCatalog(){
  const pages={};
  const entries=fs.existsSync(publicRoot)?fs.readdirSync(publicRoot,{withFileTypes:true}):[];
  for(const entry of entries){
    if(!entry.isFile()||!entry.name.toLowerCase().endsWith('.html')||EXCLUDED_PAGES.has(entry.name))continue;
    try{pages[entry.name]=extractTexts(fs.readFileSync(path.join(publicRoot,entry.name),'utf8'))}catch{pages[entry.name]=[]}
  }
  return {
    common:[...new Set(COMMON.map(cleanKey).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es')),
    pages,
    labels:Object.fromEntries(Object.keys(pages).map(name=>[name,PAGE_LABELS[name]||name]))
  };
}
module.exports={getSiteTexts,saveSiteTexts,buildCatalog};
