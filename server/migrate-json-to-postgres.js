require('dotenv').config();
const maintenance=require('./postgres-maintenance');

(async()=>{
  const force=process.argv.includes('--force');
  const result=await maintenance.migrate({force});
  if(result.status==='already-migrated')console.log('Migración omitida: PostgreSQL ya contiene exactamente los mismos conteos que los JSON.');
  else console.log('Migración JSON -> PostgreSQL completada y validada.');
  console.log(JSON.stringify(result.counts,null,2));
  console.log('Los archivos JSON originales NO fueron eliminados ni modificados. Consérvalos como respaldo hasta terminar las pruebas de V127.45.');
})().catch(err=>{console.error('Migración cancelada:',err.message);process.exitCode=1});
