const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const nodemailer=require('nodemailer');
const templateStore=require('./email-templates');

const projectRoot=path.join(__dirname,'..');
const publicRoot=path.join(projectRoot,'public');
const root=fs.existsSync(publicRoot)?publicRoot:projectRoot;
const dataDir=path.join(__dirname,'data');
const logFile=path.join(dataDir,'email-log.json');
const manualLogFile=path.join(dataDir,'manual-email-log.json');
const pendingKeys=new Set();
let transporter=null;

function clean(value,max=500){return String(value??'').trim().slice(0,max)}
function emailAddress(value){const v=clean(value,254).toLowerCase();return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)?v:''}
function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function money(value){return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(value)||0)}
function ensureData(){fs.mkdirSync(dataDir,{recursive:true});if(!fs.existsSync(logFile))fs.writeFileSync(logFile,'{}\n','utf8');if(!fs.existsSync(manualLogFile))fs.writeFileSync(manualLogFile,'[]\n','utf8')}
function readLog(){ensureData();try{return JSON.parse(fs.readFileSync(logFile,'utf8'))}catch{return {}}}
function writeLog(data){ensureData();fs.writeFileSync(logFile,JSON.stringify(data,null,2)+'\n','utf8')}
function readManualLog(){ensureData();try{const rows=JSON.parse(fs.readFileSync(manualLogFile,'utf8'));return Array.isArray(rows)?rows:[]}catch{return []}}
function writeManualLog(rows){ensureData();fs.writeFileSync(manualLogFile,JSON.stringify(rows.slice(-200),null,2)+'\n','utf8')}

function config(){return {host:clean(process.env.BREVO_SMTP_HOST||'smtp-relay.brevo.com',200),port:Number(process.env.BREVO_SMTP_PORT||587),user:clean(process.env.BREVO_SMTP_USER,254),key:clean(process.env.BREVO_SMTP_KEY,300),ordersFrom:clean(process.env.BREVO_FROM_ORDERS,254),accountsFrom:clean(process.env.BREVO_FROM_ACCOUNTS,254),contactFrom:clean(process.env.BREVO_FROM_CONTACT,254),storeEmail:emailAddress(process.env.STORE_NOTIFICATION_EMAIL),storeName:clean(process.env.STORE_NAME||'Niños Rancios',120)}}
function isConfigured(){const c=config();return !!(c.host&&c.port&&c.user&&c.key&&c.ordersFrom&&c.accountsFrom&&c.contactFrom)}
function publicConfig(){const c=config();return {configured:isConfigured(),ordersFromConfigured:!!c.ordersFrom,accountsFromConfigured:!!c.accountsFrom,contactFromConfigured:!!c.contactFrom,storeNotificationConfigured:!!c.storeEmail}}
function getTransporter(){if(transporter)return transporter;const c=config();if(!isConfigured())return null;transporter=nodemailer.createTransport({host:c.host,port:c.port,secure:c.port===465,auth:{user:c.user,pass:c.key},connectionTimeout:12000,greetingTimeout:12000,socketTimeout:20000});return transporter}
function fromHeader(address){return {name:config().storeName,address:clean(address,254)}}

function brandAttachment(copy){const rel=String(copy?.settings?.logoPath||'').replace(/^\/+/, '');if(!copy?.settings?.showLogo||!rel.startsWith('assets/email/uploads/'))return null;const filename=path.join(root,rel);if(!fs.existsSync(filename))return null;return {filename:path.basename(filename),path:filename,cid:'nr-email-logo'}}
function prepareMessage(message={}){const copy=message._copy;const out={...message};delete out._copy;const attachment=brandAttachment(copy);if(attachment)out.attachments=[...(Array.isArray(out.attachments)?out.attachments:[]),attachment];return out}
async function sendOnce(key,message){const safeKey=clean(key,260);if(!safeKey)return {sent:false,reason:'missing-key'};if(!isConfigured())return {sent:false,reason:'not-configured'};const log=readLog();if(log[safeKey])return {sent:false,reason:'already-sent',at:log[safeKey]?.at||''};if(pendingKeys.has(safeKey))return {sent:false,reason:'already-pending'};pendingKeys.add(safeKey);try{const info=await getTransporter().sendMail(prepareMessage(message));const latest=readLog();latest[safeKey]={at:new Date().toISOString(),messageId:clean(info?.messageId,300)};writeLog(latest);return {sent:true,messageId:info?.messageId||''}}finally{pendingKeys.delete(safeKey)}}
async function send(message){if(!isConfigured())throw new Error('Brevo SMTP no está configurado.');return getTransporter().sendMail(prepareMessage(message))}

