const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const dataDir=path.join(__dirname,'data');
const file=path.join(dataDir,'collaborations-access.json');
fs.mkdirSync(dataDir,{recursive:true});

function hashPassword(password){
  const salt=crypto.randomBytes(16).toString('hex');
  const hash=crypto.scryptSync(String(password),salt,64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}
function verifyHash(password,stored){
  const parts=String(stored||'').split('$');
  if(parts.length!==3||parts[0]!=='scrypt')return false;
  try{
    const actual=crypto.scryptSync(String(password),parts[1],64);
    const expected=Buffer.from(parts[2],'hex');
    return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);
  }catch{return false}
}
function seed(){
  const envPassword=String(process.env.COLLABORATIONS_PASSWORD||'');
  return {
    version:1,
    enabled:!!envPassword,
    passwordHash:envPassword?hashPassword(envPassword):'',
    updatedAt:new Date().toISOString()
  };
}
function normalize(raw={}){
  return {
    version:1,
    enabled:!!raw.enabled,
    passwordHash:String(raw.passwordHash||''),
    updatedAt:String(raw.updatedAt||new Date().toISOString())
  };
}
function write(settings){
  fs.writeFileSync(file,JSON.stringify(normalize(settings),null,2),'utf8');
}
function load(){
  if(!fs.existsSync(file)){
    const initial=seed();
    write(initial);
    return initial;
  }
  try{return normalize(JSON.parse(fs.readFileSync(file,'utf8')))}
  catch{
    const fallback=seed();
    write(fallback);
    return fallback;
  }
}
function status(){
  const current=load();
  return {enabled:current.enabled,passwordConfigured:!!current.passwordHash,updatedAt:current.updatedAt};
}
function isEnabled(){return load().enabled}
function verify(password){
  const current=load();
  return !!current.passwordHash&&verifyHash(password,current.passwordHash);
}
function save(input={}){
  const current=load();
  const next={...current};
  if(Object.prototype.hasOwnProperty.call(input,'password')){
    const password=String(input.password||'');
    if(password){
      if(password.length<6)throw new Error('La contraseña debe tener al menos 6 caracteres.');
      next.passwordHash=hashPassword(password);
    }
  }
  if(Object.prototype.hasOwnProperty.call(input,'enabled'))next.enabled=!!input.enabled;
  if(next.enabled&&!next.passwordHash)throw new Error('Configura una contraseña antes de proteger la página.');
  next.updatedAt=new Date().toISOString();
  write(next);
  return status();
}

module.exports={status,isEnabled,verify,save};
