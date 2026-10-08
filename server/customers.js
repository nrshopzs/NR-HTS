const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const persistence=require('./persistence');
const db=require('./database');

const dataDir=path.join(__dirname,'data');
const actionsFile=path.join(dataDir,'customer-action-tokens.json');

function ensureActions(){fs.mkdirSync(dataDir,{recursive:true});if(!fs.existsSync(actionsFile))fs.writeFileSync(actionsFile,'{}\n','utf8')}
function readActions(){ensureActions();try{return JSON.parse(fs.readFileSync(actionsFile,'utf8'))}catch{return {}}}
function writeActions(data){
  ensureActions();
  const tmp=`${actionsFile}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmp,JSON.stringify(data,null,2)+'\n','utf8');fs.renameSync(tmp,actionsFile);
}
function cleanText(value,max=180){return String(value??'').trim().slice(0,max)}
function normalizeEmail(value){return cleanText(value,254).toLowerCase()}
function validEmail(email){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
function validatePassword(password){
  const text=String(password||'');
  if(text.length<8||text.length>20)throw new Error('La contraseña debe tener de 8 a 20 caracteres.');
  if(!(/[A-ZÁÉÍÓÚÜÑ]/.test(text)&&/[a-záéíóúüñ]/.test(text)))throw new Error('La contraseña debe combinar mayúsculas con minúsculas.');
  if(!(/[0-9]|[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s]/.test(text)))throw new Error('La contraseña debe incluir por lo menos un número o símbolo.');
  return text;
}
function hashPassword(password){const salt=crypto.randomBytes(16);const hash=crypto.scryptSync(String(password),salt,64);return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`}
function verifyPassword(password,stored=''){
  const [kind,saltHex,hashHex]=String(stored).split('$');
  if(kind!=='scrypt'||!saltHex||!hashHex)return false;
  try{const expected=Buffer.from(hashHex,'hex');const actual=crypto.scryptSync(String(password),Buffer.from(saltHex,'hex'),expected.length);return expected.length===actual.length&&crypto.timingSafeEqual(expected,actual)}catch{return false}
}
function sanitizeAddress(raw={}){return {calle:cleanText(raw.calle,240),colonia:cleanText(raw.colonia,180),cp:cleanText(raw.cp,20),ciudad:cleanText(raw.ciudad,180),estado:cleanText(raw.estado,180),pais:cleanText(raw.pais,100)||'México'}}
function isEmailVerified(customer={}){return customer.emailVerifiedAt===undefined?true:!!customer.emailVerifiedAt}
function normalizeFavoriteIds(value){return [...new Set((Array.isArray(value)?value:[]).map(v=>cleanText(v,120)).filter(Boolean))].slice(0,100)}
function publicCustomer(customer={}){return {id:customer.id,nombre:customer.nombre||'',apellidos:customer.apellidos||'',email:customer.email||'',telefono:customer.telefono||'',emailVerified:isEmailVerified(customer),emailVerifiedAt:customer.emailVerifiedAt||'',favoriteCount:normalizeFavoriteIds(customer.favorites).length,address:sanitizeAddress(customer.address||{}),createdAt:customer.createdAt||''}}