function varsForOrder(order={}){const c=order.customer||{};return {pedido:clean(order.orderNumber,80),total:money(order.totals?.total),metodo_pago:clean(order.paymentMethod,100),entrega:clean(order.deliveryMethod,100),estado:clean(order.status,80),nombre:clean([c.nombre,c.apellidos].filter(Boolean).join(' '),180),correo:clean(c.email,254),year:new Date().getFullYear(),store_url:clean(process.env.PUBLIC_BASE_URL,500)||templateStore.get().settings.storeUrl}}
function varsForContact(data={}){return {nombre:clean([data.nombre,data.apellidos].filter(Boolean).join(' '),180)||'Cliente',correo:clean(data.email,254),asunto:clean(data.asunto,160)||'Mensaje desde niñosrancios.com',year:new Date().getFullYear(),store_url:clean(process.env.PUBLIC_BASE_URL,500)||templateStore.get().settings.storeUrl}}
function resolveTemplate(key,vars={}){const cfg=templateStore.get(),t=cfg.templates[key]||{};return {settings:cfg.settings,subject:templateStore.apply(t.subject,vars),title:templateStore.apply(t.title,vars),lead:templateStore.apply(t.lead,vars),buttonText:templateStore.apply(t.buttonText,vars),buttonUrl:templateStore.apply(t.buttonUrl,vars),footer:templateStore.apply(cfg.settings.footerText,{...vars,year:new Date().getFullYear()})}}
function buttonHtml(copy){if(!copy.buttonText||!copy.buttonUrl)return '';const safeUrl=esc(copy.buttonUrl),s=copy.settings||{};return `<div style="margin-top:24px"><a href="${safeUrl}" style="display:inline-block;background:${esc(s.primaryColor||'#111111')};color:${esc(s.buttonTextColor||'#ffffff')};text-decoration:none;padding:12px 18px;border-radius:2px;font-weight:700">${esc(copy.buttonText)}</a></div>`}
function logoHtml(copy){const s=copy.settings||{};if(!s.showLogo||!s.logoPath)return '';const align=['left','center','right'].includes(s.logoAlign)?s.logoAlign:'center';const width=Math.min(360,Math.max(60,Number(s.logoWidth)||180));return `<div style="text-align:${align};margin-bottom:${s.showBrandName?'12px':'4px'}"><img src="cid:nr-email-logo" width="${width}" alt="${esc(s.brandName||'Niños Rancios')}" style="display:inline-block;max-width:100%;height:auto;border:0"></div>`}
function shellHtml(copy,body=''){const s=copy.settings||{},align=['left','center','right'].includes(s.headerAlign)?s.headerAlign:'left',width=Math.min(760,Math.max(480,Number(s.emailWidth)||640)),font=clean(s.fontFamily||'Arial,Helvetica,sans-serif',120);const brand=s.showBrandName?`<div style="font-size:12px;letter-spacing:4px;margin-top:${s.showLogo?'2px':'0'}">${esc(s.brandName)}</div>`:'';const title=copy.title?`<h1 style="margin:${(brand||s.showLogo)?'12px':'0'} 0 0;font-size:28px;color:${esc(s.titleColor||'#ffffff')}">${esc(copy.title)}</h1>`:'';const footer=s.showFooter?`<div style="text-align:center;color:#777;font-size:12px;padding:20px">${esc(copy.footer)}</div>`:'';return `<!doctype html><html><body style="margin:0;background:${esc(s.backgroundColor||'#f3f3f3')};font-family:${esc(font)};color:${esc(s.textColor||'#171717')}"><div style="max-width:${width}px;margin:0 auto;padding:28px 16px"><div style="background:${esc(s.headerBackgroundColor||s.primaryColor||'#111111')};color:${esc(s.titleColor||'#ffffff')};padding:24px 28px;text-align:${align}">${logoHtml(copy)}${brand}${title}</div><div style="background:${esc(s.contentBackgroundColor||'#ffffff')};padding:28px;color:${esc(s.textColor||'#171717')}">${copy.lead?`<p style="margin-top:0">${esc(copy.lead)}</p>`:''}${body}${buttonHtml(copy)}</div>${footer}</div></body></html>`}

