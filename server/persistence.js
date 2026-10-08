const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const db=require('./database');

const dataDir=path.join(__dirname,'data');
const files={
  orders:path.join(dataDir,'orders.json'),
  inventory:path.join(dataDir,'inventory.json'),
  customers:path.join(dataDir,'customers.json'),
  sessions:path.join(dataDir,'customer-sessions.json'),
  drafts:path.join(dataDir,'payment-drafts.json'),
  promotionUsage:path.join(dataDir,'promotion-usage.json')
};

function ensureFile(file,fallback){
  fs.mkdirSync(dataDir,{recursive:true});
  if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify(fallback,null,2)+'\n','utf8');
}
function readJson(file,fallback){ensureFile(file,fallback);try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return fallback}}
function writeJsonAtomic(file,data){
  ensureFile(file,Array.isArray(data)?[]:{});
  const tmp=`${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmp,JSON.stringify(data,null,2)+'\n','utf8');
  fs.renameSync(tmp,file);
}
function text(v){return String(v??'')}
function orderParams(order={}){
  return [
    text(order.orderNumber),text(order.clientRequestId)||null,text(order.customerId)||null,text(order.customer?.email),
    text(order.paymentMethod),text(order.paymentStatus),text(order.status),order.createdAt||new Date().toISOString(),order.updatedAt||null,
    text(order.paymentIntentId)||null,text(order.paypalOrderId)||null,text(order.paypalCaptureId)||null,
    text(order.mercadoPagoOrderId)||null,text(order.mercadoPagoPaymentId)||null,JSON.stringify(order)
  ];
}
async function getOrders(client=null,{forUpdate=false}={}){
  if(!db.usingPostgres()){
    const rows=readJson(files.orders,[]);return Array.isArray(rows)?rows:[];
  }
  const lock=forUpdate&&client?' FOR UPDATE':'';
  const result=await db.query(`SELECT payload FROM nr_orders ORDER BY created_at ASC, order_number ASC${lock}`,[],client);
  return result.rows.map(r=>r.payload);
}
async function findOrderByColumn(column,value,client=null,{forUpdate=false}={}){
  if(!value)return null;
  const allowed=new Set(['order_number','client_request_id','payment_intent_id','paypal_order_id','mercado_pago_order_id','mercado_pago_payment_id']);
  if(!allowed.has(column))throw new Error('Columna de pedido no permitida.');
  if(!db.usingPostgres()){
    const map={order_number:'orderNumber',client_request_id:'clientRequestId',payment_intent_id:'paymentIntentId',paypal_order_id:'paypalOrderId',mercado_pago_order_id:'mercadoPagoOrderId',mercado_pago_payment_id:'mercadoPagoPaymentId'};
    return (await getOrders()).find(o=>text(o?.[map[column]])===text(value))||null;
  }
  const lock=forUpdate&&client?' FOR UPDATE':'';
  const result=await db.query(`SELECT payload FROM nr_orders WHERE ${column}=$1 LIMIT 1${lock}`,[text(value)],client);
  return result.rows[0]?.payload||null;
}
async function insertOrder(order,client=null){
  if(!db.usingPostgres()){
    const orders=await getOrders();orders.push(order);writeJsonAtomic(files.orders,orders);return order;
  }
  const p=orderParams(order);
  await db.query(`INSERT INTO nr_orders(
    order_number,client_request_id,customer_id,customer_email,payment_method,payment_status,status,created_at,updated_at,
    payment_intent_id,paypal_order_id,paypal_capture_id,mercado_pago_order_id,mercado_pago_payment_id,payload
  ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb)`,p,client);
  return order;
}
async function updateOrder(order,client=null){
  if(!db.usingPostgres()){
    const orders=await getOrders();const i=orders.findIndex(o=>text(o.orderNumber)===text(order.orderNumber));
    if(i<0)throw new Error('Pedido no encontrado.');orders[i]=order;writeJsonAtomic(files.orders,orders);return order;
  }
  const p=orderParams(order);
  const result=await db.query(`UPDATE nr_orders SET
    client_request_id=$2,customer_id=$3,customer_email=$4,payment_method=$5,payment_status=$6,status=$7,created_at=$8,updated_at=$9,
    payment_intent_id=$10,paypal_order_id=$11,paypal_capture_id=$12,mercado_pago_order_id=$13,mercado_pago_payment_id=$14,payload=$15::jsonb
    WHERE order_number=$1`,p,client);
  if(!result.rowCount)throw new Error('Pedido no encontrado.');
  return order;
}

async function getInventory(client=null,{forUpdate=false}={}){
  if(!db.usingPostgres()){
    const inv=readJson(files.inventory,{});return inv&&typeof inv==='object'&&!Array.isArray(inv)?inv:{};
  }
  const lock=forUpdate&&client?' FOR UPDATE':'';
  const result=await db.query(`SELECT product_id,color,size,qty FROM nr_inventory ORDER BY product_id,color,size${lock}`,[],client);
  const inventory={};
  for(const r of result.rows){
    inventory[r.product_id]??={};inventory[r.product_id][r.color]??={};inventory[r.product_id][r.color][r.size]=Number(r.qty)||0;
  }
  return inventory;
}
async function saveInventory(inventory,client=null){
  if(!db.usingPostgres()){writeJsonAtomic(files.inventory,inventory);return inventory}
  for(const [productId,colors] of Object.entries(inventory||{}))for(const [color,sizes] of Object.entries(colors||{}))for(const [size,qtyRaw] of Object.entries(sizes||{})){
    const qty=Math.max(0,Number.parseInt(qtyRaw,10)||0);
    await db.query(`INSERT INTO nr_inventory(product_id,color,size,qty,updated_at) VALUES($1,$2,$3,$4,NOW())
      ON CONFLICT(product_id,color,size) DO UPDATE SET qty=EXCLUDED.qty,updated_at=NOW()`,[productId,color,size,qty],client);
  }
  return inventory;
}
async function replaceProductInventory(productId,variants,client=null){
  if(!db.usingPostgres()){
    const inventory=await getInventory();inventory[productId]=variants;writeJsonAtomic(files.inventory,inventory);return inventory;
  }
  await db.query('DELETE FROM nr_inventory WHERE product_id=$1',[productId],client);
  await saveInventory({[productId]:variants},client);
  return getInventory(client);
}

async function getDraft(key,client=null){
  if(!db.usingPostgres())return readJson(files.drafts,{})[key]||null;
  const r=await db.query('SELECT payload FROM nr_payment_drafts WHERE draft_key=$1',[key],client);return r.rows[0]?.payload||null;
}
async function saveDraft(key,data,client=null){
  const now=new Date().toISOString();
  if(!db.usingPostgres()){
    const all=readJson(files.drafts,{});all[key]={...(all[key]||{}),...data,updatedAt:now};writeJsonAtomic(files.drafts,all);return all[key];
  }
  const current=await getDraft(key,client);const payload={...(current||{}),...data,updatedAt:now};
  await db.query(`INSERT INTO nr_payment_drafts(draft_key,updated_at,payload) VALUES($1,NOW(),$2::jsonb)
    ON CONFLICT(draft_key) DO UPDATE SET updated_at=NOW(),payload=EXCLUDED.payload`,[key,JSON.stringify(payload)],client);
  return payload;
}

async function getCustomers(client=null){
  if(!db.usingPostgres()){
    const rows=readJson(files.customers,[]);return Array.isArray(rows)?rows:[];
  }
  const r=await db.query('SELECT payload FROM nr_customers ORDER BY created_at ASC,id ASC',[],client);return r.rows.map(x=>x.payload);
}
async function getCustomerById(id,client=null){
  if(!db.usingPostgres())return (await getCustomers()).find(c=>text(c.id)===text(id))||null;
  const r=await db.query('SELECT payload FROM nr_customers WHERE id=$1 LIMIT 1',[text(id)],client);return r.rows[0]?.payload||null;
}
async function getCustomerByEmail(email,client=null){
  const normalized=text(email).trim().toLowerCase();
  if(!db.usingPostgres())return (await getCustomers()).find(c=>text(c.email).trim().toLowerCase()===normalized)||null;
  const r=await db.query('SELECT payload FROM nr_customers WHERE LOWER(email)=LOWER($1) LIMIT 1',[normalized],client);return r.rows[0]?.payload||null;
}
async function insertCustomer(customer,client=null){
  if(!db.usingPostgres()){
    const rows=await getCustomers();rows.push(customer);writeJsonAtomic(files.customers,rows);return customer;
  }
  await db.query('INSERT INTO nr_customers(id,email,created_at,updated_at,payload) VALUES($1,$2,$3,$4,$5::jsonb)',[
    customer.id,customer.email,customer.createdAt||new Date().toISOString(),customer.updatedAt||null,JSON.stringify(customer)
  ],client);return customer;
}
async function updateCustomer(customer,client=null){
  if(!db.usingPostgres()){
    const rows=await getCustomers();const i=rows.findIndex(c=>text(c.id)===text(customer.id));if(i<0)throw new Error('Cuenta no encontrada.');rows[i]=customer;writeJsonAtomic(files.customers,rows);return customer;
  }
  const r=await db.query('UPDATE nr_customers SET email=$2,updated_at=$3,payload=$4::jsonb WHERE id=$1',[customer.id,customer.email,customer.updatedAt||new Date().toISOString(),JSON.stringify(customer)],client);
  if(!r.rowCount)throw new Error('Cuenta no encontrada.');return customer;
}

async function pruneSessions(client=null){
  const now=Date.now();
  if(!db.usingPostgres()){
    const sessions=readJson(files.sessions,{});let changed=false;
    for(const [key,s] of Object.entries(sessions||{})){if(!s||Number(s.expiresAt||0)<=now){delete sessions[key];changed=true}}
    if(changed)writeJsonAtomic(files.sessions,sessions);return;
  }
  await db.query('DELETE FROM nr_customer_sessions WHERE expires_at <= $1',[now],client);
}
async function putSession(tokenHash,row,client=null){
  if(!db.usingPostgres()){
    const sessions=readJson(files.sessions,{});sessions[tokenHash]=row;writeJsonAtomic(files.sessions,sessions);return row;
  }
  await db.query(`INSERT INTO nr_customer_sessions(token_hash,customer_id,created_at,expires_at) VALUES($1,$2,$3,$4)
    ON CONFLICT(token_hash) DO UPDATE SET customer_id=EXCLUDED.customer_id,created_at=EXCLUDED.created_at,expires_at=EXCLUDED.expires_at`,[tokenHash,row.customerId,row.createdAt,row.expiresAt],client);return row;
}
async function getSession(tokenHash,client=null){
  await pruneSessions(client);
  if(!db.usingPostgres())return readJson(files.sessions,{})[tokenHash]||null;
  const r=await db.query('SELECT customer_id,created_at,expires_at FROM nr_customer_sessions WHERE token_hash=$1',[tokenHash],client);
  const s=r.rows[0];return s?{customerId:s.customer_id,createdAt:Number(s.created_at),expiresAt:Number(s.expires_at)}:null;
}
async function deleteSession(tokenHash,client=null){
  if(!db.usingPostgres()){
    const sessions=readJson(files.sessions,{});delete sessions[tokenHash];writeJsonAtomic(files.sessions,sessions);return;
  }
  await db.query('DELETE FROM nr_customer_sessions WHERE token_hash=$1',[tokenHash],client);
}
async function deleteSessionsForCustomer(customerId,client=null){
  if(!db.usingPostgres()){
    const sessions=readJson(files.sessions,{});for(const [key,s] of Object.entries(sessions)){if(s?.customerId===customerId)delete sessions[key]}writeJsonAtomic(files.sessions,sessions);return;
  }
  await db.query('DELETE FROM nr_customer_sessions WHERE customer_id=$1',[customerId],client);
}

async function getPromotionUsage(client=null){
  if(!db.usingPostgres()){
    const rows=readJson(files.promotionUsage,[]);return Array.isArray(rows)?rows:[];
  }
  const r=await db.query('SELECT payload FROM nr_promotion_usage ORDER BY id ASC',[],client);return r.rows.map(x=>x.payload);
}
async function insertPromotionUsage(row,client=null){
  if(!db.usingPostgres()){
    const rows=await getPromotionUsage();rows.push(row);writeJsonAtomic(files.promotionUsage,rows);return row;
  }
  await db.query(`INSERT INTO nr_promotion_usage(promotion_id,code,email,order_number,used_at,payload)
    VALUES($1,$2,$3,$4,$5,$6::jsonb) ON CONFLICT DO NOTHING`,[
      text(row.promotionId),text(row.code),text(row.email).toLowerCase(),text(row.orderNumber),row.usedAt||new Date().toISOString(),JSON.stringify(row)
    ],client);return row;
}

module.exports={files,readJson,writeJsonAtomic,getOrders,findOrderByColumn,insertOrder,updateOrder,getInventory,saveInventory,replaceProductInventory,getDraft,saveDraft,getCustomers,getCustomerById,getCustomerByEmail,insertCustomer,updateCustomer,pruneSessions,putSession,getSession,deleteSession,deleteSessionsForCustomer,getPromotionUsage,insertPromotionUsage};