async function createCustomer(data={}){
  const nombre=cleanText(data.nombre,100),apellidos=cleanText(data.apellidos,140),email=normalizeEmail(data.email),password=validatePassword(data.password);
  if(!nombre)throw new Error('Ingresa tu nombre.');
  if(!email||!validEmail(email))throw new Error('Ingresa un correo electrónico válido.');
  if(await persistence.getCustomerByEmail(email))throw new Error('Ya existe una cuenta con ese correo.');
  const now=new Date().toISOString();
  const customer={id:'CUS-'+crypto.randomBytes(10).toString('hex').toUpperCase(),nombre,apellidos,email,telefono:cleanText(data.telefono,60),passwordHash:hashPassword(password),emailVerifiedAt:now,address:sanitizeAddress({pais:'México'}),createdAt:now,updatedAt:now};
  try{await persistence.insertCustomer(customer)}catch(err){if(db.isUniqueViolation(err))throw new Error('Ya existe una cuenta con ese correo.');throw err}
  return publicCustomer(customer);
}
async function authenticateCustomer(email,password){const customer=await persistence.getCustomerByEmail(normalizeEmail(email));if(!customer||!verifyPassword(password,customer.passwordHash))return null;return publicCustomer(customer)}
async function getCustomerById(id){const customer=await persistence.getCustomerById(id);return customer?publicCustomer(customer):null}
async function getCustomerByEmail(email){const customer=await persistence.getCustomerByEmail(normalizeEmail(email));return customer?publicCustomer(customer):null}
async function verifyCustomerPassword(id,password){const customer=await persistence.getCustomerById(id);return !!(customer&&verifyPassword(password,customer.passwordHash))}
async function updateCustomerProfile(id,data={}){const customer=await persistence.getCustomerById(id);if(!customer)throw new Error('Cuenta no encontrada.');const nombre=cleanText(data.nombre,100);if(!nombre)throw new Error('El nombre es obligatorio.');customer.nombre=nombre;customer.apellidos=cleanText(data.apellidos,140);customer.telefono=cleanText(data.telefono,60);customer.updatedAt=new Date().toISOString();await persistence.updateCustomer(customer);return publicCustomer(customer)}
async function updateCustomerAddress(id,data={}){const customer=await persistence.getCustomerById(id);if(!customer)throw new Error('Cuenta no encontrada.');customer.address=sanitizeAddress(data);customer.updatedAt=new Date().toISOString();await persistence.updateCustomer(customer);return publicCustomer(customer)}
async function markCustomerEmailVerified(id){const customer=await persistence.getCustomerById(id);if(!customer)throw new Error('Cuenta no encontrada.');if(!isEmailVerified(customer))customer.emailVerifiedAt=new Date().toISOString();customer.updatedAt=new Date().toISOString();await persistence.updateCustomer(customer);return publicCustomer(customer)}
async function setCustomerPassword(id,newPassword,{verifyEmail=false}={}){const customer=await persistence.getCustomerById(id);if(!customer)throw new Error('Cuenta no encontrada.');validatePassword(newPassword);customer.passwordHash=hashPassword(newPassword);customer.passwordChangedAt=new Date().toISOString();if(verifyEmail&&!isEmailVerified(customer))customer.emailVerifiedAt=new Date().toISOString();customer.updatedAt=new Date().toISOString();await persistence.updateCustomer(customer);return publicCustomer(customer)}
async function changeCustomerPassword(id,currentPassword,newPassword){const customer=await persistence.getCustomerById(id);if(!customer)throw new Error('Cuenta no encontrada.');if(!verifyPassword(currentPassword,customer.passwordHash))throw new Error('La contraseña actual no es correcta.');validatePassword(newPassword);if(verifyPassword(newPassword,customer.passwordHash))throw new Error('La nueva contraseña debe ser diferente de la actual.');customer.passwordHash=hashPassword(newPassword);customer.passwordChangedAt=new Date().toISOString();customer.updatedAt=new Date().toISOString();await persistence.updateCustomer(customer);return publicCustomer(customer)}
async function changeCustomerEmail(id,newEmail){
  const customer=await persistence.getCustomerById(id);if(!customer)throw new Error('Cuenta no encontrada.');
  const email=normalizeEmail(newEmail);if(!email||!validEmail(email))throw new Error('Ingresa un correo electrónico válido.');
  if(normalizeEmail(customer.email)===email)throw new Error('Ese correo ya es el correo actual de tu cuenta.');
  const existing=await persistence.getCustomerByEmail(email);if(existing&&existing.id!==id)throw new Error('Ese correo ya está asociado a otra cuenta.');
  const oldEmail=customer.email;customer.email=email;customer.emailVerifiedAt=new Date().toISOString();customer.updatedAt=new Date().toISOString();
  try{await persistence.updateCustomer(customer)}catch(err){if(db.isUniqueViolation(err))throw new Error('Ese correo ya está asociado a otra cuenta.');throw err}
  return {customer:publicCustomer(customer),oldEmail};
}
async function emailAvailable(email,excludeId=''){const normalized=normalizeEmail(email);if(!normalized||!validEmail(normalized))return false;const c=await persistence.getCustomerByEmail(normalized);return !c||c.id===excludeId}
async function getCustomerFavorites(id){const customer=await persistence.getCustomerById(id);if(!customer)throw new Error('Cuenta no encontrada.');return normalizeFavoriteIds(customer.favorites)}
async function addCustomerFavorite(id,productId){const customer=await persistence.getCustomerById(id);if(!customer)throw new Error('Cuenta no encontrada.');const favoriteId=cleanText(productId,120);if(!favoriteId)throw new Error('Producto inválido.');const favorites=normalizeFavoriteIds(customer.favorites);if(!favorites.includes(favoriteId))favorites.unshift(favoriteId);customer.favorites=favorites.slice(0,100);customer.updatedAt=new Date().toISOString();await persistence.updateCustomer(customer);return normalizeFavoriteIds(customer.favorites)}
async function removeCustomerFavorite(id,productId){const customer=await persistence.getCustomerById(id);if(!customer)throw new Error('Cuenta no encontrada.');const favoriteId=cleanText(productId,120);customer.favorites=normalizeFavoriteIds(customer.favorites).filter(value=>value!==favoriteId);customer.updatedAt=new Date().toISOString();await persistence.updateCustomer(customer);return normalizeFavoriteIds(customer.favorites)}