function orderItemsHtml(order={}){const items=Array.isArray(order.items)?order.items:[];return items.map(item=>{const variant=[item.color?`Color: ${esc(item.color)}`:'',item.size?`Talla: ${esc(item.size)}`:''].filter(Boolean).join(' · ');return `<tr><td style="padding:12px 0;border-bottom:1px solid #ececec"><strong>${esc(item.name||item.id)}</strong>${variant?`<div style="color:#666;font-size:13px;margin-top:4px">${variant}</div>`:''}<div style="color:#666;font-size:13px;margin-top:4px">Cantidad: ${Number(item.qty)||1}</div></td><td style="padding:12px 0;border-bottom:1px solid #ececec;text-align:right;white-space:nowrap">${money(item.lineTotal)}</td></tr>`}).join('')}
function orderTotalsHtml(order={}){const t=order.totals||{};return `<table role="presentation" style="width:100%;border-collapse:collapse;margin-top:18px;font-size:14px"><tr><td style="padding:5px 0;color:#666">Subtotal</td><td style="padding:5px 0;text-align:right">${money(t.subtotal)}</td></tr>${Number(t.discount)>0?`<tr><td style="padding:5px 0;color:#666">Descuento</td><td style="padding:5px 0;text-align:right">- ${money(t.discount)}</td></tr>`:''}<tr><td style="padding:5px 0;color:#666">Envío</td><td style="padding:5px 0;text-align:right">${Number(t.shipping)===0?'Gratis':money(t.shipping)}</td></tr><tr><td style="padding:12px 0 0;font-size:17px"><strong>Total</strong></td><td style="padding:12px 0 0;text-align:right;font-size:17px"><strong>${money(t.total)}</strong></td></tr></table>`}
function transferHtml(order={}){if(order.paymentMethod!=='Transferencia bancaria'||!order.transfer?.bank)return '';const b=order.transfer.bank;const rows=[['Banco',b.bankName],['Titular',b.accountHolder],['CLABE',b.clabe],['Cuenta',b.accountNumber],['Tarjeta',b.cardNumber],['Referencia',order.transfer.reference||order.orderNumber]].filter(([,v])=>clean(v));return `<div style="margin-top:22px;padding:18px;background:#f6f6f6"><strong>Datos para tu transferencia</strong>${rows.map(([k,v])=>`<div style="margin-top:8px"><span style="color:#666">${esc(k)}:</span> ${esc(v)}</div>`).join('')}${b.instructions?`<div style="margin-top:12px;color:#444">${esc(b.instructions)}</div>`:''}</div>`}
function orderTemplateKey(order={}){if(order.paymentMethod==='Transferencia bancaria'&&order.paymentStatus!=='Pagado')return 'order_transfer';if(order.paymentMethod==='Contraentrega')return 'order_cod';return 'order_paid'}
function customerOrderCopy(order={}){return resolveTemplate(orderTemplateKey(order),varsForOrder(order))}
function customerOrderHtml(order={}){const copy=customerOrderCopy(order),c=order.customer||{},name=[c.nombre,c.apellidos].filter(Boolean).join(' ').trim();const body=`${name?`<p>Hola ${esc(name)},</p>`:''}<div style="margin:24px 0;padding:16px;border:1px solid #e4e4e4"><div style="font-size:12px;color:#777;letter-spacing:1px">NÚMERO DE PEDIDO</div><div style="font-size:24px;margin-top:5px"><strong>${esc(order.orderNumber)}</strong></div><div style="margin-top:8px;color:#555">${esc(order.paymentMethod||'')} · ${esc(order.deliveryMethod||'')}</div></div><table role="presentation" style="width:100%;border-collapse:collapse">${orderItemsHtml(order)}</table>${orderTotalsHtml(order)}${transferHtml(order)}<p style="margin:26px 0 0;color:#666;font-size:13px">Conserva tu número de pedido para cualquier seguimiento.</p>`;return shellHtml(copy,body)}
function customerOrderText(order={}){const copy=customerOrderCopy(order);const itemLines=(order.items||[]).map(i=>`- ${i.name||i.id} · ${i.color||''} ${i.size?`· Talla ${i.size}`:''} · Cant. ${i.qty} · ${money(i.lineTotal)}`).join('\n');return `${copy.title}\n\n${copy.lead}\n\nPedido: ${order.orderNumber}\nPago: ${order.paymentMethod}\nEntrega: ${order.deliveryMethod}\n\n${itemLines}\n\nTotal: ${money(order.totals?.total)}\n`}
function storeOrderHtml(order={}){const vars=varsForOrder(order),copy=resolveTemplate('store_order',vars),c=order.customer||{},address=[c.calle,c.colonia,c.cp,c.ciudad,c.estado,c.pais].filter(Boolean).map(esc).join('<br>');const body=`<p><strong>${esc(order.paymentMethod||'')}</strong> · ${esc(order.paymentStatus||'')} · ${esc(order.deliveryMethod||'')}</p><p><strong>Total: ${money(order.totals?.total)}</strong></p><h3>Cliente</h3><p>${esc([c.nombre,c.apellidos].filter(Boolean).join(' '))}<br>${esc(c.email||'')}<br>${esc(c.telefono||'')}</p><h3>Dirección</h3><p>${address||'Sin dirección'}</p>${order.note?`<h3>Nota</h3><p>${esc(order.note)}</p>`:''}<h3>Productos</h3><table role="presentation" style="width:100%;border-collapse:collapse">${orderItemsHtml(order)}</table>${orderTotalsHtml(order)}`;return {copy,html:shellHtml(copy,body)}}

