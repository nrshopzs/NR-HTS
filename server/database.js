const requestedBackend=String(process.env.DATA_BACKEND||'auto').trim().toLowerCase();
const databaseUrl=String(process.env.DATABASE_URL||'').trim();
// V127.43 — Wasmer entrega PostgreSQL como variables DB_* separadas en lugar
// de DATABASE_URL. Se aceptan ambas formas sin imprimir ni reconstruir secretos.
const wasmerDb={
  host:String(process.env.DB_HOST||'').trim(),
  port:Number.parseInt(process.env.DB_PORT||'5432',10)||5432,
  database:String(process.env.DB_NAME||'').trim(),
  user:String(process.env.DB_USERNAME||'').trim(),
  password:String(process.env.DB_PASSWORD||'')
};
const hasWasmerDb=!!(wasmerDb.host&&wasmerDb.database&&wasmerDb.user&&wasmerDb.password);
const postgresConnectionAvailable=!!databaseUrl||hasWasmerDb;
const postgresEnabled=requestedBackend==='postgres'||(requestedBackend==='auto'&&postgresConnectionAvailable);

if(requestedBackend==='postgres'&&!postgresConnectionAvailable){
  throw new Error('DATA_BACKEND=postgres requiere DATABASE_URL o las variables DB_HOST, DB_PORT, DB_NAME, DB_USERNAME y DB_PASSWORD.');
}
if(!['auto','json','postgres'].includes(requestedBackend)){
  throw new Error('DATA_BACKEND debe ser auto, json o postgres.');
}

function sslConfig(){
  const mode=String(process.env.DATABASE_SSL||'').trim().toLowerCase();
  if(['1','true','yes','require'].includes(mode))return {rejectUnauthorized:true};
  if(['no-verify','insecure'].includes(mode))return {rejectUnauthorized:false};
  return false;
}

let Pool=null;
if(postgresEnabled){({Pool}=require('pg'))}
const postgresBaseConfig=databaseUrl
  ? {connectionString:databaseUrl}
  : {host:wasmerDb.host,port:wasmerDb.port,database:wasmerDb.database,user:wasmerDb.user,password:wasmerDb.password};
const pool=postgresEnabled?new Pool({
  ...postgresBaseConfig,
  ssl:sslConfig(),
  max:Math.max(2,Math.min(20,Number.parseInt(process.env.DATABASE_POOL_MAX||'10',10)||10)),
  idleTimeoutMillis:30000,
  connectionTimeoutMillis:10000
}):null;

const SCHEMA_SQL=`
CREATE TABLE IF NOT EXISTS nr_orders (
  order_number TEXT PRIMARY KEY,
  client_request_id TEXT,
  customer_id TEXT,
  customer_email TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT '',
  payment_status TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  payment_intent_id TEXT,
  paypal_order_id TEXT,
  paypal_capture_id TEXT,
  mercado_pago_order_id TEXT,
  mercado_pago_payment_id TEXT,
  payload JSONB NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS nr_orders_client_request_uidx ON nr_orders(client_request_id) WHERE client_request_id IS NOT NULL AND client_request_id <> '';
CREATE UNIQUE INDEX IF NOT EXISTS nr_orders_stripe_uidx ON nr_orders(payment_intent_id) WHERE payment_intent_id IS NOT NULL AND payment_intent_id <> '';
CREATE UNIQUE INDEX IF NOT EXISTS nr_orders_paypal_order_uidx ON nr_orders(paypal_order_id) WHERE paypal_order_id IS NOT NULL AND paypal_order_id <> '';
CREATE UNIQUE INDEX IF NOT EXISTS nr_orders_paypal_capture_uidx ON nr_orders(paypal_capture_id) WHERE paypal_capture_id IS NOT NULL AND paypal_capture_id <> '';
CREATE UNIQUE INDEX IF NOT EXISTS nr_orders_mp_order_uidx ON nr_orders(mercado_pago_order_id) WHERE mercado_pago_order_id IS NOT NULL AND mercado_pago_order_id <> '';
CREATE UNIQUE INDEX IF NOT EXISTS nr_orders_mp_payment_uidx ON nr_orders(mercado_pago_payment_id) WHERE mercado_pago_payment_id IS NOT NULL AND mercado_pago_payment_id <> '';
CREATE INDEX IF NOT EXISTS nr_orders_customer_idx ON nr_orders(customer_id,created_at DESC);
CREATE INDEX IF NOT EXISTS nr_orders_email_idx ON nr_orders((LOWER(customer_email)),created_at DESC);
CREATE INDEX IF NOT EXISTS nr_orders_status_idx ON nr_orders(status,payment_status,created_at DESC);

CREATE TABLE IF NOT EXISTS nr_inventory (
  product_id TEXT NOT NULL,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(product_id,color,size)
);

CREATE TABLE IF NOT EXISTS nr_customers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  payload JSONB NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS nr_customers_email_uidx ON nr_customers((LOWER(email)));

CREATE TABLE IF NOT EXISTS nr_customer_sessions (
  token_hash TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS nr_customer_sessions_customer_idx ON nr_customer_sessions(customer_id);
CREATE INDEX IF NOT EXISTS nr_customer_sessions_expiry_idx ON nr_customer_sessions(expires_at);

CREATE TABLE IF NOT EXISTS nr_payment_drafts (
  draft_key TEXT PRIMARY KEY,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS nr_promotion_usage (
  id BIGSERIAL PRIMARY KEY,
  promotion_id TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  order_number TEXT NOT NULL DEFAULT '',
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS nr_promotion_usage_order_uidx ON nr_promotion_usage(promotion_id,order_number) WHERE order_number <> '';
CREATE INDEX IF NOT EXISTS nr_promotion_usage_promo_idx ON nr_promotion_usage(promotion_id,used_at DESC);
CREATE INDEX IF NOT EXISTS nr_promotion_usage_customer_idx ON nr_promotion_usage(promotion_id,(LOWER(email)),used_at DESC);
`;

function usingPostgres(){return postgresEnabled}
function backendName(){return postgresEnabled?'postgres':'json'}
async function initDatabase(){
  if(!pool)return {backend:'json'};
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    await client.query(SCHEMA_SQL);
    await client.query('COMMIT');
    return {backend:'postgres'};
  }catch(err){
    try{await client.query('ROLLBACK')}catch{}
    throw err;
  }finally{client.release()}
}
async function query(text,params=[],client=null){
  if(!pool)throw new Error('PostgreSQL no está habilitado.');
  return (client||pool).query(text,params);
}
async function withTransaction(fn){
  if(!pool)return fn(null);
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const value=await fn(client);
    await client.query('COMMIT');
    return value;
  }catch(err){
    try{await client.query('ROLLBACK')}catch{}
    throw err;
  }finally{client.release()}
}
async function closeDatabase(){if(pool)await pool.end()}
function isUniqueViolation(err){return err?.code==='23505'}

module.exports={usingPostgres,backendName,initDatabase,query,withTransaction,closeDatabase,isUniqueViolation,SCHEMA_SQL};