function tokenHash(token){return crypto.createHash('sha256').update(String(token||'')).digest('hex')}
async function createCustomerSession(customerId){await persistence.pruneSessions();const token=crypto.randomBytes(32).toString('base64url');await persistence.putSession(tokenHash(token),{customerId,createdAt:Date.now(),expiresAt:Date.now()+30*24*60*60*1000});return token}
async function getCustomerFromSession(token){if(!token)return null;const key=tokenHash(token),session=await persistence.getSession(key);if(!session)return null;const customer=await getCustomerById(session.customerId);if(!customer){await persistence.deleteSession(key);return null}return customer}
async function destroyCustomerSession(token){if(!token)return;await persistence.deleteSession(tokenHash(token))}
async function destroyCustomerSessionsByCustomerId(customerId){await persistence.deleteSessionsForCustomer(customerId)}

function pruneActions(actions){const now=Date.now();for(const [key,a] of Object.entries(actions||{})){if(!a||Number(a.expiresAt||0)<=now)delete actions[key]}}
function issueCustomerActionToken(type,customerId,extra={},ttlMs=60*60*1000){const actions=readActions();pruneActions(actions);for(const [key,a] of Object.entries(actions)){if(a?.type===type&&a?.customerId===customerId)delete actions[key]}const token=crypto.randomBytes(32).toString('base64url');actions[tokenHash(token)]={type:cleanText(type,60),customerId,extra:extra&&typeof extra==='object'?extra:{},createdAt:Date.now(),expiresAt:Date.now()+Math.max(5*60*1000,Number(ttlMs)||60*60*1000)};writeActions(actions);return token}
function getCustomerActionToken(token,type=''){if(!token)return null;const actions=readActions();pruneActions(actions);const key=tokenHash(token),action=actions[key];writeActions(actions);if(!action)return null;if(type&&action.type!==type)return null;return {...action,key}}
function consumeCustomerActionToken(token,type=''){const actions=readActions();pruneActions(actions);const key=tokenHash(token),action=actions[key];if(!action||(type&&action.type!==type)){writeActions(actions);return null}delete actions[key];writeActions(actions);return action}
function revokeCustomerActionTokens(customerId,type=''){const actions=readActions();pruneActions(actions);for(const [key,a] of Object.entries(actions)){if(a?.customerId===customerId&&(!type||a.type===type))delete actions[key]}writeActions(actions)}

module.exports={createCustomer,authenticateCustomer,getCustomerById,getCustomerByEmail,verifyCustomerPassword,updateCustomerProfile,updateCustomerAddress,markCustomerEmailVerified,setCustomerPassword,changeCustomerPassword,changeCustomerEmail,emailAvailable,getCustomerFavorites,addCustomerFavorite,removeCustomerFavorite,createCustomerSession,getCustomerFromSession,destroyCustomerSession,destroyCustomerSessionsByCustomerId,issueCustomerActionToken,getCustomerActionToken,consumeCustomerActionToken,revokeCustomerActionTokens,publicCustomer,validatePassword,normalizeEmail};
