const {spawn}=require('child_process');
const path=require('path');

const port=Number(process.env.SECURITY_TEST_PORT||4299);
const base=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['server.js'],{
  cwd:__dirname,
  env:{
    ...process.env,
    PORT:String(port),
    NODE_ENV:'development',
    TRUST_PROXY_HOPS:'0',
    DATA_BACKEND:'json',DATABASE_URL:'',
    ADMIN_PASSWORD:'security-smoke-test-only',
    ADMIN_PATH:'/nr-security-test-admin',
    STRIPE_SECRET_KEY:'',STRIPE_PUBLISHABLE_KEY:'',STRIPE_WEBHOOK_SECRET:'',
    PAYPAL_CLIENT_ID:'',PAYPAL_CLIENT_SECRET:'',PAYPAL_WEBHOOK_ID:'',
    MERCADOPAGO_ACCESS_TOKEN:'',MERCADOPAGO_WEBHOOK_SECRET:'',
    BREVO_SMTP_USER:'',BREVO_SMTP_KEY:'',BREVO_API_KEY:''
  },
  stdio:['ignore','pipe','pipe']
});
let output='';
child.stdout.on('data',d=>{output+=String(d)});
child.stderr.on('data',d=>{output+=String(d)});

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitForServer(){
  for(let i=0;i<50;i++){
    try{const r=await fetch(`${base}/api/products`);if(r.status<500)return}catch{}
    await sleep(100);
  }
  throw new Error(`El servidor no inició a tiempo.\n${output}`);
}
async function expectStatus(url,status){
  const r=await fetch(base+url,{redirect:'manual'});
  if(r.status!==status)throw new Error(`${url}: esperaba HTTP ${status} y respondió ${r.status}`);
  return r;
}
(async()=>{
  try{
    await waitForServer();
    const home=await expectStatus('/',200);
    await expectStatus('/index.html',200);
    await expectStatus('/assets/favicon.svg',200);
    await expectStatus('/server/data/orders.json',404);
    await expectStatus('/server/server.js',404);
    await expectStatus('/server/database.js',404);
    await expectStatus('/server/data/customer-sessions.json',404);
    await expectStatus('/README.txt',404);
    await expectStatus('/admin.html',404);
    await expectStatus('/nr-security-test-admin',200);
    if(home.headers.get('x-powered-by'))throw new Error('X-Powered-By sigue expuesto.');
    if((home.headers.get('x-content-type-options')||'').toLowerCase()!=='nosniff')throw new Error('Falta X-Content-Type-Options: nosniff.');
    if(!home.headers.get('referrer-policy'))throw new Error('Falta Referrer-Policy.');
    if(!home.headers.get('permissions-policy'))throw new Error('Falta Permissions-Policy.');
    console.log('OK: pruebas básicas de seguridad V127.43 superadas.');
  }finally{
    child.kill('SIGTERM');
  }
})().catch(err=>{console.error(err.message);child.kill('SIGTERM');process.exitCode=1});