async function notifyOrderCreated(order={}){const orderNumber=clean(order.orderNumber,60);if(!orderNumber)return {customer:null,store:null};const c=config(),to=emailAddress(order.customer?.email),customerCopy=customerOrderCopy(order),storeRendered=storeOrderHtml(order);const customerMessage=to?sendOnce(`order:${orderNumber}:customer:created`,{_copy:customerCopy,from:fromHeader(c.ordersFrom),to,replyTo:c.ordersFrom,subject:customerCopy.subject,text:customerOrderText(order),html:customerOrderHtml(order)}):Promise.resolve({sent:false,reason:'missing-customer-email'});const storeMessage=c.storeEmail?sendOnce(`order:${orderNumber}:store:created`,{_copy:storeRendered.copy,from:fromHeader(c.ordersFrom),to:c.storeEmail,replyTo:to||c.ordersFrom,subject:storeRendered.copy.subject,text:`${storeRendered.copy.title}\n${storeRendered.copy.lead}\nTotal: ${money(order.totals?.total)}\nMétodo: ${clean(order.paymentMethod,80)}\nCliente: ${clean([order.customer?.nombre,order.customer?.apellidos].filter(Boolean).join(' '),180)}\nCorreo: ${to}`,html:storeRendered.html}):Promise.resolve({sent:false,reason:'missing-store-email'});const [customer,store]=await Promise.all([customerMessage,storeMessage]);return {customer,store}}

function statusTemplateKey(status){if(status==='Enviado')return 'status_sent';if(status==='Entregado')return 'status_delivered';if(status==='Cancelado')return 'status_cancelled';if(status==='Pagado')return 'status_paid';return ''}
async function notifyOrderStatus(order={}){const key=statusTemplateKey(clean(order.status,50));const to=emailAddress(order.customer?.email),c=config();if(!key||!to)return {sent:false,reason:'status-not-notifiable'};const copy=resolveTemplate(key,varsForOrder(order)),shipment=order.shipment||{};const tracking=(shipment.trackingNumber||shipment.trackingUrl)?`<div style="margin-top:20px;padding:16px;background:#f6f6f6"><strong>Rastreo</strong>${shipment.carrier?`<div style="margin-top:8px">Paquetería: ${esc(shipment.carrier)}</div>`:''}${shipment.trackingNumber?`<div>Guía: ${esc(shipment.trackingNumber)}</div>`:''}${shipment.trackingUrl?`<div style="margin-top:8px"><a href="${esc(shipment.trackingUrl)}">Consultar seguimiento</a></div>`:''}</div>`:'';const html=shellHtml(copy,`<p><strong>Pedido ${esc(order.orderNumber)}</strong></p>${tracking}`);return sendOnce(`order:${clean(order.orderNumber,60)}:customer:status:${clean(order.status,50).toLowerCase()}`,{_copy:copy,from:fromHeader(c.ordersFrom),to,replyTo:c.ordersFrom,subject:copy.subject,text:`${copy.title}\n\n${copy.lead}\nPedido: ${order.orderNumber}${shipment.trackingNumber?`\nGuía: ${shipment.trackingNumber}`:''}`,html})}

