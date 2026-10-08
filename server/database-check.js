require('dotenv').config();
const maintenance=require('./postgres-maintenance');

(async()=>{
  const result=await maintenance.check();
  console.log('PostgreSQL conectado. Tablas V127.45 disponibles:');
  console.log(JSON.stringify(result,null,2));
})().catch(err=>{console.error('Database check:',err.message);process.exitCode=1});
