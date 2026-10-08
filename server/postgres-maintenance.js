const fs=require('fs');
const path=require('path');
const {Pool}=require('pg');
const {SCHEMA_SQL}=require('./database');

function text(v){return String(v??'')}
function sslConfig(){
  const mode=String(process.env.DATABASE_SSL||'').trim().toLowerCase();
  if(['1','true','yes','require'].includes(mode))return {rejectUnauthorized:true};
  if(['no-verify','insecure'].includes(mode))return {rejectUnauthorized:false};
  return false;
}
function connectionConfig(){
  const databaseUrl=String(process.env.DATABASE_URL||'').trim();
  if(databaseUrl)return {connectionString:databaseUrl};
  const host=String(process.env.DB_HOST||'').trim();
  const port=Number.parseInt(process.env.DB_PORT||'5432',10)||5432;
  const database=String(process.env.DB_NAME||'').trim();
  const user=String(process.env.DB_USERNAME||'').trim();
  const password=String(process.env.DB_PASSWORD||'');
  if(!(host&&database&&user&&password)){
    const present={
      DATABASE_URL:!!databaseUrl,
      DB_HOST:!!host,
      DB_PORT:!!String(process.env.DB_PORT||'').trim(),
      DB_NAME:!!database,
      DB_USERNAME:!!user,
      DB_PASSWORD:!!password
    };
    throw new Error(`Faltan credenciales PostgreSQL para la tarea de mantenimiento. Variables presentes: ${JSON.stringify(present)}`);
  }
  return {host,port,database,user,password};
}
function createPool(){
  return new Pool({
    ...connectionConfig(),
    ssl:sslConfig(),
    max:2,
    idleTimeoutMillis:10000,
    connectionTimeoutMillis:10000
  });
}
async function ensureSchema(client){await client.query(SCHEMA_SQL)}
async function count(client,table){
  const r=await client.query(`SELECT COUNT(*)::int AS n FROM ${table}`);
  return Number(r.rows[0]?.n)||0;
}
const TABLES=['nr_orders','nr_inventory','nr_customers','nr_customer_sessions','nr_payment_drafts','nr_promotion_usage'];
async function counts(client){
  const out={};
  for(const table of TABLES)out[table]=await count(client,table);
  return out;
}
async function check(){
  const pool=createPool();
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    await ensureSchema(client);
    const result=await counts(client);
    await client.query('COMMIT');
    return result;
  }catch(err){
    try{await client.query('ROLLBACK')}catch{}
    throw err;
  }finally{
    client.release();
    await pool.end();
  }
}
function readJson(name,fallback){
  const file=path.join(__dirname,'data',name);
  if(!fs.existsSync(file))return fallback;
  try{return JSON.parse(fs.readFileSync(file,'utf8'))}
  catch(err){throw new Error(`${name} no contiene JSON válido: ${err.message}`)}
}
function inventoryRows(inv={}){
  let n=0;
  for(const colors of Object.values(inv||{}))for(const sizes of Object.values(colors||{}))n+=Object.keys(sizes||{}).length;
  return n;
}
function orderParams(order={}){
  return [
    text(order.orderNumber),text(order.clientRequestId)||null,text(order.customerId)||null,text(order.customer?.email),
    text(order.paymentMethod),text(order.paymentStatus),text(order.status),order.createdAt||new Date().toISOString(),order.updatedAt||null,
    text(order.paymentIntentId)||null,text(order.paypalOrderId)||null,text(order.paypalCaptureId)||null,
    text(order.mercadoPagoOrderId)||null,text(order.mercadoPagoPaymentId)||null,JSON.stringify(order)
  ];
}
async function insertOrder(client,order){
  const p=orderParams(order);
  await client.query(`INSERT INTO nr_orders(
    order_number,client_request_id,customer_id,customer_email,payment_method,payment_status,status,created_at,updated_at,
    payment_intent_id,paypal_order_id,paypal_capture_id,mercado_pago_order_id,mercado_pago_payment_id,payload
  ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb)`,p);
}
async function insertInventory(client,inventory){
  for(const [productId,colors] of Object.entries(inventory||{})){
    for(const [color,sizes] of Object.entries(colors||{})){
      for(const [size,qtyRaw] of Object.entries(sizes||{})){
        const qty=Math.max(0,Number.parseInt(qtyRaw,10)||0);
        await client.query(`INSERT INTO nr_inventory(product_id,color,size,qty,updated_at) VALUES($1,$2,$3,$4,NOW())
          ON CONFLICT(product_id,color,size) DO UPDATE SET qty=EXCLUDED.qty,updated_at=NOW()`,[productId,color,size,qty]);
      }
    }
  }
}
async function insertCustomer(client,customer){
  await client.query('INSERT INTO nr_customers(id,email,created_at,updated_at,payload) VALUES($1,$2,$3,$4,$5::jsonb)',[
    customer.id,customer.email,customer.createdAt||new Date().toISOString(),customer.updatedAt||null,JSON.stringify(customer)
  ]);
}
async function insertSession(client,tokenHash,row){
  await client.query(`INSERT INTO nr_customer_sessions(token_hash,customer_id,created_at,expires_at) VALUES($1,$2,$3,$4)
    ON CONFLICT(token_hash) DO UPDATE SET customer_id=EXCLUDED.customer_id,created_at=EXCLUDED.created_at,expires_at=EXCLUDED.expires_at`,
    [tokenHash,row.customerId,row.createdAt,row.expiresAt]);
}
async function insertDraft(client,key,row){
  const updatedAt=row?.updatedAt||new Date().toISOString();
  await client.query(`INSERT INTO nr_payment_drafts(draft_key,updated_at,payload) VALUES($1,$2,$3::jsonb)
    ON CONFLICT(draft_key) DO UPDATE SET updated_at=EXCLUDED.updated_at,payload=EXCLUDED.payload`,[key,updatedAt,JSON.stringify(row)]);
}
async function insertUsage(client,row){
  await client.query(`INSERT INTO nr_promotion_usage(promotion_id,code,email,order_number,used_at,payload)
    VALUES($1,$2,$3,$4,$5,$6::jsonb) ON CONFLICT DO NOTHING`,[
      text(row.promotionId),text(row.code),text(row.email).toLowerCase(),text(row.orderNumber),row.usedAt||new Date().toISOString(),JSON.stringify(row)
    ]);
}
async function migrate({force=false}={}){
  const data={
    orders:readJson('orders.json',[]),
    inventory:readJson('inventory.json',{}),
    customers:readJson('customers.json',[]),
    sessions:readJson('customer-sessions.json',{}),
    drafts:readJson('payment-drafts.json',{}),
    usage:readJson('promotion-usage.json',[])
  };
  const expected={
    nr_orders:Array.isArray(data.orders)?data.orders.length:0,
    nr_inventory:inventoryRows(data.inventory),
    nr_customers:Array.isArray(data.customers)?data.customers.length:0,
    nr_customer_sessions:Object.keys(data.sessions||{}).length,
    nr_payment_drafts:Object.keys(data.drafts||{}).length,
    nr_promotion_usage:Array.isArray(data.usage)?data.usage.length:0
  };
  const pool=createPool();
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    await ensureSchema(client);
    const existing=await counts(client);
    const populated=Object.values(existing).some(n=>n>0);
    if(populated&&!force){
      const same=TABLES.every(t=>existing[t]===expected[t]);
      if(same){
        await client.query('ROLLBACK');
        return {status:'already-migrated',expected,counts:existing};
      }
      throw new Error(`La base de datos no está vacía y no coincide exactamente con los JSON. Conteos PostgreSQL=${JSON.stringify(existing)}; JSON=${JSON.stringify(expected)}. No se modificó nada.`);
    }
    if(force)await client.query('TRUNCATE nr_promotion_usage,nr_payment_drafts,nr_customer_sessions,nr_customers,nr_inventory,nr_orders RESTART IDENTITY');
    for(const order of Array.isArray(data.orders)?data.orders:[])await insertOrder(client,order);
    await insertInventory(client,data.inventory&&typeof data.inventory==='object'?data.inventory:{});
    for(const customer of Array.isArray(data.customers)?data.customers:[])await insertCustomer(client,customer);
    for(const [tokenHash,row] of Object.entries(data.sessions&&typeof data.sessions==='object'?data.sessions:{}))await insertSession(client,tokenHash,row);
    for(const [key,row] of Object.entries(data.drafts&&typeof data.drafts==='object'?data.drafts:{}))await insertDraft(client,key,row);
    for(const row of Array.isArray(data.usage)?data.usage:[])await insertUsage(client,row);
    const actual=await counts(client);
    for(const table of TABLES){
      if(actual[table]!==expected[table])throw new Error(`Validación de migración falló en ${table}: JSON=${expected[table]}, PostgreSQL=${actual[table]}`);
    }
    await client.query('COMMIT');
    return {status:'migrated',expected,counts:actual};
  }catch(err){
    try{await client.query('ROLLBACK')}catch{}
    throw err;
  }finally{
    client.release();
    await pool.end();
  }
}

module.exports={check,migrate};
