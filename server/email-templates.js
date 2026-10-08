const fs=require('fs');
const path=require('path');

const dataDir=path.join(__dirname,'data');
const file=path.join(dataDir,'email-templates.json');

const DEFAULTS={
  settings:{
    brandName:'NIÑOS RANCIOS',
    showBrandName:true,
    showLogo:false,
    logoPath:'',
    logoWidth:180,
    logoAlign:'center',
    headerAlign:'left',
    emailWidth:640,
    fontFamily:'Arial,Helvetica,sans-serif',
    headerBackgroundColor:'#111111',
    titleColor:'#ffffff',
    primaryColor:'#111111',
    buttonTextColor:'#ffffff',
    backgroundColor:'#f3f3f3',
    contentBackgroundColor:'#ffffff',
    textColor:'#171717',
    showFooter:true,
    footerText:'© {{year}} Niños Rancios',
    storeUrl:'https://niñosrancios.com'
  },
  templates:{
    order_paid:{label:'Pedido confirmado · pago aprobado',subject:'Pedido {{pedido}} confirmado',title:'¡Gracias por tu compra!',lead:'Tu pago fue confirmado y recibimos correctamente tu pedido.',buttonText:'',buttonUrl:''},
    order_transfer:{label:'Pedido recibido · transferencia pendiente',subject:'Pedido {{pedido}} recibido · transferencia pendiente',title:'Recibimos tu pedido',lead:'Tu pedido quedó reservado. Realiza la transferencia con los datos indicados para que podamos confirmar el pago.',buttonText:'',buttonUrl:''},
    order_cod:{label:'Pedido confirmado · contra entrega',subject:'Pedido {{pedido}} confirmado',title:'¡Tu pedido está confirmado!',lead:'Prepararemos tu pedido. El pago se realizará al momento de la entrega.',buttonText:'',buttonUrl:''},
    store_order:{label:'Aviso interno · nuevo pedido',subject:'Nuevo pedido {{pedido}} · {{total}} · {{metodo_pago}}',title:'Nuevo pedido {{pedido}}',lead:'Se registró un nuevo pedido en la tienda.',buttonText:'',buttonUrl:''},
    status_paid:{label:'Estado · pagado',subject:'Pago confirmado · pedido {{pedido}}',title:'Pago confirmado',lead:'Confirmamos tu pago y comenzaremos a preparar tu pedido.',buttonText:'',buttonUrl:''},
    status_sent:{label:'Estado · enviado',subject:'Tu pedido {{pedido}} va en camino',title:'¡Tu pedido va en camino!',lead:'Ya preparamos y enviamos tu pedido.',buttonText:'Consultar mi pedido',buttonUrl:'{{store_url}}/order-lookup.html'},
    status_delivered:{label:'Estado · entregado',subject:'Pedido {{pedido}} entregado',title:'Pedido entregado',lead:'Marcamos tu pedido como entregado. Gracias por comprar en Niños Rancios.',buttonText:'Visitar Niños Rancios',buttonUrl:'{{store_url}}'},
    status_cancelled:{label:'Estado · cancelado',subject:'Actualización de tu pedido {{pedido}}',title:'Pedido cancelado',lead:'Tu pedido fue marcado como cancelado. Si tienes dudas, responde a este correo.',buttonText:'',buttonUrl:''},
    contact_customer:{label:'Contacto · confirmación al cliente',subject:'Recibimos tu mensaje · Niños Rancios',title:'Recibimos tu mensaje',lead:'Gracias por escribirnos. Recibimos tu mensaje y te responderemos lo antes posible.',buttonText:'Visitar Niños Rancios',buttonUrl:'{{store_url}}'},
    contact_store:{label:'Contacto · aviso interno',subject:'Contacto web · {{asunto}}',title:'Nuevo mensaje desde Niños Rancios',lead:'Se recibió un mensaje desde el formulario de contacto.',buttonText:'',buttonUrl:''},
    newsletter_welcome:{label:'Newsletter · bienvenida',subject:'Bienvenido al newsletter de Niños Rancios',title:'¡Bienvenido a Niños Rancios!',lead:'Gracias por unirte. A partir de ahora podrás recibir novedades, lanzamientos y promociones de Niños Rancios.',buttonText:'Visitar Niños Rancios',buttonUrl:'{{store_url}}'},
    account_verify:{label:'Cuenta · verificar correo',subject:'Confirma tu correo · Niños Rancios',title:'Confirma tu correo',lead:'Hola {{nombre}}. Confirma tu dirección de correo para activar tu cuenta de Niños Rancios.',buttonText:'Confirmar mi correo',buttonUrl:'{{action_url}}'},
    account_welcome:{label:'Cuenta · bienvenida',subject:'Bienvenido a Niños Rancios',title:'¡Bienvenido a Niños Rancios!',lead:'Tu correo ya está verificado y tu cuenta está lista.',buttonText:'Ir a mi cuenta',buttonUrl:'{{account_url}}'},
    password_reset:{label:'Cuenta · recuperar contraseña',subject:'Restablece tu contraseña · Niños Rancios',title:'Restablece tu contraseña',lead:'Recibimos una solicitud para cambiar la contraseña de tu cuenta. Este enlace caduca en 60 minutos.',buttonText:'Restablecer contraseña',buttonUrl:'{{action_url}}'},
    password_changed:{label:'Cuenta · contraseña modificada',subject:'Tu contraseña fue modificada · Niños Rancios',title:'Contraseña modificada',lead:'La contraseña de tu cuenta se cambió correctamente. Si no reconoces este cambio, contáctanos de inmediato.',buttonText:'Ir a Niños Rancios',buttonUrl:'{{store_url}}'},
    email_change_verify:{label:'Cuenta · verificar nuevo correo',subject:'Confirma tu nuevo correo · Niños Rancios',title:'Confirma tu nuevo correo',lead:'Recibimos una solicitud para cambiar el correo de tu cuenta a {{nuevo_correo}}. Confirma esta dirección para completar el cambio.',buttonText:'Confirmar nuevo correo',buttonUrl:'{{action_url}}'},
    email_changed_old:{label:'Cuenta · aviso al correo anterior',subject:'El correo de tu cuenta fue modificado · Niños Rancios',title:'Correo electrónico modificado',lead:'El correo de tu cuenta cambió de {{correo_anterior}} a {{nuevo_correo}}. Si no realizaste este cambio, contáctanos de inmediato.',buttonText:'Contactar a Niños Rancios',buttonUrl:'{{contact_url}}'},
    email_changed_new:{label:'Cuenta · confirmación al nuevo correo',subject:'Tu nuevo correo ya está confirmado · Niños Rancios',title:'Correo actualizado',lead:'Tu cuenta ahora usa {{nuevo_correo}} como dirección de correo electrónico.',buttonText:'Ir a mi cuenta',buttonUrl:'{{account_url}}'}
  }
};

