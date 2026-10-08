const fs=require('fs');
const path=require('path');

const dataDir=path.join(__dirname,'data');
const file=path.join(dataDir,'size-guide.json');

const DEFAULT={
  enabled:true,
  title:'Guía de tallas',
  subtitle:'Playera cuello redondo · corte Regular Fit',
  units:'Centímetros',
  tolerance:'Tolerancia: ±2 cm',
  note:'Mide una playera que te quede bien sobre una superficie plana. El ancho se toma de axila a axila y el largo desde la parte superior del hombro hasta el borde inferior.',
  rows:[
    {size:'CH',length:71.1,width:48.3},
    {size:'M',length:73.7,width:52.1},
    {size:'G',length:76.2,width:55.9},
    {size:'XG',length:78.7,width:59.7}
  ]
};

function ensure(){
  fs.mkdirSync(dataDir,{recursive:true});
  if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify(DEFAULT,null,2)+'\n','utf8');
}
function text(value,max=500){return String(value??'').trim().slice(0,max)}
function number(value,min=0,max=999){const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):0}
function sanitize(raw={}){
  const rows=(Array.isArray(raw.rows)?raw.rows:DEFAULT.rows).slice(0,12).map(row=>({
    size:text(row?.size,20).toUpperCase(),
    length:number(row?.length,0,250),
    width:number(row?.width,0,250)
  })).filter(row=>row.size&&row.length>0&&row.width>0);
  return {
    enabled:raw.enabled!==false,
    title:text(raw.title,100)||DEFAULT.title,
    subtitle:text(raw.subtitle,180)||DEFAULT.subtitle,
    units:text(raw.units,40)||DEFAULT.units,
    tolerance:text(raw.tolerance,100)||DEFAULT.tolerance,
    note:text(raw.note,800)||DEFAULT.note,
    rows:rows.length?rows:DEFAULT.rows.map(row=>({...row}))
  };
}
function get(){
  ensure();
  try{return sanitize(JSON.parse(fs.readFileSync(file,'utf8')))}catch{return sanitize(DEFAULT)}
}
function save(raw){
  const clean=sanitize(raw);
  fs.writeFileSync(file,JSON.stringify(clean,null,2)+'\n','utf8');
  return clean;
}
module.exports={DEFAULT,get,save};
