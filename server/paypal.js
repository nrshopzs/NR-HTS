const crypto=require('crypto');

const clientId=String(process.env.PAYPAL_CLIENT_ID||'').trim();
const clientSecret=String(process.env.PAYPAL_CLIENT_SECRET||'').trim();
const requestedMode=String(process.env.PAYPAL_ENV||'sandbox').trim().toLowerCase();
const webhookId=String(process.env.PAYPAL_WEBHOOK_ID||'').trim();
const mode=requestedMode==='live'?'live':'sandbox';
const apiBase=mode==='live'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com';
let tokenCache={value:'',expiresAt:0};

function isConfigured(){return !!(clientId&&clientSecret)}
function getMode(){return mode}
function webhookConfigured(){return !!webhookId}
function makeRequestId(prefix='nr-paypal'){
  return `${prefix}-${crypto.randomUUID()}`.slice(0,108);
}
async function accessToken(){
  if(!isConfigured())throw new Error('PayPal no está configurado.');
  if(tokenCache.value&&Date.now()<tokenCache.expiresAt-60000)return tokenCache.value;
  const auth=Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response=await fetch(`${apiBase}/v1/oauth2/token`,{
    method:'POST',
    headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded'},
    body:'grant_type=client_credentials'
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.access_token){
    const err=new Error(data.error_description||data.error||'No fue posible autenticar PayPal.');
    err.status=response.status;err.paypal=data;throw err;
  }
  tokenCache={value:data.access_token,expiresAt:Date.now()+(Number(data.expires_in)||300)*1000};
  return tokenCache.value;
}
async function paypalRequest(pathname,{method='GET',body,requestId}={}){
  const token=await accessToken();
  const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json','Accept':'application/json'};
  if(requestId)headers['PayPal-Request-Id']=requestId;
  const response=await fetch(`${apiBase}${pathname}`,{
    method,headers,body:body===undefined?undefined:JSON.stringify(body)
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok){
    const detail=Array.isArray(data.details)&&data.details[0]?data.details[0]:null;
    const err=new Error(detail?.description||data.message||data.error_description||'PayPal rechazó la solicitud.');
    err.status=response.status;err.paypal=data;throw err;
  }
  return data;
}
function mxnValue(cents){return (Math.max(0,Number(cents)||0)/100).toFixed(2)}
function shippingAddress(checkout={}){
  const fullName=[checkout.nombre,checkout.apellidos].filter(Boolean).join(' ').trim()||'Cliente Niños Rancios';
  return {
    name:{full_name:fullName.slice(0,300)},
    address:{
      address_line_1:String(checkout.calle||'').slice(0,300),
      address_line_2:String(checkout.colonia||'').slice(0,300),
      admin_area_2:String(checkout.ciudad||'').slice(0,120),
      admin_area_1:String(checkout.estado||'').slice(0,120),
      postal_code:String(checkout.cp||'').slice(0,60),
      country_code:'MX'
    }
  };
}

async function verifyWebhookSignature(headers={},event={}){
  if(!webhookId)throw new Error('Falta configurar PAYPAL_WEBHOOK_ID.');
  const body={
    auth_algo:String(headers['paypal-auth-algo']||''),
    cert_url:String(headers['paypal-cert-url']||''),
    transmission_id:String(headers['paypal-transmission-id']||''),
    transmission_sig:String(headers['paypal-transmission-sig']||''),
    transmission_time:String(headers['paypal-transmission-time']||''),
    webhook_id:webhookId,
    webhook_event:event
  };
  if(!body.auth_algo||!body.cert_url||!body.transmission_id||!body.transmission_sig||!body.transmission_time){
    return false;
  }
  const data=await paypalRequest('/v1/notifications/verify-webhook-signature',{method:'POST',body});
  return String(data?.verification_status||'').toUpperCase()==='SUCCESS';
}

async function createOrder({amountCents,checkout={},returnUrl,cancelUrl,requestId}){
  const body={
    intent:'CAPTURE',
    purchase_units:[{
      reference_id:'NINOS_RANCIOS',
      description:'Compra en Niños Rancios',
      amount:{currency_code:'MXN',value:mxnValue(amountCents)},
      shipping:shippingAddress(checkout)
    }],
    payment_source:{paypal:{experience_context:{
      brand_name:'Niños Rancios',
      locale:'es-MX',
      shipping_preference:'SET_PROVIDED_ADDRESS',
      user_action:'PAY_NOW',
      return_url:returnUrl,
      cancel_url:cancelUrl
    }}}
  };
  const data=await paypalRequest('/v2/checkout/orders',{method:'POST',body,requestId:requestId||makeRequestId('nr-create')});
  const approval=(data.links||[]).find(link=>['payer-action','approve'].includes(link.rel)&&link.href);
  return {...data,approvalUrl:approval?.href||''};
}
async function getOrder(orderId){
  return paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
}
async function captureOrder(orderId,requestId){
  try{
    return await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,{method:'POST',body:{},requestId:requestId||makeRequestId('nr-capture')});
  }catch(err){
    const issues=Array.isArray(err.paypal?.details)?err.paypal.details.map(d=>d.issue):[];
    if(issues.includes('ORDER_ALREADY_CAPTURED'))return getOrder(orderId);
    throw err;
  }
}
module.exports={isConfigured,getMode,webhookConfigured,verifyWebhookSignature,createOrder,getOrder,captureOrder,makeRequestId};
