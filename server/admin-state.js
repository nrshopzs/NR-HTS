const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const db=require('./database');

// V127.49 — espejo persistente de los archivos que todavía usa el panel.
// PostgreSQL conserva configuraciones y recursos subidos entre reinicios,
// cambios de instancia y redeploys de Wasmer. Los archivos grandes se guardan
// por bloques para no cargarlos completos en memoria.
const projectRoot=path.join(__dirname,'..');
const publicRoot=fs.existsSync(path.join(projectRoot,'public'))?path.join(projectRoot,'public'):projectRoot;
const INLINE_LIMIT=8*1024*1024;
const CHUNK_SIZE=4*1024*1024;
const REFRESH_INTERVAL_MS=5000;

const CONFIG_FILES=[
  'server/data/homepage.json',
  'server/data/site-texts.json',
  'server/data/products.json',
  'server/data/promotions.json',
  'server/data/local-delivery.json',
  'server/data/bank-transfer.json',
  'server/data/email-templates.json',
  'server/data/size-guide.json',
  'server/data/maintenance-mode.json',
  'server/data/collaborations-access.json',
  'server/data/email-log.json',
  'server/data/manual-email-log.json',
  'server/data/customer-action-tokens.json'
];
const MANAGED_DIRS=[
  'server/data/transfer-proofs',
  path.relative(projectRoot,path.join(publicRoot,'assets','productos','uploads')).replace(/\\/g,'/'),
  path.relative(projectRoot,path.join(publicRoot,'assets','email','uploads')).replace(/\\/g,'/'),
  path.relative(projectRoot,path.join(publicRoot,'assets','portada','uploads')).replace(/\\/g,'/'),
  path.relative(projectRoot,path.join(publicRoot,'assets','portada','separadores','uploads')).replace(/\\/g,'/'),
  path.relative(projectRoot,path.join(publicRoot,'assets','beneficios','uploads')).replace(/\\/g,'/'),
  path.relative(projectRoot,path.join(publicRoot,'assets','maintenance','uploads')).replace(/\\/g,'/')
];

const cache=new Map();
let queue=Promise.resolve();
let lastRemoteStamp='';
let nextRefreshAt=0;
let refreshPromise=null;