function clone(v){return JSON.parse(JSON.stringify(v))}
function clean(v,max=1200){return String(v??'').trim().slice(0,max)}
function hex(v,fallback){const s=clean(v,20);return /^#[0-9a-f]{6}$/i.test(s)?s:fallback}
function bool(v,fallback){return typeof v==='boolean'?v:fallback}
function number(v,min,max,fallback){const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.round(n))):fallback}
function option(v,allowed,fallback){const s=clean(v,120);return allowed.includes(s)?s:fallback}
function safeLogoPath(v){const s=clean(v,500).replace(/^\/+/, '');return s.startsWith('assets/email/uploads/')?s:''}
function ensure(){fs.mkdirSync(dataDir,{recursive:true});if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify(DEFAULTS,null,2)+'\n','utf8')}
function merge(raw={}){
  const out=clone(DEFAULTS);
  const s=raw.settings||{};
  out.settings.brandName=clean(s.brandName,80)||DEFAULTS.settings.brandName;
  out.settings.showBrandName=bool(s.showBrandName,DEFAULTS.settings.showBrandName);
  out.settings.showLogo=bool(s.showLogo,DEFAULTS.settings.showLogo);
  out.settings.logoPath=safeLogoPath(s.logoPath);
  out.settings.logoWidth=number(s.logoWidth,60,360,DEFAULTS.settings.logoWidth);
  out.settings.logoAlign=option(s.logoAlign,['left','center','right'],DEFAULTS.settings.logoAlign);
  out.settings.headerAlign=option(s.headerAlign,['left','center','right'],DEFAULTS.settings.headerAlign);
  out.settings.emailWidth=number(s.emailWidth,480,760,DEFAULTS.settings.emailWidth);
  out.settings.fontFamily=option(s.fontFamily,[
    'Arial,Helvetica,sans-serif',
    'Helvetica,Arial,sans-serif',
    'Verdana,Geneva,sans-serif',
    'Trebuchet MS,Arial,sans-serif',
    'Georgia,Times New Roman,serif'
  ],DEFAULTS.settings.fontFamily);
  out.settings.headerBackgroundColor=hex(s.headerBackgroundColor,s.primaryColor||DEFAULTS.settings.headerBackgroundColor);
  out.settings.titleColor=hex(s.titleColor,DEFAULTS.settings.titleColor);
  out.settings.primaryColor=hex(s.primaryColor,DEFAULTS.settings.primaryColor);
  out.settings.buttonTextColor=hex(s.buttonTextColor,DEFAULTS.settings.buttonTextColor);
  out.settings.backgroundColor=hex(s.backgroundColor,DEFAULTS.settings.backgroundColor);
  out.settings.contentBackgroundColor=hex(s.contentBackgroundColor,DEFAULTS.settings.contentBackgroundColor);
  out.settings.textColor=hex(s.textColor,DEFAULTS.settings.textColor);
  out.settings.showFooter=bool(s.showFooter,DEFAULTS.settings.showFooter);
  out.settings.footerText=clean(s.footerText,240)||DEFAULTS.settings.footerText;
  out.settings.storeUrl=clean(s.storeUrl,500)||DEFAULTS.settings.storeUrl;
  for(const [key,def] of Object.entries(DEFAULTS.templates)){
    const hasTemplate=!!(raw.templates&&Object.prototype.hasOwnProperty.call(raw.templates,key));
    const src=hasTemplate?(raw.templates[key]||{}):{};
    out.templates[key]={
      label:def.label,
      subject:clean(src.subject,240)||def.subject,
      title:clean(src.title,180)||def.title,
      lead:clean(src.lead,1400)||def.lead,
      // Si la plantilla todavía no existía en una versión anterior, hereda también
      // el botón predeterminado. Si ya existía, respetamos que el usuario lo haya
      // dejado vacío deliberadamente.
      buttonText:hasTemplate?clean(src.buttonText,100):def.buttonText,
      buttonUrl:hasTemplate?clean(src.buttonUrl,700):def.buttonUrl
    };
  }
  return out;
}
function get(){ensure();try{return merge(JSON.parse(fs.readFileSync(file,'utf8')))}catch{return clone(DEFAULTS)}}
function save(raw){const data=merge(raw);ensure();fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n','utf8');return data}
function reset(){ensure();fs.writeFileSync(file,JSON.stringify(DEFAULTS,null,2)+'\n','utf8');return clone(DEFAULTS)}
function apply(text,vars={}){return String(text??'').replace(/\{\{([a-z0-9_]+)\}\}/gi,(_,key)=>String(vars[key]??''))}

module.exports={DEFAULTS,get,save,reset,apply};
