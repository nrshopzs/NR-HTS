const fs=require('fs');
const path=require('path');

const dataDir=path.join(__dirname,'data');
const file=path.join(dataDir,'maintenance-mode.json');
fs.mkdirSync(dataDir,{recursive:true});

const FONT_FAMILIES=['Montserrat','Helvetica Neue','Arial','Arial Black','Impact','Georgia','Times New Roman','Trebuchet MS','Courier New'];
const DEFAULT_TEXT_STYLE={
  visible:true,
  x:50,
  y:50,
  maxWidth:760,
  fontFamily:'Helvetica Neue',
  fontSize:18,
  mobileFontSize:14,
  fontWeight:400,
  italic:false,
  color:'#242424',
  backgroundColor:'transparent',
  paddingX:0,
  paddingY:0,
  letterSpacing:0,
  lineHeight:1.4,
  align:'center',
  uppercase:false
};
const DEFAULT={
  version:2,
  enabled:false,
  background:{
    mode:'color',
    color:'#f7f7f5',
    image:'',
    video:'',
    positionX:50,
    positionY:50,
    overlayColor:'#000000',
    overlayOpacity:0
  },
  logo:{
    visible:true,
    src:'assets/logo-ninos-rancios.svg',
    width:310,
    mobileWidth:230,
    x:50,
    y:20
  },
  icon:{
    visible:false,
    src:'',
    width:70,
    mobileWidth:58,
    x:50,
    y:34
  },
  texts:{
    eyebrow:{...DEFAULT_TEXT_STYLE,text:'Niños Rancios',x:50,y:39,maxWidth:650,fontSize:11,mobileFontSize:10,fontWeight:600,color:'#777777',letterSpacing:6,lineHeight:1.2,uppercase:true},
    title:{...DEFAULT_TEXT_STYLE,text:'SITIO EN MANTENIMIENTO',x:50,y:49,maxWidth:940,fontSize:58,mobileFontSize:36,fontWeight:300,color:'#232323',letterSpacing:1.8,lineHeight:1.05,uppercase:false},
    message:{...DEFAULT_TEXT_STYLE,text:'Estamos realizando algunos ajustes para mejorar tu experiencia. Volveremos pronto.',x:50,y:62,maxWidth:620,fontSize:16,mobileFontSize:14,fontWeight:400,color:'#555555',letterSpacing:0,lineHeight:1.75,uppercase:false},
    footer:{...DEFAULT_TEXT_STYLE,text:'Premium Quality',x:50,y:82,maxWidth:650,fontSize:11,mobileFontSize:10,fontWeight:400,color:'#999999',letterSpacing:1.8,lineHeight:1.2,uppercase:true}
  },
  updatedAt:new Date().toISOString()
};

