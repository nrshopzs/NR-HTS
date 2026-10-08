const fs=require('fs');
const path=require('path');

const dataDir=path.join(__dirname,'data');
const file=path.join(dataDir,'local-delivery.json');

const DEFAULT={
  enabled:true,
  city:'Tlapa de Comonfort',
  state:'Guerrero',
  country:'México',
  postalCodes:['41300'],
  fee:0,
  cashOnDelivery:true,
  label:'Entrega local en Tlapa de Comonfort'
};

function ensure(){
  fs.mkdirSync(dataDir,{recursive:true});
  if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify(DEFAULT,null,2)+'\n','utf8');
}
function cleanText(value,max=160){return String(value??'').trim().slice(0,max)}
function normalizePlace(value){
  return cleanText(value,180)
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[.,]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function normalizePostal(value){return cleanText(value,20).replace(/\D/g,'').slice(0,5)}
function placeMatches(input,target){
  const a=normalizePlace(input),b=normalizePlace(target);
  if(!a||!b)return false;
  if(a===b)return true;
  // Acepta "Tlapa" como forma corta de "Tlapa de Comonfort".
  if(Math.min(a.length,b.length)>=5&&(a.startsWith(b)||b.startsWith(a)))return true;
  return false;
}
function sanitize(raw={}){
  const postalRaw=Array.isArray(raw.postalCodes)?raw.postalCodes:String(raw.postalCodes??'').split(',');
  const postalCodes=[...new Set(postalRaw.map(normalizePostal).filter(Boolean))].slice(0,40);
  const feeNumber=Number(raw.fee);
  return {
    enabled:raw.enabled!==false,
    city:cleanText(raw.city,120)||DEFAULT.city,
    state:cleanText(raw.state,120)||DEFAULT.state,
    country:cleanText(raw.country,120)||DEFAULT.country,
    postalCodes,
    fee:Number.isFinite(feeNumber)?Math.min(5000,Math.max(0,Math.round(feeNumber*100)/100)):0,
    cashOnDelivery:raw.cashOnDelivery!==false,
    label:cleanText(raw.label,180)||DEFAULT.label
  };
}
function getLocalDeliverySettings(){
  ensure();
  try{return sanitize(JSON.parse(fs.readFileSync(file,'utf8')))}
  catch{return sanitize(DEFAULT)}
}
function saveLocalDeliverySettings(raw={}){
  const next=sanitize(raw);
  ensure();
  fs.writeFileSync(file,JSON.stringify(next,null,2)+'\n','utf8');
  return next;
}
function isEligibleAddress(address={},settings=getLocalDeliverySettings()){
  if(!settings.enabled)return false;
  if(!placeMatches(address.ciudad,settings.city))return false;
  if(!placeMatches(address.estado,settings.state))return false;
  if(!placeMatches(address.pais||'México',settings.country))return false;
  if(settings.postalCodes.length){
    const cp=normalizePostal(address.cp);
    if(!cp||!settings.postalCodes.includes(cp))return false;
  }
  return true;
}
function publicSettings(settings=getLocalDeliverySettings()){
  return {
    enabled:settings.enabled,
    city:settings.city,
    state:settings.state,
    country:settings.country,
    postalCodes:settings.postalCodes,
    fee:settings.fee,
    cashOnDelivery:settings.cashOnDelivery,
    label:settings.label
  };
}
module.exports={DEFAULT,getLocalDeliverySettings,saveLocalDeliverySettings,isEligibleAddress,publicSettings,normalizePlace,normalizePostal};
