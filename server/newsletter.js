const API_BASE='https://api.brevo.com/v3';

function clean(value,max=500){return String(value??'').trim().slice(0,max)}
function config(){
  const listId=Number(process.env.BREVO_NEWSLETTER_LIST_ID||0);
  return {
    apiKey:clean(process.env.BREVO_API_KEY,500),
    listId:Number.isInteger(listId)&&listId>0?listId:0
  };
}
function isConfigured(){const c=config();return !!(c.apiKey&&c.listId)}

async function subscribe(email=''){
  const c=config();
  if(!isConfigured())throw new Error('Configura BREVO_API_KEY y BREVO_NEWSLETTER_LIST_ID en server/.env.');
  const response=await fetch(`${API_BASE}/contacts`,{
    method:'POST',
    headers:{
      'accept':'application/json',
      'content-type':'application/json',
      'api-key':c.apiKey
    },
    body:JSON.stringify({
      email,
      listIds:[c.listId],
      emailBlacklisted:false,
      updateEnabled:true
    })
  });
  if(!response.ok){
    let detail='';
    try{const body=await response.json();detail=clean(body?.message||body?.code||'',300)}catch{}
    throw new Error(detail||`Brevo respondió ${response.status}.`);
  }
  return {ok:true};
}

module.exports={isConfigured,subscribe};