async function sendContactMessage(data={}){const c=config();if(!c.storeEmail)throw new Error('Configura STORE_NOTIFICATION_EMAIL para recibir el formulario de contacto.');const email=emailAddress(data.email);if(!email)throw new Error('Ingresa un correo electrónico válido.');const vars=varsForContact(data),name=vars.nombre,subject=vars.asunto,message=clean(data.mensaje,4000),storeCopy=resolveTemplate('contact_store',vars),customerCopy=resolveTemplate('contact_customer',vars);const storeBody=`<p><strong>Nombre:</strong> ${esc(name)}<br><strong>Correo:</strong> ${esc(email)}<br><strong>Asunto:</strong> ${esc(subject)}</p><div style="white-space:pre-wrap;padding:18px;background:#f5f5f5">${esc(message)}</div>`;const store=await send({_copy:storeCopy,from:fromHeader(c.contactFrom),to:c.storeEmail,replyTo:email,subject:storeCopy.subject,text:`${storeCopy.title}\n${storeCopy.lead}\n\nNombre: ${name}\nCorreo: ${email}\nAsunto: ${subject}\n\n${message}`,html:shellHtml(storeCopy,storeBody)});const customer=await send({_copy:customerCopy,from:fromHeader(c.contactFrom),to:email,replyTo:c.contactFrom,subject:customerCopy.subject,text:`Hola ${name}.\n\n${customerCopy.lead}\n\nNiños Rancios`,html:shellHtml(customerCopy,`<p>Hola ${esc(name)}.</p><p style="color:#666;font-size:13px">Puedes responder directamente a este correo si necesitas agregar información.</p>`)});return {storeMessageId:store?.messageId||'',customerMessageId:customer?.messageId||''}}

async function sendNewsletterWelcome(to=''){
  const address=emailAddress(to);
  if(!address)throw new Error('El correo del newsletter no es válido.');
  const c=config();
  if(!c.contactFrom)throw new Error('Configura BREVO_FROM_CONTACT en server/.env.');
  const vars={correo:address,year:new Date().getFullYear(),store_url:clean(process.env.PUBLIC_BASE_URL,500)||templateStore.get().settings.storeUrl};
  const copy=resolveTemplate('newsletter_welcome',vars);
  const body='<p>Gracias por formar parte de nuestra comunidad.</p><p>Te avisaremos sobre nuevos lanzamientos, novedades y promociones de Niños Rancios.</p><p style="color:#666;font-size:13px">Cuando recibas nuestros boletines podrás darte de baja mediante el enlace incluido en ellos.</p>';
  return sendOnce(`newsletter:welcome:${address}`,{
    _copy:copy,
    from:fromHeader(c.contactFrom),
    to:address,
    replyTo:c.contactFrom,
    subject:copy.subject,
    text:`${copy.title}\n\n${copy.lead}\n\nGracias por formar parte de nuestra comunidad.\n\nNiños Rancios`,
    html:shellHtml(copy,body)
  });
}