function posix(rel){return String(rel||'').replace(/\\/g,'/').replace(/^\/+/, '')}
function absolute(rel){return path.join(projectRoot,...posix(rel).split('/'))}
function ignored(rel){const base=path.basename(rel).toLowerCase();return base==='.keep'||base==='readme.txt'}
function isManaged(rel){
  rel=posix(rel);
  if(CONFIG_FILES.includes(rel))return true;
  return MANAGED_DIRS.some(dir=>rel===dir||rel.startsWith(dir+'/'));
}
function mimeFor(rel){
  const ext=path.extname(rel).toLowerCase();
  return ({
    '.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml',
    '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp',
    '.mp4':'video/mp4','.webm':'video/webm','.pdf':'application/pdf'
  })[ext]||'application/octet-stream';
}
function walk(dirRel,out){
  const dir=absolute(dirRel);
  if(!fs.existsSync(dir))return;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const rel=posix(path.posix.join(dirRel,entry.name));
    if(entry.isDirectory())walk(rel,out);
    else if(entry.isFile()&&!ignored(rel))out.push(rel);
  }
}
function listCurrent(){
  const out=[];
  for(const rel of CONFIG_FILES){if(fs.existsSync(absolute(rel))&&fs.statSync(absolute(rel)).isFile())out.push(rel)}
  for(const dir of MANAGED_DIRS)walk(dir,out);
  return [...new Set(out)].filter(isManaged).sort();
}
function setCache(rel,stat,sha){cache.set(rel,{size:Number(stat.size)||0,mtimeMs:Number(stat.mtimeMs)||0,sha256:sha})}
function hashFile(abs){
  const h=crypto.createHash('sha256');
  const fd=fs.openSync(abs,'r');
  const buf=Buffer.allocUnsafe(CHUNK_SIZE);
  try{
    while(true){const n=fs.readSync(fd,buf,0,buf.length,null);if(!n)break;h.update(buf.subarray(0,n))}
  }finally{fs.closeSync(fd)}
  return h.digest('hex');
}
async function ensureTable(){
  if(!db.usingPostgres())return;
  await db.query(`CREATE TABLE IF NOT EXISTS nr_admin_files (
    file_path TEXT PRIMARY KEY,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    size_bytes BIGINT NOT NULL DEFAULT 0,
    sha256 TEXT NOT NULL,
    storage_mode TEXT NOT NULL DEFAULT 'inline',
    chunk_count INTEGER NOT NULL DEFAULT 0,
    content BYTEA,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await db.query("ALTER TABLE nr_admin_files ADD COLUMN IF NOT EXISTS storage_mode TEXT NOT NULL DEFAULT 'inline'");
  await db.query('ALTER TABLE nr_admin_files ADD COLUMN IF NOT EXISTS chunk_count INTEGER NOT NULL DEFAULT 0');
  await db.query('ALTER TABLE nr_admin_files ALTER COLUMN content DROP NOT NULL');
  await db.query(`CREATE TABLE IF NOT EXISTS nr_admin_file_chunks (
    file_path TEXT NOT NULL REFERENCES nr_admin_files(file_path) ON DELETE CASCADE,
    chunk_no INTEGER NOT NULL,
    content BYTEA NOT NULL,
    PRIMARY KEY(file_path,chunk_no)
  )`);
}
async function remoteStamp(client=null){
  const r=await db.query(`SELECT COUNT(*)::int AS n,COALESCE(SUM(size_bytes),0)::text AS bytes,COALESCE(MAX(updated_at)::text,'') AS updated FROM nr_admin_files`,[],client);
  const row=r.rows[0]||{};return `${row.n||0}|${row.bytes||'0'}|${row.updated||''}`;
}
async function writeChunks(rel,abs,size,sha,client){
  const chunkCount=Math.ceil(size/CHUNK_SIZE);
  await db.query(`INSERT INTO nr_admin_files(file_path,mime_type,size_bytes,sha256,storage_mode,chunk_count,content,updated_at)
    VALUES($1,$2,$3,$4,'chunks',$5,NULL,NOW())
    ON CONFLICT(file_path) DO UPDATE SET mime_type=EXCLUDED.mime_type,size_bytes=EXCLUDED.size_bytes,sha256=EXCLUDED.sha256,storage_mode='chunks',chunk_count=EXCLUDED.chunk_count,content=NULL,updated_at=NOW()`,
    [rel,mimeFor(rel),size,sha,chunkCount],client);
  await db.query('DELETE FROM nr_admin_file_chunks WHERE file_path=$1',[rel],client);
  const fd=fs.openSync(abs,'r');
  const buf=Buffer.allocUnsafe(CHUNK_SIZE);
  try{
    for(let chunkNo=0;;chunkNo++){
      const n=fs.readSync(fd,buf,0,buf.length,null);if(!n)break;
      await db.query('INSERT INTO nr_admin_file_chunks(file_path,chunk_no,content) VALUES($1,$2,$3)',[rel,chunkNo,Buffer.from(buf.subarray(0,n))],client);
    }
  }finally{fs.closeSync(fd)}
}
async function writeInline(rel,abs,size,sha,client){
  const content=fs.readFileSync(abs);
  await db.query(`INSERT INTO nr_admin_files(file_path,mime_type,size_bytes,sha256,storage_mode,chunk_count,content,updated_at)
    VALUES($1,$2,$3,$4,'inline',0,$5,NOW())
    ON CONFLICT(file_path) DO UPDATE SET mime_type=EXCLUDED.mime_type,size_bytes=EXCLUDED.size_bytes,sha256=EXCLUDED.sha256,storage_mode='inline',chunk_count=0,content=EXCLUDED.content,updated_at=NOW()`,
    [rel,mimeFor(rel),size,sha,content],client);
  await db.query('DELETE FROM nr_admin_file_chunks WHERE file_path=$1',[rel],client);
}

async function snapshotAll({reason='panel'}={}){
  if(!db.usingPostgres())return {backend:'json',saved:0,deleted:0};
  await ensureTable();
  const current=listCurrent();
  const currentSet=new Set(current);
  const existingResult=await db.query('SELECT file_path,size_bytes,sha256 FROM nr_admin_files');
  const existing=new Map(existingResult.rows.map(row=>[posix(row.file_path),row]));
  let saved=0,deleted=0;

  await db.withTransaction(async client=>{
    for(const rel of current){
      const abs=absolute(rel);
      const stat=fs.statSync(abs);
      const c=cache.get(rel);
      const remote=existing.get(rel);
      if(c&&c.size===stat.size&&Math.abs(c.mtimeMs-stat.mtimeMs)<1&&remote&&remote.sha256===c.sha256)continue;
      const sha=hashFile(abs);
      if(remote&&Number(remote.size_bytes)===stat.size&&remote.sha256===sha){setCache(rel,stat,sha);continue;}
      if(stat.size<=INLINE_LIMIT)await writeInline(rel,abs,stat.size,sha,client);
      else await writeChunks(rel,abs,stat.size,sha,client);
      setCache(rel,stat,sha);saved++;
    }
    for(const rel of existing.keys()){
      if(!isManaged(rel)||currentSet.has(rel))continue;
      await db.query('DELETE FROM nr_admin_files WHERE file_path=$1',[rel],client);
      cache.delete(rel);deleted++;
    }
  });
  lastRemoteStamp=await remoteStamp();
  return {backend:'postgres',reason,saved,deleted,total:current.length};
}

async function restoreFile(row){
  const rel=posix(row.file_path);if(!isManaged(rel))return false;
  const abs=absolute(rel);fs.mkdirSync(path.dirname(abs),{recursive:true});
  if(row.storage_mode==='chunks'&&Number(row.chunk_count)>0){
    const fd=fs.openSync(abs,'w');
    try{
      for(let n=0;n<Number(row.chunk_count);n++){
        const chunk=await db.query('SELECT content FROM nr_admin_file_chunks WHERE file_path=$1 AND chunk_no=$2',[rel,n]);
        const content=chunk.rows[0]?.content;
        if(!content)throw new Error(`Falta el bloque ${n} de ${rel}`);
        fs.writeSync(fd,Buffer.isBuffer(content)?content:Buffer.from(content));
      }
    }finally{fs.closeSync(fd)}
  }else{
    const content=Buffer.isBuffer(row.content)?row.content:Buffer.from(row.content||'');
    fs.writeFileSync(abs,content);
  }
  const stat=fs.statSync(abs);setCache(rel,stat,row.sha256||hashFile(abs));return true;
}

async function restore(){
  if(!db.usingPostgres())return {backend:'json',restored:0,seeded:0};
  await ensureTable();
  const result=await db.query('SELECT file_path,mime_type,size_bytes,sha256,storage_mode,chunk_count,content FROM nr_admin_files ORDER BY file_path');
  let restored=0;
  for(const row of result.rows){if(await restoreFile(row))restored++}

  // Si es la primera ejecución, guarda los valores incluidos en el paquete.
  // En versiones futuras solo agrega archivos nuevos; nunca pisa lo ya guardado.
  const before=new Set(result.rows.map(row=>posix(row.file_path)));
  const missing=listCurrent().filter(rel=>!before.has(rel));
  let seeded=0;
  if(!result.rows.length||missing.length){
    const seededResult=await snapshotAll({reason:result.rows.length?'seed-new-files':'initial-seed'});
    seeded=seededResult.saved;
  }else lastRemoteStamp=await remoteStamp();
  nextRefreshAt=Date.now()+REFRESH_INTERVAL_MS;
  return {backend:'postgres',restored,seeded,total:Math.max(result.rows.length,restored+seeded)};
}

async function refreshIfNeeded(){
  if(!db.usingPostgres())return;
  const now=Date.now();if(now<nextRefreshAt)return;
  nextRefreshAt=now+REFRESH_INTERVAL_MS;
  if(refreshPromise)return refreshPromise;
  refreshPromise=(async()=>{
    try{
      await ensureTable();
      const stamp=await remoteStamp();
      if(stamp!==lastRemoteStamp)await restore();
    }finally{refreshPromise=null}
  })();
  return refreshPromise;
}

async function status(){
  if(!db.usingPostgres())return {enabled:false,backend:'json',files:0,bytes:0,lastUpdated:null};
  await ensureTable();
  const r=await db.query(`SELECT COUNT(*)::int AS files,COALESCE(SUM(size_bytes),0)::text AS bytes,MAX(updated_at) AS updated FROM nr_admin_files`);
  const row=r.rows[0]||{};
  return {enabled:true,backend:'postgres',files:Number(row.files)||0,bytes:Number(row.bytes)||0,lastUpdated:row.updated||null};
}
function scheduleSnapshot(reason='panel'){
  if(!db.usingPostgres())return;
  queue=queue.then(async()=>{
    const result=await snapshotAll({reason});
    if(result.saved||result.deleted)console.log(`Persistencia del panel OK: ${result.saved} guardados, ${result.deleted} eliminados (${reason})`);
    return result;
  }).catch(err=>{
    console.error(`Persistencia del panel ERROR (${reason}):`,err.message);
  });
}

module.exports={CONFIG_FILES,MANAGED_DIRS,isManaged,listCurrent,restore,refreshIfNeeded,snapshotAll,scheduleSnapshot,status};
