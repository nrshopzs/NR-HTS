const fs=require('fs');
const path=require('path');

const dataDir=path.join(__dirname,'data');
const file=path.join(dataDir,'bank-transfer.json');

const DEFAULT={
  enabled:false,
  bankName:'',
  accountHolder:'',
  clabe:'',
  accountNumber:'',
  cardNumber:'',
  paymentDeadlineHours:24,
  proofUploadEnabled:true,
  instructions:'Realiza la transferencia por el total exacto del pedido y usa tu número de pedido como referencia. Una vez realizado el pago, sube tu comprobante para que podamos validarlo.'
};

function ensure(){
  fs.mkdirSync(dataDir,{recursive:true});
  if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify(DEFAULT,null,2)+'\n','utf8');
}
function clean(value,max=300){return String(value??'').trim().slice(0,max)}
function digits(value,max=30){return clean(value,max).replace(/\D/g,'').slice(0,max)}
function int(value,min,max,fallback){const n=Number.parseInt(value,10);return Number.isInteger(n)?Math.min(max,Math.max(min,n)):fallback}
function sanitize(raw={}){
  const clabe=digits(raw.clabe,18);
  if(clabe&&clabe.length!==18)throw new Error('La CLABE debe contener exactamente 18 dígitos.');
  const next={
    enabled:!!raw.enabled,
    bankName:clean(raw.bankName,100),
    accountHolder:clean(raw.accountHolder,160),
    clabe,
    accountNumber:digits(raw.accountNumber,30),
    cardNumber:digits(raw.cardNumber,19),
    paymentDeadlineHours:int(raw.paymentDeadlineHours,1,168,24),
    proofUploadEnabled:raw.proofUploadEnabled!==false,
    instructions:clean(raw.instructions,900)||DEFAULT.instructions
  };
  if(next.enabled){
    if(!next.bankName)throw new Error('Indica el banco antes de activar las transferencias.');
    if(!next.accountHolder)throw new Error('Indica el titular de la cuenta antes de activar las transferencias.');
    if(!next.clabe&&!next.accountNumber&&!next.cardNumber)throw new Error('Agrega al menos una CLABE, número de cuenta o número de tarjeta antes de activar las transferencias.');
  }
  return next;
}
function getBankTransferSettings(){
  ensure();
  try{return sanitize({...DEFAULT,...JSON.parse(fs.readFileSync(file,'utf8'))})}
  catch{return {...DEFAULT}}
}
function saveBankTransferSettings(raw={}){
  const current=getBankTransferSettings();
  const next=sanitize({...current,...raw});
  ensure();
  fs.writeFileSync(file,JSON.stringify(next,null,2)+'\n','utf8');
  return next;
}
function isConfigured(settings=getBankTransferSettings()){
  return !!(settings.enabled&&settings.bankName&&settings.accountHolder&&(settings.clabe||settings.accountNumber||settings.cardNumber));
}
function publicAvailability(settings=getBankTransferSettings()){
  return {
    enabled:isConfigured(settings),
    paymentDeadlineHours:settings.paymentDeadlineHours,
    proofUploadEnabled:settings.proofUploadEnabled
  };
}
function publicDetails(settings=getBankTransferSettings()){
  return {
    bankName:settings.bankName,
    accountHolder:settings.accountHolder,
    clabe:settings.clabe,
    accountNumber:settings.accountNumber,
    cardNumber:settings.cardNumber,
    paymentDeadlineHours:settings.paymentDeadlineHours,
    proofUploadEnabled:settings.proofUploadEnabled,
    instructions:settings.instructions
  };
}

module.exports={DEFAULT,getBankTransferSettings,saveBankTransferSettings,isConfigured,publicAvailability,publicDetails};