function stripTags(value){return String(value||'').replace(/<br\s*\/?>/gi,'\n').replace(/<\/p>/gi,'\n\n').replace(/<\/div>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/\n{3,}/g,'\n\n').trim()}
function safeHref(value){const v=clean(value,900);return /^(https?:\/\/|mailto:)/i.test(v)?v:''}
function sanitizeAdminHtml(value){
  let html=String(value||'').slice(0,30000);
  html=html.replace(/<!--[^]*?-->/g,'').replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|svg|math)[^>]*>[^]*?<\/\1\s*>/gi,'').replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|svg|math)[^>]*\/?>/gi,'');
  const allowed=new Set(['p','br','strong','b','em','i','u','h1','h2','h3','ul','ol','li','a','blockquote','hr','span','div']);
  return html.replace(/<\/?([a-z0-9]+)([^>]*)>/gi,(full,tag,attrs)=>{
    tag=tag.toLowerCase();if(!allowed.has(tag))return '';
    if(full.startsWith('</'))return `</${tag}>`;
    if(tag==='br'||tag==='hr')return `<${tag}>`;
    let kept='';
    if(tag==='a'){
      const m=String(attrs||'').match(/href\s*=\s*["']([^"']+)["']/i);const href=m?safeHref(m[1]):'';
      if(href)kept+=` href="${esc(href)}" target="_blank" rel="noopener"`;
    }
    const sm=String(attrs||'').match(/style\s*=\s*["']([^"']+)["']/i);
    if(sm){const safe=sm[1].split(';').map(v=>v.trim()).filter(Boolean).filter(v=>/^(color|background-color|font-size|font-weight|font-style|text-decoration|text-align|line-height|margin|margin-top|margin-bottom|padding):/i.test(v)&&!/url\s*\(|expression\s*\(/i.test(v)).join(';');if(safe)kept+=` style="${esc(safe)}"`}
    return `<${tag}${kept}>`;
  });
}
function manualSender(kind,c=config()){if(kind==='accounts')return c.accountsFrom;if(kind==='contact')return c.contactFrom;return c.ordersFrom}
function manualCopy(title=''){const cfg=templateStore.get();return {settings:cfg.settings,subject:'',title:clean(title,180),lead:'',buttonText:'',buttonUrl:'',footer:templateStore.apply(cfg.settings.footerText,{year:new Date().getFullYear(),store_url:cfg.settings.storeUrl})}}
async function sendManualEmail(data={}){
  const to=emailAddress(data.to);if(!to)throw new Error('Ingresa un correo destinatario válido.');
  const subject=clean(data.subject,240);if(!subject)throw new Error('Escribe el asunto del correo.');
  const htmlBody=sanitizeAdminHtml(data.html);const plain=clean(data.text,10000)||stripTags(htmlBody);if(!htmlBody&&!plain)throw new Error('Escribe el mensaje.');
  const kind=['orders','accounts','contact'].includes(String(data.fromKind||''))?String(data.fromKind):'contact';
  const from=manualSender(kind);if(!from)throw new Error('El remitente seleccionado no está configurado en server/.env.');
  const title=clean(data.title,180);const copy=manualCopy(title);const html=shellHtml(copy,htmlBody||`<div style="white-space:pre-wrap">${esc(plain)}</div>`);
  const info=await send({_copy:copy,from:fromHeader(from),to,replyTo:from,subject,text:plain||subject,html});
  const rows=readManualLog();rows.push({id:crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`,at:new Date().toISOString(),to,subject,fromKind:kind,from:clean(from,254),title,orderNumber:clean(data.orderNumber,80),messageId:clean(info?.messageId,300)});writeManualLog(rows);
  return {sent:true,messageId:info?.messageId||''};
}
function listManualEmails(limit=50){const n=Math.min(100,Math.max(1,Number(limit)||50));return readManualLog().slice(-n).reverse()}

function accountBaseUrl(){return (clean(process.env.PUBLIC_BASE_URL,500)||templateStore.get().settings.storeUrl||'').replace(/\/+$/,'')}
function accountVars(customer={},extra={}){const name=clean([customer.nombre,customer.apellidos].filter(Boolean).join(' '),180)||'Cliente',base=accountBaseUrl();return {nombre:name,correo:clean(customer.email,254),store_url:base,account_url:`${base}/account.html`,contact_url:`${base}/contact.html`,year:new Date().getFullYear(),...extra}}
function accountsFrom(){const c=config();if(!c.accountsFrom)throw new Error('Configura BREVO_FROM_ACCOUNTS en server/.env.');return c.accountsFrom}
const REQUIRED_ACCOUNT_ACTIONS={
  account_verify:'Confirmar mi correo',
  password_reset:'Restablecer contraseña',
  email_change_verify:'Confirmar nuevo correo'
};
function accountActionFallback(action=''){
  const url=clean(action,900);if(!url)return '';
  return `<div style="margin-top:22px;padding-top:18px;border-top:1px solid #ececec;color:#666;font-size:13px;line-height:1.5">Si el botón no funciona, abre este enlace:<br><a href="${esc(url)}" style="color:inherit;word-break:break-all">${esc(url)}</a></div>`;
}
async function sendAccountTemplate(key,to,vars={},body=''){
  const address=emailAddress(to);if(!address)throw new Error('El correo de la cuenta no es válido.');
  const copy=resolveTemplate(key,vars),action=clean(vars.action_url,900),requiredText=REQUIRED_ACCOUNT_ACTIONS[key];
  // Los correos de seguridad nunca deben salir sin una acción utilizable. El texto
  // del botón puede personalizarse, pero la URL siempre se genera en el servidor.
  if(requiredText&&action){copy.buttonText=copy.buttonText||requiredText;copy.buttonUrl=action}
  const html=shellHtml(copy,`${body}${requiredText&&action?accountActionFallback(action):''}`);
  return send({_copy:copy,from:fromHeader(accountsFrom()),to:address,replyTo:accountsFrom(),subject:copy.subject,text:`${copy.title}\n\n${copy.lead}${action?`\n\n${action}`:''}\n\nNiños Rancios`,html});
}
async function sendAccountVerification(customer={},token=''){const base=accountBaseUrl(),actionUrl=`${base}/verify-email.html?action=verify&token=${encodeURIComponent(token)}`,vars=accountVars(customer,{action_url:actionUrl});return sendAccountTemplate('account_verify',customer.email,vars,`<p>Si tú creaste esta cuenta, utiliza el botón para confirmar tu correo.</p><p style="color:#666;font-size:13px">Por seguridad, este enlace caduca en 24 horas.</p>`)}
async function sendWelcome(customer={}){const vars=accountVars(customer);return sendAccountTemplate('account_welcome',customer.email,vars,`<p>Hola ${esc(vars.nombre)}.</p><p>Ya puedes iniciar sesión, consultar tus pedidos y administrar tus datos desde Mi cuenta.</p>`)}
async function sendPasswordReset(customer={},token=''){const base=accountBaseUrl(),actionUrl=`${base}/reset-password.html?token=${encodeURIComponent(token)}`,vars=accountVars(customer,{action_url:actionUrl});return sendAccountTemplate('password_reset',customer.email,vars,`<p>Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual seguirá funcionando.</p><p style="color:#666;font-size:13px">El enlace es de un solo uso y caduca en 60 minutos.</p>`)}
async function sendPasswordChanged(customer={}){const vars=accountVars(customer);return sendAccountTemplate('password_changed',customer.email,vars,`<p>Fecha del cambio: ${esc(new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(new Date()))}</p>`)}
async function sendEmailChangeVerification(customer={},newEmail='',token=''){const base=accountBaseUrl(),address=emailAddress(newEmail);if(!address)throw new Error('El nuevo correo no es válido.');const actionUrl=`${base}/verify-email.html?action=email-change&token=${encodeURIComponent(token)}`,vars=accountVars(customer,{action_url:actionUrl,nuevo_correo:address,correo_anterior:clean(customer.email,254)});return sendAccountTemplate('email_change_verify',address,vars,`<p>Correo actual: <strong>${esc(customer.email)}</strong><br>Nuevo correo: <strong>${esc(address)}</strong></p><p style="color:#666;font-size:13px">El enlace caduca en 60 minutos.</p>`)}
async function sendEmailChangedNotice(oldEmail='',customer={}){const old=emailAddress(oldEmail);if(!old)return {sent:false,reason:'invalid-old-email'};const vars=accountVars(customer,{correo_anterior:old,nuevo_correo:clean(customer.email,254)});return sendAccountTemplate('email_changed_old',old,vars,`<p>Correo anterior: <strong>${esc(old)}</strong><br>Nuevo correo: <strong>${esc(customer.email)}</strong></p>`)}
async function sendEmailChangedConfirmation(customer={},oldEmail=''){const vars=accountVars(customer,{correo_anterior:clean(oldEmail,254),nuevo_correo:clean(customer.email,254)});return sendAccountTemplate('email_changed_new',customer.email,vars,`<p>Tu nuevo correo ya quedó verificado.</p>`)}

module.exports={isConfigured,publicConfig,notifyOrderCreated,notifyOrderStatus,sendContactMessage,sendNewsletterWelcome,emailAddress,sendManualEmail,listManualEmails,shellHtml,sendAccountVerification,sendWelcome,sendPasswordReset,sendPasswordChanged,sendEmailChangeVerification,sendEmailChangedNotice,sendEmailChangedConfirmation};
