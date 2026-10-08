const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const dataDir=path.join(__dirname,'data');
const file=path.join(dataDir,'homepage.json');

const FONT_FAMILIES=['Montserrat','Helvetica Neue','Arial','Arial Black','Impact','Georgia','Times New Roman','Trebuchet MS','Courier New'];
const DEFAULT_BLOCKS=[
  {id:'title',text:'OFERTA ESPECIAL',x:50,y:38,mobileX:50,mobileY:38,fontFamily:'Arial Black',fontSize:77,mobileFontSize:32,fontWeight:900,italic:true,color:'#050505',backgroundColor:'transparent',paddingX:0,paddingY:0,letterSpacing:-4,visible:true},
  {id:'weekend',text:'FIN DE SEMANA',x:50,y:49,mobileX:50,mobileY:48,fontFamily:'Arial Black',fontSize:70,mobileFontSize:29,fontWeight:900,italic:true,color:'#050505',backgroundColor:'#ff3035',paddingX:12,paddingY:4,letterSpacing:-4,visible:true},
  {id:'discount',text:'20% DE DESCUENTO',x:50,y:60,mobileX:50,mobileY:58,fontFamily:'Arial Black',fontSize:44,mobileFontSize:19,fontWeight:900,italic:true,color:'#050505',backgroundColor:'transparent',paddingX:0,paddingY:0,letterSpacing:-2,visible:true},
  {id:'shipping',text:'+ ENVÍO GRATIS DESDE $999',x:50,y:67,mobileX:50,mobileY:65,fontFamily:'Arial Black',fontSize:19,mobileFontSize:11,fontWeight:900,italic:true,color:'#050505',backgroundColor:'transparent',paddingX:0,paddingY:0,letterSpacing:0,visible:true},
  {id:'small',text:'Disfruta hasta 20% de descuento en playeras. Envío gratis en compras desde MX$999.00.',x:50,y:76,mobileX:50,mobileY:90,fontFamily:'Helvetica Neue',fontSize:16,mobileFontSize:10,fontWeight:500,italic:false,color:'#ffffff',backgroundColor:'transparent',paddingX:0,paddingY:0,letterSpacing:0,visible:true}
];
const DEFAULT_BENEFITS_BAND={
  backgroundColor:'#b9df4b',
  items:[
    {icon:'icons/shipping-icon.svg',title:'PAGO SEGURO EN LÍNEA',subtitle:'Cifrado SSL · Compra 100% segura',titleStyle:{fontFamily:'Helvetica Neue',fontWeight:500,italic:false,color:'#282828',fontSize:17,mobileFontSize:13},subtitleStyle:{fontFamily:'Helvetica Neue',fontWeight:400,italic:false,color:'#4b5735',fontSize:13,mobileFontSize:10},textOffsetX:0,textOffsetY:0,mobileTextOffsetX:0,mobileTextOffsetY:0,subtitleOffsetX:0,subtitleOffsetY:0,mobileSubtitleOffsetX:0,mobileSubtitleOffsetY:0},
    {icon:'icons/support-icon.svg',title:'ATENCIÓN RÁPIDA',subtitle:'Estamos aquí para ayudarte',titleStyle:{fontFamily:'Helvetica Neue',fontWeight:500,italic:false,color:'#282828',fontSize:17,mobileFontSize:13},subtitleStyle:{fontFamily:'Helvetica Neue',fontWeight:400,italic:false,color:'#4b5735',fontSize:13,mobileFontSize:10},textOffsetX:0,textOffsetY:0,mobileTextOffsetX:0,mobileTextOffsetY:0,subtitleOffsetX:0,subtitleOffsetY:0,mobileSubtitleOffsetX:0,mobileSubtitleOffsetY:0},
    {icon:'icons/tarjeta-icon.svg',title:'ENVÍOS RÁPIDOS',subtitle:'Envíos rápidos y seguros',titleStyle:{fontFamily:'Helvetica Neue',fontWeight:500,italic:false,color:'#282828',fontSize:17,mobileFontSize:13},subtitleStyle:{fontFamily:'Helvetica Neue',fontWeight:400,italic:false,color:'#4b5735',fontSize:13,mobileFontSize:10},textOffsetX:0,textOffsetY:0,mobileTextOffsetX:0,mobileTextOffsetY:0,subtitleOffsetX:0,subtitleOffsetY:0,mobileSubtitleOffsetX:0,mobileSubtitleOffsetY:0}
  ]
};
const DEFAULT_HERO_FEATURE_BLOCK={
  enabled:true,
  image:'https://static.wixstatic.com/media/11062b_2ffe9bf7695a4ef6abb5b61acdf992f9~mv2.jpg/v1/fill/w_985,h_657,al_c,q_85,usm_0.66_1.00_0.01/11062b_2ffe9bf7695a4ef6abb5b61acdf992f9~mv2.jpg',
  imageSide:'left',
  imagePositionX:50,
  imagePositionY:50,
  imageWidth:50,
  backgroundColor:'#ffffff',
  minHeight:360,
  mobileImageHeight:220,
  title:'Ponte rancio con Niños Rancios',
  subtitle:'Ropa con actitud. Sin filtros.',
  titleStyle:{fontFamily:'Helvetica Neue',fontWeight:400,italic:false,color:'#1f1e1c',fontSize:30,mobileFontSize:24,letterSpacing:0,textAlign:'left'},
  subtitleStyle:{fontFamily:'Helvetica Neue',fontWeight:400,italic:false,color:'#333333',fontSize:18,mobileFontSize:16,letterSpacing:0,textAlign:'left'},
  button:{enabled:true,text:'Acerca de Nosotros',href:'about-us.html',backgroundColor:'transparent',color:'#1f1e1c',borderColor:'#d7d1c8',borderWidth:1,borderRadius:0,fontFamily:'Helvetica Neue',fontWeight:400,italic:false,fontSize:16,mobileFontSize:15,textAlign:'center',width:280,height:48}
};
const DEFAULT_HOME_FEATURE_BLOCK={
  enabled:false,
  image:'',
  imageSide:'right',
  imagePositionX:50,
  imagePositionY:50,
  imageWidth:58,
  backgroundColor:'#f4f2ed',
  minHeight:520,
  mobileImageHeight:320,
  contentOffsetX:0,
  contentOffsetY:0,
  mobileContentOffsetX:0,
  mobileContentOffsetY:0,
  title:'OBEDECE\nO QUÉDATE FUERA',
  subtitle:'Edición Limitada',
  titleStyle:{fontFamily:'Arial Black',fontWeight:900,italic:false,color:'#111111',fontSize:42,mobileFontSize:30,letterSpacing:0,textAlign:'left',offsetX:0,offsetY:0,mobileOffsetX:0,mobileOffsetY:0},
  subtitleStyle:{fontFamily:'Helvetica Neue',fontWeight:700,italic:true,color:'#222222',fontSize:18,mobileFontSize:15,letterSpacing:0,textAlign:'left',offsetX:0,offsetY:0,mobileOffsetX:0,mobileOffsetY:0},
  button:{enabled:true,text:'👉 Comprar Ahora',href:'shop-all.html',backgroundColor:'transparent',color:'#1f1e1c',borderColor:'#1f1e1c',borderWidth:0,borderRadius:0,fontFamily:'Helvetica Neue',fontWeight:400,italic:false,fontSize:17,mobileFontSize:16,textAlign:'left',width:190,height:46,offsetX:0,offsetY:0,mobileOffsetX:0,mobileOffsetY:0}
};
const DEFAULT_CATALOG_STYLE={
  backgroundColor:'#ffffff',
  productNameColor:'#4d5e75',
  productPriceColor:'#738197',
  title:{
    visible:true,
    text:'🔥 HOT 🔥',
    fontFamily:'Helvetica Neue',
    fontWeight:700,
    italic:false,
    color:'#1f1e1c',
    backgroundColor:'transparent',
    fontSize:24,
    mobileFontSize:22,
    letterSpacing:0.5,
    textAlign:'center',
    textTransform:'none',
    paddingX:0,
    paddingY:0,
    borderColor:'#1f1e1c',
    borderWidth:0,
    borderRadius:0,
    marginTop:0,
    marginBottom:48
  }
};
const PROMO_RIBBON_PAGES=['index.html','shop-all.html','woman.html','men.html','product.html','about-us.html','contact.html','privacy.html','returns.html','shipping.html','stockists.html','partners.html','jobs.html','offers.html','account.html'];
const DEFAULT_FOOTER_SETTINGS={phone:'7571541553',facebookUrl:'https://facebook.com/ninosrancios',instagramUrl:'https://instagram.com/ninosrancios'};
const DEFAULT={
  autoplaySeconds:0,
  autoplayDirection:'next',
  showArrows:true,
  showDots:true,
  arrowSize:46,
  arrowSizeMobile:34,
  arrowWeight:200,
  arrowColor:'#ffffff',
  arrowOpacity:0.92,
  transitionType:'slide',
  transitionDurationMs:560,
  height:635,
  mobileHeight:560,
  desktopTextScale:0.65,
  mobileTextScale:1.00,
  responsiveTextV2:true,
  promoRibbonEnabled:true,
  promoRibbonText:'ENVÍOS GRATIS EN TIENDA Y A DOMICILIO DESDE $799',
  promoRibbonDuration:26,
  promoRibbonBackgroundColor:'#0f0f0f',
  promoRibbonTextColor:'#ffffff',
  promoRibbonFontSize:15,
  promoRibbonSpacing:26,
  promoRibbonSeparator:'✦',
  promoRibbonSeparatorIcon:'',
  promoRibbonSeparatorIconSize:22,
  promoRibbonPages:PROMO_RIBBON_PAGES,
  footerSettings:DEFAULT_FOOTER_SETTINGS,
  benefitsBand:DEFAULT_BENEFITS_BAND,
  heroFeatureBlock:DEFAULT_HERO_FEATURE_BLOCK,
  homeFeatureBlock:DEFAULT_HOME_FEATURE_BLOCK,
  catalogStyle:DEFAULT_CATALOG_STYLE,
  slides:[{
    id:'slide-home-1',
    mediaType:'image',
    video:'',
    image:'https://static.wixstatic.com/media/11062b_2ffe9bf7695a4ef6abb5b61acdf992f9~mv2.jpg/v1/fill/w_985,h_657,al_c,q_85,usm_0.66_1.00_0.01/11062b_2ffe9bf7695a4ef6abb5b61acdf992f9~mv2.jpg',
    imagePositionX:50,
    imagePositionY:50,
    overlayOpacity:0.18,
    blocks:DEFAULT_BLOCKS
  }]
};
function ensure(){fs.mkdirSync(dataDir,{recursive:true});if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify(DEFAULT,null,2)+'\n','utf8')}
function cleanText(value,max=500){return String(value??'').trim().slice(0,max)}
function num(value,min,max,fallback){const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback}
function color(value,fallback='transparent'){
  const v=cleanText(value,30);
  if(v==='transparent')return 'transparent';
  return /^#[0-9a-fA-F]{6}$/.test(v)?v:fallback;
}
function safeImage(value){const v=cleanText(value,800);if(!v)return '';if(/^https?:\/\//i.test(v))return v;if(/^(assets|icons)\//.test(v))return v.replace(/^\/+/, '');return ''}
function safeVideo(value){const v=cleanText(value,800);if(!v)return '';if(/^https?:\/\//i.test(v))return v;if(/^assets\/portada\/uploads\/[a-z0-9._-]+\.(?:mp4|webm)$/i.test(v))return v.replace(/^\/+/, '');return ''}
function promoRibbonPages(value){const pages=Array.isArray(value)?value:PROMO_RIBBON_PAGES;return [...new Set(pages.map(v=>cleanText(v,60).toLowerCase()).filter(v=>PROMO_RIBBON_PAGES.includes(v)))]}
function safeRibbonIcon(value){const v=cleanText(value,300).replace(/^\/+/, '');return /^assets\/portada\/separadores\/uploads\/[a-z0-9-]+\.svg$/i.test(v)?v:''}
function safeBenefitIcon(value,fallback=''){
  const v=cleanText(value,400).replace(/^\/+/, '');
  if(/^icons\/[a-z0-9._-]+\.svg$/i.test(v))return v;
  if(/^assets\/beneficios\/uploads\/[a-z0-9._-]+\.(?:svg|png|jpe?g|webp)$/i.test(v))return v;
  return fallback;
}
function safeFeatureLink(value){
  const v=cleanText(value,500);
  if(!v)return '#';
  if(/^https?:\/\//i.test(v))return v;
  if(/^[a-z0-9._~!$&'()*+,;=:@%/?#-]+$/i.test(v)&&!/^javascript:/i.test(v))return v;
  return '#';
}
function sanitizeFeatureTextStyle(raw={},fallback={}){
  const fontFamily=FONT_FAMILIES.includes(raw.fontFamily)?raw.fontFamily:(FONT_FAMILIES.includes(fallback.fontFamily)?fallback.fontFamily:'Helvetica Neue');
  const align=['left','center','right'].includes(raw.textAlign)?raw.textAlign:(fallback.textAlign||'left');
  return {
    fontFamily,
    fontWeight:[100,200,300,400,500,600,700,800,900].includes(Number(raw.fontWeight))?Number(raw.fontWeight):Number(fallback.fontWeight)||400,
    italic:raw.italic===true,
    color:color(raw.color,fallback.color||'#111111'),
    fontSize:num(raw.fontSize,8,96,Number(fallback.fontSize)||32),
    mobileFontSize:num(raw.mobileFontSize,8,64,Number(fallback.mobileFontSize)||24),
    letterSpacing:num(raw.letterSpacing,-8,20,Number(fallback.letterSpacing)||0),
    textAlign:align,
    offsetX:num(raw.offsetX,-250,250,Number(fallback.offsetX)||0),
    offsetY:num(raw.offsetY,-250,250,Number(fallback.offsetY)||0),
    mobileOffsetX:num(raw.mobileOffsetX,-160,160,Number(fallback.mobileOffsetX)||0),
    mobileOffsetY:num(raw.mobileOffsetY,-160,160,Number(fallback.mobileOffsetY)||0)
  };
}
function sanitizeHeroFeatureBlock(raw={}){
  const f=DEFAULT_HERO_FEATURE_BLOCK;
  const buttonRaw=raw.button||{};
  return {
    enabled:raw.enabled!==false,
    image:safeImage(raw.image)||f.image,
    imageSide:raw.imageSide==='right'?'right':'left',
    imagePositionX:num(raw.imagePositionX,0,100,f.imagePositionX),
    imagePositionY:num(raw.imagePositionY,0,100,f.imagePositionY),
    imageWidth:num(raw.imageWidth,35,65,f.imageWidth),
    backgroundColor:color(raw.backgroundColor,f.backgroundColor),
    minHeight:num(raw.minHeight,260,620,f.minHeight),
    mobileImageHeight:num(raw.mobileImageHeight,150,420,f.mobileImageHeight),
    title:cleanText(raw.title??f.title,300),
    subtitle:cleanText(raw.subtitle??f.subtitle,300),
    titleStyle:sanitizeFeatureTextStyle(raw.titleStyle,f.titleStyle),
    subtitleStyle:sanitizeFeatureTextStyle(raw.subtitleStyle,f.subtitleStyle),
    button:{
      enabled:buttonRaw.enabled!==false,
      text:cleanText(buttonRaw.text??f.button.text,120),
      href:safeFeatureLink(buttonRaw.href??f.button.href),
      backgroundColor:color(buttonRaw.backgroundColor,f.button.backgroundColor),
      color:color(buttonRaw.color,f.button.color),
      borderColor:color(buttonRaw.borderColor,f.button.borderColor),
      borderWidth:num(buttonRaw.borderWidth,0,8,f.button.borderWidth),
      borderRadius:num(buttonRaw.borderRadius,0,80,f.button.borderRadius),
      fontFamily:FONT_FAMILIES.includes(buttonRaw.fontFamily)?buttonRaw.fontFamily:f.button.fontFamily,
      fontWeight:[100,200,300,400,500,600,700,800,900].includes(Number(buttonRaw.fontWeight))?Number(buttonRaw.fontWeight):f.button.fontWeight,
      italic:buttonRaw.italic===true,
      fontSize:num(buttonRaw.fontSize,8,42,f.button.fontSize),
      mobileFontSize:num(buttonRaw.mobileFontSize,8,36,f.button.mobileFontSize),
      textAlign:['left','center','right'].includes(buttonRaw.textAlign)?buttonRaw.textAlign:f.button.textAlign,
      width:num(buttonRaw.width,100,520,f.button.width),
      height:num(buttonRaw.height,32,90,f.button.height)
    }
  };
}
function sanitizeHomeFeatureBlock(raw={}){
  const f=DEFAULT_HOME_FEATURE_BLOCK;
  const buttonRaw=raw.button||{};
  return {
    enabled:raw.enabled===true,
    image:safeImage(raw.image),
    imageSide:raw.imageSide==='left'?'left':'right',
    imagePositionX:num(raw.imagePositionX,0,100,50),
    imagePositionY:num(raw.imagePositionY,0,100,50),
    imageWidth:num(raw.imageWidth,30,75,58),
    backgroundColor:color(raw.backgroundColor,f.backgroundColor),
    minHeight:num(raw.minHeight,280,900,f.minHeight),
    mobileImageHeight:num(raw.mobileImageHeight,160,650,f.mobileImageHeight),
    contentOffsetX:num(raw.contentOffsetX,-250,250,0),
    contentOffsetY:num(raw.contentOffsetY,-250,250,0),
    mobileContentOffsetX:num(raw.mobileContentOffsetX,-160,160,0),
    mobileContentOffsetY:num(raw.mobileContentOffsetY,-160,160,0),
    title:cleanText(raw.title??f.title,500),
    subtitle:cleanText(raw.subtitle??f.subtitle,500),
    titleStyle:sanitizeFeatureTextStyle(raw.titleStyle,f.titleStyle),
    subtitleStyle:sanitizeFeatureTextStyle(raw.subtitleStyle,f.subtitleStyle),
    button:{
      enabled:buttonRaw.enabled!==false,
      text:cleanText(buttonRaw.text??f.button.text,120),
      href:safeFeatureLink(buttonRaw.href??f.button.href),
      backgroundColor:color(buttonRaw.backgroundColor,f.button.backgroundColor),
      color:color(buttonRaw.color,f.button.color),
      borderColor:color(buttonRaw.borderColor,f.button.borderColor),
      borderWidth:num(buttonRaw.borderWidth,0,8,f.button.borderWidth),
      borderRadius:num(buttonRaw.borderRadius,0,80,f.button.borderRadius),
      fontFamily:FONT_FAMILIES.includes(buttonRaw.fontFamily)?buttonRaw.fontFamily:f.button.fontFamily,
      fontWeight:[100,200,300,400,500,600,700,800,900].includes(Number(buttonRaw.fontWeight))?Number(buttonRaw.fontWeight):f.button.fontWeight,
      italic:buttonRaw.italic===true,
      fontSize:num(buttonRaw.fontSize,8,42,f.button.fontSize),
      mobileFontSize:num(buttonRaw.mobileFontSize,8,36,f.button.mobileFontSize),
      textAlign:['left','center','right'].includes(buttonRaw.textAlign)?buttonRaw.textAlign:f.button.textAlign,
      width:num(buttonRaw.width,90,420,f.button.width),
      height:num(buttonRaw.height,32,90,f.button.height),
      offsetX:num(buttonRaw.offsetX,-250,250,0),
      offsetY:num(buttonRaw.offsetY,-250,250,0),
      mobileOffsetX:num(buttonRaw.mobileOffsetX,-160,160,0),
      mobileOffsetY:num(buttonRaw.mobileOffsetY,-160,160,0)
    }
  };
}
function sanitizeCatalogStyle(raw={}){
  const f=DEFAULT_CATALOG_STYLE;
  const tr=raw.title||{};
  return {
    backgroundColor:color(raw.backgroundColor,f.backgroundColor),
    productNameColor:color(raw.productNameColor,f.productNameColor),
    productPriceColor:color(raw.productPriceColor,f.productPriceColor),
    title:{
      visible:tr.visible!==false,
      text:cleanText(tr.text??f.title.text,180),
      fontFamily:FONT_FAMILIES.includes(tr.fontFamily)?tr.fontFamily:f.title.fontFamily,
      fontWeight:[100,200,300,400,500,600,700,800,900].includes(Number(tr.fontWeight))?Number(tr.fontWeight):f.title.fontWeight,
      italic:tr.italic===true,
      color:color(tr.color,f.title.color),
      backgroundColor:color(tr.backgroundColor,f.title.backgroundColor),
      fontSize:num(tr.fontSize,8,72,f.title.fontSize),
      mobileFontSize:num(tr.mobileFontSize,8,52,f.title.mobileFontSize),
      letterSpacing:num(tr.letterSpacing,-8,20,f.title.letterSpacing),
      textAlign:['left','center','right'].includes(tr.textAlign)?tr.textAlign:f.title.textAlign,
      textTransform:['none','uppercase','lowercase','capitalize'].includes(tr.textTransform)?tr.textTransform:f.title.textTransform,
      paddingX:num(tr.paddingX,0,80,f.title.paddingX),
      paddingY:num(tr.paddingY,0,40,f.title.paddingY),
      borderColor:color(tr.borderColor,f.title.borderColor),
      borderWidth:num(tr.borderWidth,0,8,f.title.borderWidth),
      borderRadius:num(tr.borderRadius,0,80,f.title.borderRadius),
      marginTop:num(tr.marginTop,0,140,f.title.marginTop),
      marginBottom:num(tr.marginBottom,0,140,f.title.marginBottom)
    }
  };
}
function sanitizeBenefitTextStyle(raw={},fallback={}){
  const fontFamily=FONT_FAMILIES.includes(raw.fontFamily)?raw.fontFamily:(FONT_FAMILIES.includes(fallback.fontFamily)?fallback.fontFamily:'Helvetica Neue');
  return {
    fontFamily,
    fontWeight:[100,200,300,400,500,600,700,800,900].includes(Number(raw.fontWeight))?Number(raw.fontWeight):Number(fallback.fontWeight)||400,
    italic:raw.italic===true,
    color:color(raw.color,fallback.color||'#282828'),
    fontSize:num(raw.fontSize,8,48,Number(fallback.fontSize)||16),
    mobileFontSize:num(raw.mobileFontSize,8,36,Number(fallback.mobileFontSize)||12)
  };
}
function sanitizeBenefitsBand(raw={}){
  const source=Array.isArray(raw.items)?raw.items:[];
  const items=DEFAULT_BENEFITS_BAND.items.map((fallback,index)=>{
    const item=source[index]||{};
    return {
      icon:safeBenefitIcon(item.icon,fallback.icon),
      title:cleanText(item.title??fallback.title,120),
      subtitle:cleanText(item.subtitle??fallback.subtitle,220),
      titleStyle:sanitizeBenefitTextStyle(item.titleStyle,fallback.titleStyle),
      subtitleStyle:sanitizeBenefitTextStyle(item.subtitleStyle,fallback.subtitleStyle),
      textOffsetX:num(item.textOffsetX,-150,150,0),
      textOffsetY:num(item.textOffsetY,-150,150,0),
      mobileTextOffsetX:num(item.mobileTextOffsetX,-120,120,0),
      mobileTextOffsetY:num(item.mobileTextOffsetY,-120,120,0),
      subtitleOffsetX:num(item.subtitleOffsetX,-150,150,0),
      subtitleOffsetY:num(item.subtitleOffsetY,-150,150,0),
      mobileSubtitleOffsetX:num(item.mobileSubtitleOffsetX,-120,120,0),
      mobileSubtitleOffsetY:num(item.mobileSubtitleOffsetY,-120,120,0)
    };
  });
  return {backgroundColor:color(raw.backgroundColor,DEFAULT_BENEFITS_BAND.backgroundColor),items};
}
function smartMobileSize(fontSize){
  return Math.round(Math.min(32,Math.max(10,Number(fontSize||32)*0.42)));
}
function sanitizeBlock(raw={},index=0){
  const desktopSize=num(raw.fontSize,8,140,32);
  return {
    id:cleanText(raw.id,80)||`text-${Date.now()}-${index}`,
    text:cleanText(raw.text,800),
    x:num(raw.x,0,100,50),y:num(raw.y,0,100,50),
    mobileX:num(raw.mobileX,0,100,num(raw.x,0,100,50)),
    mobileY:num(raw.mobileY,0,100,num(raw.y,0,100,50)),
    fontFamily:FONT_FAMILIES.includes(raw.fontFamily)?raw.fontFamily:'Montserrat',
    fontSize:desktopSize,
    mobileFontSize:num(raw.mobileFontSize,8,72,smartMobileSize(desktopSize)),
    fontWeight:[100,200,300,400,500,600,700,800,900].includes(Number(raw.fontWeight))?Number(raw.fontWeight):700,
    italic:!!raw.italic,
    color:color(raw.color,'#050505'),backgroundColor:color(raw.backgroundColor,'transparent'),
    paddingX:num(raw.paddingX,0,60,0),paddingY:num(raw.paddingY,0,30,0),
    letterSpacing:num(raw.letterSpacing,-10,20,0),visible:raw.visible!==false
  };
}
function sanitizeSlide(raw={},index=0){
  const blocks=(Array.isArray(raw.blocks)?raw.blocks:[]).slice(0,10).map(sanitizeBlock);
  const video=safeVideo(raw.video);
  const mediaType=raw.mediaType==='video'&&video?'video':'image';
  return {
    id:cleanText(raw.id,80)||`slide-${Date.now()}-${index}-${crypto.randomBytes(3).toString('hex')}`,
    mediaType,
    image:safeImage(raw.image)||DEFAULT.slides[0].image,
    video,
    imagePositionX:num(raw.imagePositionX,0,100,50),imagePositionY:num(raw.imagePositionY,0,100,50),
    overlayOpacity:num(raw.overlayOpacity,0,0.8,0.18),
    blocks:blocks.length?blocks:DEFAULT_BLOCKS.map(b=>({...b,id:`${b.id}-${index}`}))
  };
}
function sanitizeFooterPhone(value){
  const raw=cleanText(value,40);
  const allowed=raw.replace(/[^0-9+()\-\s]/g,'').trim();
  return allowed||DEFAULT_FOOTER_SETTINGS.phone;
}
function sanitizeFooterUrl(value,fallback){
  let raw=cleanText(value,300);
  if(!raw)return fallback;
  if(!/^https?:\/\//i.test(raw))raw=`https://${raw.replace(/^\/+/, '')}`;
  try{
    const parsed=new URL(raw);
    if(!['http:','https:'].includes(parsed.protocol))return fallback;
    return parsed.toString().replace(/\/$/,'');
  }catch{return fallback}
}
function sanitizeFooterSettings(raw={}){
  return {
    phone:sanitizeFooterPhone(raw.phone),
    facebookUrl:sanitizeFooterUrl(raw.facebookUrl,DEFAULT_FOOTER_SETTINGS.facebookUrl),
    instagramUrl:sanitizeFooterUrl(raw.instagramUrl,DEFAULT_FOOTER_SETTINGS.instagramUrl)
  };
}
function sanitize(raw={}){
  const legacy=!raw.responsiveTextV2;
  const slides=(Array.isArray(raw.slides)?raw.slides:[]).slice(0,6).map(sanitizeSlide);
  return {
    autoplaySeconds:num(raw.autoplaySeconds,0,15,0),
    autoplayDirection:['next','previous'].includes(raw.autoplayDirection)?raw.autoplayDirection:'next',
    showArrows:raw.showArrows!==false,
    showDots:raw.showDots!==false,
    arrowSize:num(raw.arrowSize,18,90,46),
    arrowSizeMobile:num(raw.arrowSizeMobile,18,70,34),
    arrowWeight:num(raw.arrowWeight,100,500,200),
    arrowColor:color(raw.arrowColor,'#ffffff'),
    arrowOpacity:num(raw.arrowOpacity,0.15,1,0.92),
    transitionType:['slide','fade'].includes(raw.transitionType)?raw.transitionType:'slide',
    transitionDurationMs:num(raw.transitionDurationMs,150,1600,560),
    height:num(raw.height,360,900,635),mobileHeight:num(raw.mobileHeight,320,800,560),
    desktopTextScale:num(raw.desktopTextScale,0.30,1.50,0.65),
    mobileTextScale:legacy?1:num(raw.mobileTextScale,0.30,1.50,1),
    responsiveTextV2:true,
    promoRibbonEnabled:raw.promoRibbonEnabled!==false,
    promoRibbonText:cleanText(raw.promoRibbonText ?? DEFAULT.promoRibbonText, 300),
    promoRibbonDuration:num(raw.promoRibbonDuration,8,60,26),
    promoRibbonBackgroundColor:color(raw.promoRibbonBackgroundColor,'#0f0f0f'),
    promoRibbonTextColor:color(raw.promoRibbonTextColor,'#ffffff'),
    promoRibbonFontSize:num(raw.promoRibbonFontSize,10,40,15),
    promoRibbonSpacing:num(raw.promoRibbonSpacing,4,80,26),
    promoRibbonSeparator:cleanText(raw.promoRibbonSeparator ?? DEFAULT.promoRibbonSeparator, 12) || '✦',
    promoRibbonSeparatorIcon:safeRibbonIcon(raw.promoRibbonSeparatorIcon ?? DEFAULT.promoRibbonSeparatorIcon),
    promoRibbonSeparatorIconSize:num(raw.promoRibbonSeparatorIconSize,10,60,22),
    promoRibbonPages:promoRibbonPages(raw.promoRibbonPages),
    footerSettings:sanitizeFooterSettings(raw.footerSettings||DEFAULT_FOOTER_SETTINGS),
    benefitsBand:sanitizeBenefitsBand(raw.benefitsBand||DEFAULT_BENEFITS_BAND),
    heroFeatureBlock:sanitizeHeroFeatureBlock(raw.heroFeatureBlock||DEFAULT_HERO_FEATURE_BLOCK),
    homeFeatureBlock:sanitizeHomeFeatureBlock(raw.homeFeatureBlock||DEFAULT_HOME_FEATURE_BLOCK),
    catalogStyle:sanitizeCatalogStyle(raw.catalogStyle||DEFAULT_CATALOG_STYLE),
    slides:slides.length?slides:[sanitizeSlide(DEFAULT.slides[0],0)]
  };
}
function getHomepage(){ensure();try{return sanitize(JSON.parse(fs.readFileSync(file,'utf8')))}catch{return sanitize(DEFAULT)}}
function saveHomepage(raw){const next=sanitize(raw);ensure();fs.writeFileSync(file,JSON.stringify(next,null,2)+'\n','utf8');return next}
module.exports={getHomepage,saveHomepage,FONT_FAMILIES};
