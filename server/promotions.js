const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {getProductMap}=require('./catalog');

const dataDir=path.join(__dirname,'data');
const file=path.join(dataDir,'promotions.json');
const usageFile=path.join(dataDir,'promotion-usage.json');
const persistence=require('./persistence');
const db=require('./database');

const DEFAULT=[
  {
    id:'promo-nr10',
    name:'NR10 · 10% de descuento',
    kind:'coupon',
    code:'NR10',
    discountType:'percentage',
    value:10,
    minSubtotal:0,
    minQuantity:0,
    maxDiscount:0,
    active:true,
    startsAt:'',
    endsAt:'',
    usageLimit:0,
    perCustomerLimit:0,
    productIds:[]
  },
  {
    id:'promo-rancios10',
    name:'RANCIOS10 · 10% de descuento',
    kind:'coupon',
    code:'RANCIOS10',
    discountType:'percentage',
    value:10,
    minSubtotal:0,
    minQuantity:0,
    maxDiscount:0,
    active:true,
    startsAt:'',
    endsAt:'',
    usageLimit:0,
    perCustomerLimit:0,
    productIds:[]
  }
];

function ensure(){
  fs.mkdirSync(dataDir,{recursive:true});
  if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify(DEFAULT,null,2)+'\n','utf8');
  if(!db.usingPostgres()&&!fs.existsSync(usageFile))fs.writeFileSync(usageFile,'[]\n','utf8');
}
function readJson(target,fallback){ensure();try{return JSON.parse(fs.readFileSync(target,'utf8'))}catch{return fallback}}
function writeJson(target,data){ensure();fs.writeFileSync(target,JSON.stringify(data,null,2)+'\n','utf8')}
function cleanText(v,max=180){return String(v??'').trim().slice(0,max)}
function moneyNum(v,min=0,max=999999){const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.round(n*100)/100)):0}
function intNum(v,min=0,max=999999){const n=Number.parseInt(v,10);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):0}
function isoDate(value){
  const raw=cleanText(value,80);
  if(!raw)return '';
  const d=new Date(raw);
  return Number.isNaN(d.getTime())?'':d.toISOString();
}
function codeValue(v){return cleanText(v,40).toUpperCase().replace(/\s+/g,'')}
function sanitize(raw={},existingId=''){
  const kind=raw.kind==='automatic'?'automatic':'coupon';
  const discountType=['percentage','fixed','free_shipping'].includes(raw.discountType)?raw.discountType:'percentage';
  const code=kind==='coupon'?codeValue(raw.code):'';
  if(kind==='coupon'&&!code)throw new Error('El código del cupón es obligatorio.');
  const value=discountType==='free_shipping'?0:moneyNum(raw.value,0,100000);
  if(discountType==='percentage'&&(value<=0||value>100))throw new Error('El porcentaje debe estar entre 1 y 100.');
  if(discountType==='fixed'&&value<=0)throw new Error('El descuento fijo debe ser mayor que cero.');
  const products=getProductMap();
  const productIds=[...new Set((Array.isArray(raw.productIds)?raw.productIds:[]).map(v=>cleanText(v,80)).filter(id=>products[id]))];
  return {
    id:existingId||cleanText(raw.id,80)||`promo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    name:cleanText(raw.name,160)||code||'Promoción',
    kind,
    code,
    discountType,
    value,
    minSubtotal:moneyNum(raw.minSubtotal,0,999999),
    minQuantity:intNum(raw.minQuantity,0,999),
    maxDiscount:moneyNum(raw.maxDiscount,0,999999),
    active:raw.active!==false,
    startsAt:isoDate(raw.startsAt),
    endsAt:isoDate(raw.endsAt),
    usageLimit:intNum(raw.usageLimit,0,999999),
    perCustomerLimit:intNum(raw.perCustomerLimit,0,999999),
    productIds
  };
}
function all(){ensure();return readJson(file,DEFAULT).map(p=>{try{return sanitize(p,p.id)}catch{return null}}).filter(Boolean)}
async function usages(client=null){return persistence.getPromotionUsage(client)}
async function usageCount(id,client=null){return (await usages(client)).filter(u=>u.promotionId===id).length}
async function customerUsageCount(id,email,client=null){
  const e=cleanText(email,180).toLowerCase();
  if(!e)return 0;
  return (await usages(client)).filter(u=>u.promotionId===id&&String(u.email||'').toLowerCase()===e).length;
}
async function statusFor(p,now=new Date(),client=null){
  if(!p.active)return 'inactive';
  if(p.startsAt&&now<new Date(p.startsAt))return 'upcoming';
  if(p.endsAt&&now>new Date(p.endsAt))return 'expired';
  if(p.usageLimit&&await usageCount(p.id,client)>=p.usageLimit)return 'exhausted';
  return 'active';
}
async function adminList(){
  const now=new Date(),result=[];
  for(const p of all())result.push({...p,usageCount:await usageCount(p.id),status:await statusFor(p,now)});
  return result;
}
function saveAll(list){writeJson(file,list)}
async function createPromotion(raw={}){
  const list=all(),next=sanitize(raw);
  if(next.code&&list.some(p=>p.code===next.code))throw new Error('Ya existe un cupón con ese código.');
  list.push(next);saveAll(list);return next;
}
async function updatePromotion(id,raw={}){
  const list=all(),index=list.findIndex(p=>p.id===id);
  if(index<0)throw new Error('Promoción no encontrada.');
  const next=sanitize({...list[index],...raw},list[index].id);
  if(next.code&&list.some((p,i)=>i!==index&&p.code===next.code))throw new Error('Ya existe un cupón con ese código.');
  list[index]=next;saveAll(list);return next;
}
async function deletePromotion(id){
  const list=all(),next=list.filter(p=>p.id!==id);
  if(next.length===list.length)throw new Error('Promoción no encontrada.');
  saveAll(next);return true;
}
function cartInfo(items=[]){
  const products=getProductMap();
  let subtotal=0,totalQty=0;
  const lines=[];
  for(const raw of Array.isArray(items)?items:[]){
    const id=cleanText(raw?.id,80),p=products[id],qty=Math.max(1,Math.min(20,Number.parseInt(raw?.qty,10)||1));
    if(!p)throw new Error('Hay un producto no válido en el carrito.');
    const line=p.price*qty;
    subtotal+=line;totalQty+=qty;lines.push({id,qty,line});
  }
  if(!lines.length)throw new Error('El carrito está vacío.');
  return {subtotal,totalQty,lines};
}
function eligibleBase(p,cart){
  if(!p.productIds.length)return {amount:cart.subtotal,quantity:cart.totalQty};
  const ids=new Set(p.productIds);
  return cart.lines.reduce((acc,line)=>{
    if(ids.has(line.id)){acc.amount+=line.line;acc.quantity+=line.qty}
    return acc;
  },{amount:0,quantity:0});
}
async function availability(p,cart,email='',now=new Date(),client=null){
  const status=await statusFor(p,now,client);
  if(status!=='active'){
    return {ok:false,reason:status==='upcoming'?'Esta promoción todavía no ha comenzado.':status==='expired'?'Esta promoción ya venció.':status==='exhausted'?'Esta promoción alcanzó su límite de usos.':'Esta promoción está desactivada.'};
  }
  const eligible=eligibleBase(p,cart);
  if(p.productIds.length&&!eligible.amount)return {ok:false,reason:'Este cupón no aplica a los productos del carrito.'};
  if(cart.subtotal<Math.round(p.minSubtotal*100))return {ok:false,reason:`La compra mínima para esta promoción es MX$${p.minSubtotal.toFixed(2)}.`};
  if(eligible.quantity<p.minQuantity)return {ok:false,reason:`Esta promoción requiere al menos ${p.minQuantity} producto${p.minQuantity===1?'':'s'} elegible${p.minQuantity===1?'':'s'}.`};
  if(p.usageLimit&&await usageCount(p.id,client)>=p.usageLimit)return {ok:false,reason:'Esta promoción alcanzó su límite de usos.'};
  if(p.perCustomerLimit&&email&&await customerUsageCount(p.id,email,client)>=p.perCustomerLimit)return {ok:false,reason:'Ya utilizaste este cupón el número máximo de veces permitido.'};
  return {ok:true,eligible};
}
function savingsFor(p,eligible,shippingCents){
  if(p.discountType==='free_shipping')return {discount:0,freeShipping:true,savings:shippingCents};
  let discount=0;
  if(p.discountType==='percentage')discount=Math.round(eligible.amount*(p.value/100));
  else if(p.discountType==='fixed')discount=Math.round(p.value*100);
  discount=Math.min(discount,eligible.amount);
  if(p.maxDiscount>0)discount=Math.min(discount,Math.round(p.maxDiscount*100));
  return {discount,freeShipping:false,savings:discount};
}
function snapshot(p){
  if(!p)return null;
  return {id:p.id,name:p.name,kind:p.kind,code:p.code,discountType:p.discountType,value:p.value};
}
async function evaluate({items=[],promoCode='',customerEmail='',shippingCents=0,now=new Date(),client=null}={}){
  const cart=cartInfo(items);
  const list=all();
  const code=codeValue(promoCode);
  let selected=null,selectedEffect=null,codeError='';

  if(code){
    const coupon=list.find(p=>p.kind==='coupon'&&p.code===code);
    if(!coupon)codeError='El código promocional no existe.';
    else{
      const check=await availability(coupon,cart,customerEmail,now,client);
      if(!check.ok)codeError=check.reason;
      else{selected=coupon;selectedEffect=savingsFor(coupon,check.eligible,shippingCents)}
    }
  }else{
    const automatic=list.filter(p=>p.kind==='automatic');
    for(const promo of automatic){
      const check=await availability(promo,cart,customerEmail,now,client);
      if(!check.ok)continue;
      const effect=savingsFor(promo,check.eligible,shippingCents);
      if(!selectedEffect||effect.savings>selectedEffect.savings){selected=promo;selectedEffect=effect}
    }
  }

  if(codeError)return {ok:false,error:codeError,subtotal:cart.subtotal,discount:0,shipping:shippingCents,total:cart.subtotal+shippingCents,promotion:null,code};
  const effect=selectedEffect||{discount:0,freeShipping:false,savings:0};
  const shipping=effect.freeShipping?0:shippingCents;
  return {
    ok:true,
    subtotal:cart.subtotal,
    discount:effect.discount,
    shipping,
    total:Math.max(0,cart.subtotal-effect.discount)+shipping,
    promotion:snapshot(selected),
    code
  };
}
async function recordUsage(promotion,email='',orderNumber='',client=null){
  if(!promotion?.id)return;
  const list=await usages(client);
  if(orderNumber&&list.some(u=>u.orderNumber===orderNumber&&u.promotionId===promotion.id))return;
  const row={
    promotionId:promotion.id,
    code:promotion.code||'',
    email:cleanText(email,180).toLowerCase(),
    orderNumber:cleanText(orderNumber,60),
    usedAt:new Date().toISOString()
  };
  await persistence.insertPromotionUsage(row,client);
}
module.exports={adminList,createPromotion,updatePromotion,deletePromotion,evaluate,recordUsage,statusFor};
