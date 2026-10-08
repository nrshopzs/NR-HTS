const crypto=require('crypto');

const accessToken=String(process.env.MERCADOPAGO_ACCESS_TOKEN||'').trim();
const webhookSecret=String(process.env.MERCADOPAGO_WEBHOOK_SECRET||'').trim();
const apiBase='https://api.mercadopago.com';

function isConfigured(){return !!accessToken}
function webhookConfigured(){return !!webhookSecret}
function getMode(){
  if(accessToken.startsWith('TEST-'))return 'test';
  if(accessToken.startsWith('APP_USR-'))return 'live';
  return accessToken?'unknown':'unconfigured';
}
function amount(cents){return Number((Math.max(0,Number(cents)||0)/100).toFixed(2))}
function cleanIdempotency(value=''){
  const v=String(value||'').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)?v:crypto.randomUUID();
}
async function request(pathname,{method='GET',body,idempotencyKey}={}){
  if(!accessToken)throw new Error('Mercado Pago no está configurado.');
  const headers={Authorization:`Bearer ${accessToken}`,Accept:'application/json'};
  if(body!==undefined)headers['Content-Type']='application/json';
  if(idempotencyKey)headers['X-Idempotency-Key']=cleanIdempotency(idempotencyKey);
  const response=await fetch(`${apiBase}${pathname}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok){
    const message=data?.message||data?.error||data?.cause?.[0]?.description||data?.errors?.[0]?.message||'Mercado Pago rechazó la solicitud.';
    const err=new Error(String(message));
    err.status=response.status;err.mercadoPago=data;throw err;
  }
  return data;
}
async function createPreference({amountCents,email='',successUrl='',failureUrl='',pendingUrl='',notificationUrl='',externalReference='',idempotencyKey=''}){
  const body={
    items:[{id:'ninos-rancios-order',title:'Compra en Niños Rancios',quantity:1,currency_id:'MXN',unit_price:amount(amountCents)}],
    external_reference:String(externalReference||'').slice(0,64),
    back_urls:{success:successUrl,failure:failureUrl,pending:pendingUrl},
    auto_return:'approved'
  };
  // V122: en modo de prueba no fijamos payer.email. Dejamos que Checkout Pro
  // use la identidad de la cuenta Comprador de prueba que inició sesión.
  if(email&&getMode()!=='test')body.payer={email:String(email).trim().slice(0,254)};
  if(notificationUrl)body.notification_url=notificationUrl;
  return request('/checkout/preferences',{method:'POST',body,idempotencyKey});
}
async function getPayment(paymentId){
  const id=String(paymentId||'').trim();
  if(!id)throw new Error('Falta el identificador del pago de Mercado Pago.');
  return request(`/v1/payments/${encodeURIComponent(id)}`);
}
async function findLatestPaymentByReference(externalReference){
  const ref=String(externalReference||'').trim();
  if(!ref)return null;
  const params=new URLSearchParams({external_reference:ref,sort:'date_created',criteria:'desc'});
  const data=await request(`/v1/payments/search?${params.toString()}`);
  const rows=Array.isArray(data?.results)?data.results:[];
  return rows.find(p=>String(p?.status||'').toLowerCase()==='approved')||rows[0]||null;
}
function paid(payment={}){return String(payment.status||'').toLowerCase()==='approved'}
function paidAmountCents(payment={}){
  const cents=Math.round(Number(payment.transaction_amount)*100);
  return Number.isFinite(cents)?cents:0;
}
function verifyWebhookSignature(headers={},dataId=''){
  if(!webhookSecret)return false;
  const signature=String(headers['x-signature']||'');
  const requestId=String(headers['x-request-id']||'');
  const parts=Object.fromEntries(signature.split(',').map(part=>part.trim().split('=').map(v=>String(v||'').trim())).filter(pair=>pair.length===2&&pair[0]));
  const ts=parts.ts||'';
  const v1=parts.v1||'';
  if(!ts||!v1)return false;
  const id=String(dataId||'').trim().toLowerCase();
  let manifest='';
  if(id)manifest+=`id:${id};`;
  if(requestId)manifest+=`request-id:${requestId};`;
  manifest+=`ts:${ts};`;
  const expected=crypto.createHmac('sha256',webhookSecret).update(manifest).digest('hex');
  try{
    const a=Buffer.from(expected,'hex'),b=Buffer.from(v1,'hex');
    return a.length===b.length&&a.length>0&&crypto.timingSafeEqual(a,b);
  }catch{return false}
}

module.exports={isConfigured,webhookConfigured,getMode,createPreference,getPayment,findLatestPaymentByReference,paid,paidAmountCents,verifyWebhookSignature,cleanIdempotency};