function cleanText(value,fallback='',max=1000){
  const text=String(value??'').replace(/\r\n?/g,'\n').trim();
  return (text||fallback).slice(0,max);
}
function num(value,min,max,fallback){const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback}
function color(value,fallback='#000000'){
  const v=String(value??'').trim();
  if(v==='transparent')return 'transparent';
  return /^#[0-9a-fA-F]{6}$/.test(v)?v:fallback;
}
function bool(value,fallback=false){return value===undefined?fallback:!!value}
function safeMedia(value,type='image'){
  const v=String(value??'').trim().replace(/^\/+/, '');
  if(!v)return '';
  if(type==='video'&&/^assets\/maintenance\/uploads\/[a-z0-9._-]+\.(?:mp4|webm)$/i.test(v))return v;
  if(type==='image'&&/^assets\/maintenance\/uploads\/[a-z0-9._-]+\.(?:png|jpe?g|webp)$/i.test(v))return v;
  return '';
}
function safeAsset(value,fallback=''){
  const v=String(value??'').trim().replace(/^\/+/, '');
  if(v==='assets/logo-ninos-rancios.svg')return v;
  if(/^assets\/maintenance\/uploads\/[a-z0-9._-]+\.(?:svg|png|jpe?g|webp)$/i.test(v))return v;
  return fallback;
}
function textBlock(raw={},fallback={}){
  const base={...DEFAULT_TEXT_STYLE,...fallback};
  return {
    visible:bool(raw.visible,base.visible),
    text:cleanText(raw.text,base.text||'',1200),
    x:num(raw.x,0,100,base.x),
    y:num(raw.y,0,100,base.y),
    maxWidth:num(raw.maxWidth,180,1400,base.maxWidth),
    fontFamily:FONT_FAMILIES.includes(raw.fontFamily)?raw.fontFamily:base.fontFamily,
    fontSize:num(raw.fontSize,8,140,base.fontSize),
    mobileFontSize:num(raw.mobileFontSize,8,80,base.mobileFontSize),
    fontWeight:[100,200,300,400,500,600,700,800,900].includes(Number(raw.fontWeight))?Number(raw.fontWeight):base.fontWeight,
    italic:bool(raw.italic,base.italic),
    color:color(raw.color,base.color),
    backgroundColor:color(raw.backgroundColor,base.backgroundColor),
    paddingX:num(raw.paddingX,0,80,base.paddingX),
    paddingY:num(raw.paddingY,0,50,base.paddingY),
    letterSpacing:num(raw.letterSpacing,-10,24,base.letterSpacing),
    lineHeight:num(raw.lineHeight,0.8,3,base.lineHeight),
    align:['left','center','right'].includes(raw.align)?raw.align:base.align,
    uppercase:bool(raw.uppercase,base.uppercase)
  };
}
function normalize(raw={}){
  const legacyTitle=raw.title;
  const legacyMessage=raw.message;
  const bg=raw.background||{};
  const logo=raw.logo||{};
  const icon=raw.icon||{};
  const texts=raw.texts||{};
  const titleSource=legacyTitle&&!texts.title?{...DEFAULT.texts.title,text:legacyTitle}:texts.title;
  const messageSource=legacyMessage&&!texts.message?{...DEFAULT.texts.message,text:legacyMessage}:texts.message;
  return {
    version:2,
    enabled:!!raw.enabled,
    background:{
      mode:['color','image','video'].includes(bg.mode)?bg.mode:'color',
      color:color(bg.color,DEFAULT.background.color),
      image:safeMedia(bg.image,'image'),
      video:safeMedia(bg.video,'video'),
      positionX:num(bg.positionX,0,100,DEFAULT.background.positionX),
      positionY:num(bg.positionY,0,100,DEFAULT.background.positionY),
      overlayColor:color(bg.overlayColor,DEFAULT.background.overlayColor),
      overlayOpacity:num(bg.overlayOpacity,0,0.9,DEFAULT.background.overlayOpacity)
    },
    logo:{
      visible:bool(logo.visible,DEFAULT.logo.visible),
      src:safeAsset(logo.src,DEFAULT.logo.src),
      width:num(logo.width,40,900,DEFAULT.logo.width),
      mobileWidth:num(logo.mobileWidth,40,520,DEFAULT.logo.mobileWidth),
      x:num(logo.x,0,100,DEFAULT.logo.x),
      y:num(logo.y,0,100,DEFAULT.logo.y)
    },
    icon:{
      visible:bool(icon.visible,DEFAULT.icon.visible),
      src:safeAsset(icon.src,''),
      width:num(icon.width,20,500,DEFAULT.icon.width),
      mobileWidth:num(icon.mobileWidth,20,300,DEFAULT.icon.mobileWidth),
      x:num(icon.x,0,100,DEFAULT.icon.x),
      y:num(icon.y,0,100,DEFAULT.icon.y)
    },
    texts:{
      eyebrow:textBlock(texts.eyebrow||{},DEFAULT.texts.eyebrow),
      title:textBlock(titleSource||{},DEFAULT.texts.title),
      message:textBlock(messageSource||{},DEFAULT.texts.message),
      footer:textBlock(texts.footer||{},DEFAULT.texts.footer)
    },
    updatedAt:String(raw.updatedAt||new Date().toISOString())
  };
}
function write(settings){fs.writeFileSync(file,JSON.stringify(normalize(settings),null,2)+'\n','utf8')}
function load(){
  if(!fs.existsSync(file)){write(DEFAULT);return normalize(DEFAULT)}
  try{return normalize(JSON.parse(fs.readFileSync(file,'utf8')))}
  catch{write(DEFAULT);return normalize(DEFAULT)}
}
function status(){return load()}
function isEnabled(){return load().enabled}
function save(input={}){
  const current=load();
  const merged={...current,...input};
  if(input.background)merged.background={...current.background,...input.background};
  if(input.logo)merged.logo={...current.logo,...input.logo};
  if(input.icon)merged.icon={...current.icon,...input.icon};
  if(input.texts){
    merged.texts={...current.texts};
    for(const key of ['eyebrow','title','message','footer'])if(input.texts[key])merged.texts[key]={...current.texts[key],...input.texts[key]};
  }
  merged.updatedAt=new Date().toISOString();
  write(merged);
  return status();
}
module.exports={DEFAULT,FONT_FAMILIES,status,isEnabled,save};
