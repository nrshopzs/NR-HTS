let PRODUCTS = [{"id":"the-kids-want-acid","name":"The Kids Want Acid - T-Shirt","price":"220.00","img":"assets/productos/the-kids-want-acid-negro.png","category":"all","colors":["Negro","Gris","Blanco"],"sizes":["CH","M","G","XG"],"description":"Playera unisex de manga corta, corte Regular Fit y cuello redondo. Estampado frontal en serigrafía con tinta base agua. Confeccionada en tela 100% algodón peinado.","variantImages":{"Negro":"assets/productos/the-kids-want-acid-negro.png","Gris":"assets/productos/the-kids-want-acid-gris.png","Blanco":"assets/productos/the-kids-want-acid-blanco.png"},"inventory":{"Negro":{"CH":10,"M":10,"G":10,"XG":10},"Gris":{"CH":10,"M":10,"G":10,"XG":0},"Blanco":{"CH":10,"M":10,"G":10,"XG":10}}},{"id":"santos-cogollos","name":"Santos Cogollos - T-Shirt","price":"145.00","img":"assets/productos/santos-cogollos-blanco.png","category":"all","colors":["Blanco"],"sizes":["CH","M","G","XG"],"description":"Playera unisex de manga corta, corte Regular Fit y cuello redondo. Estampado frontal en serigrafía con tinta base agua. Confeccionada en tela 100% algodón peinado.","variantImages":{"Blanco":"assets/productos/santos-cogollos-blanco.png"},"inventory":{"Blanco":{"CH":10,"M":10,"G":10,"XG":10}}},{"id":"make-us-worthy","name":"Make Us Worthy - T-Shirt","price":"149.00","img":"assets/productos/make-us-worthy-negro.png","category":"all","colors":["Negro","Blanco","Gris"],"sizes":["CH","M","G","XG"],"description":"Playera unisex de manga corta, corte Regular Fit y cuello redondo. Estampado frontal en serigrafía con tinta base agua. Confeccionada en tela 100% algodón peinado.","variantImages":{"Negro":"assets/productos/make-us-worthy-negro.png","Blanco":"assets/productos/make-us-worthy-blanco.png","Gris":"assets/productos/make-us-worthy-gris.png"},"inventory":{"Negro":{"CH":10,"M":10,"G":10,"XG":10},"Blanco":{"CH":10,"M":10,"G":10,"XG":10},"Gris":{"CH":10,"M":10,"G":10,"XG":10}}},{"id":"bad-boy","name":"Bad Boy - T-Shirt","price":"149.00","img":"assets/productos/bad-boy-negro.png","category":"all","colors":["Negro"],"sizes":["CH","M","G","XG"],"description":"Playera unisex de manga corta, corte Regular Fit y cuello redondo. Estampado frontal en serigrafía con tinta base agua. Confeccionada en tela 100% algodón peinado.","variantImages":{"Negro":"assets/productos/bad-boy-negro.png"},"inventory":{"Negro":{"CH":10,"M":10,"G":10,"XG":10}}},{"id":"die-hight","name":"Die Hight - T-Shirt","price":"149.00","img":"assets/productos/die-hight-blanco.png","category":"all","colors":["Blanco"],"sizes":["CH","M","G","XG"],"description":"Playera unisex de manga corta, corte Regular Fit y cuello redondo. Estampado frontal en serigrafía con tinta base agua. Confeccionada en tela 100% algodón peinado.","variantImages":{"Blanco":"assets/productos/die-hight-blanco.png"},"inventory":{"Blanco":{"CH":10,"M":10,"G":10,"XG":10}}},{"id":"sightless","name":"Sightless - T-Shirt","price":"149.00","img":"assets/productos/sightless-negro.png","category":"all","colors":["Negro"],"sizes":["CH","M","G","XG"],"description":"Playera unisex de manga corta, corte Regular Fit y cuello redondo. Estampado frontal en serigrafía con tinta base agua. Confeccionada en tela 100% algodón peinado.","variantImages":{"Negro":"assets/productos/sightless-negro.png"},"inventory":{"Negro":{"CH":10,"M":10,"G":10,"XG":10}}},{"id":"we-out-here","name":"We Out Here - T-Shirt","price":"159.00","img":"assets/productos/we-out-here-blanco.png","category":"all","colors":["Blanco"],"sizes":["CH","M","G","XG"],"description":"Playera unisex de manga corta, corte Regular Fit y cuello redondo. Estampado frontal en serigrafía con tinta base agua. Confeccionada en tela 100% algodón peinado.","variantImages":{"Blanco":"assets/productos/we-out-here-blanco.png"},"inventory":{"Blanco":{"CH":0,"M":0,"G":0,"XG":0}}},{"id":"halloween-is-over-just-chill","name":"Halloween is Over Just Chill - T-Shirt","price":"169.00","img":"assets/productos/halloween-is-over-just-chill-negro.png","category":"all","colors":["Negro"],"sizes":["CH","M","G","XG"],"description":"Playera unisex de manga corta, corte Regular Fit y cuello redondo. Estampado frontal en serigrafía con tinta base agua. Confeccionada en tela 100% algodón peinado.","variantImages":{"Negro":"assets/productos/halloween-is-over-just-chill-negro.png"},"inventory":{"Negro":{"CH":10,"M":10,"G":10,"XG":10}}}];
const COLOR_OPTIONS = [
  {name:'Negro', hex:'#1f1f1f'},
  {name:'Blanco', hex:'#f7f7f5', border:true},
  {name:'Gris', hex:'#b9b9b9'},
  {name:'Azul marino', hex:'#26364d'},
  {name:'Morado', hex:'#6d3b8c'},
  {name:'Rojo', hex:'#c73a4f'},
  {name:'Rosa', hex:'#eda9c0'},
  {name:'Azul cielo', hex:'#a9c9ec'},
  {name:'Amarillo', hex:'#e6ad36'},
  {name:'Turquesa', hex:'#8bd0d9'}
];
function getProductColors(p){
  if(!p) return COLOR_OPTIONS;
  if(Array.isArray(p.colors)&&p.colors.length) return p.colors.map(name=>COLOR_OPTIONS.find(c=>c.name===name)||{name,hex:'#c9c9c9',border:true});
  if(/taza|mug/i.test(p.name)) return COLOR_OPTIONS.filter(c=>['Blanco','Negro'].includes(c.name));
  return COLOR_OPTIONS;
}
function getProductSizes(p){
  if(p&&Array.isArray(p.sizes)&&p.sizes.length) return p.sizes;
  return ['CH','M','G','XG'];
}
function getProductImage(p,color=''){
  if(!p) return '';
  if(color&&p.variantImages&&p.variantImages[color]) return p.variantImages[color];
  return p.img||'';
}
function getProductGallery(p,color=''){
  if(!p)return [];
  const preferred=getProductImage(p,color);
  const images=Array.isArray(p.images)&&p.images.length?p.images:[p.img].filter(Boolean);
  return [...new Set([preferred,...images].filter(Boolean))];
}
function getProductHoverGallery(p){
  if(!p)return [];
  const attached=Array.isArray(p.images)?p.images:[];
  const variants=p.variantImages&&typeof p.variantImages==='object'?Object.values(p.variantImages):[];
  return [...new Set([p.img,...attached,...variants].filter(Boolean))];
}
function getVariantStock(p,color,size){
  if(!p||!p.inventory)return Infinity;
  const byColor=p.inventory[color];
  if(!byColor)return 0;
  const stock=Number(byColor[size]);
  return Number.isFinite(stock)?Math.max(0,stock):0;
}
function getColorStock(p,color){return getProductSizes(p).reduce((sum,size)=>{const stock=getVariantStock(p,color,size);return sum+(Number.isFinite(stock)?stock:0)},0)}
function getProductStock(p){return getProductColors(p).reduce((sum,c)=>sum+getColorStock(p,c.name),0)}
function isProductSoldOut(p){return !!(p&&p.inventory&&getProductStock(p)<=0)}
function getCartVariantQty(id,color,size,excludeIndex=-1){return getCart().reduce((sum,item,index)=>sum+(index!==excludeIndex&&item.id===id&&(item.color||'')===color&&(item.size||'')===size?item.qty:0),0)}
function updateSizeSelectForStock(select,p,color){
  if(!select)return;
  const current=select.value;
  const sizes=getProductSizes(p);
  select.innerHTML='<option value="">Selecciona</option>'+sizes.map(size=>{const stock=color?getVariantStock(p,color,size):0;const unavailable=!color||(Number.isFinite(stock)&&stock<=0);return `<option value="${size}" ${unavailable?'disabled':''}>${size}${color&&Number.isFinite(stock)&&stock<=0?' — Agotado':''}</option>`}).join('');
  if(current&&[...select.options].some(o=>o.value===current&&!o.disabled))select.value=current;else select.value='';
}
function clampQtyToStock(input,p,color,size){
  if(!input)return;
  const stock=getVariantStock(p,color,size);
  const max=Number.isFinite(stock)?stock:999;
  input.max=max>0?String(max):'1';
  const value=Math.max(1,parseInt(input.value,10)||1);
  input.value=String(max>0?Math.min(value,max):1);
}
function productRequiresOptions(p){return !!(p&&(Array.isArray(p.colors)||Array.isArray(p.sizes)))}
function renderColorSwatches(colors, selected=''){
  return colors.map(c=>`<button type="button" class="color-swatch ${selected===c.name?'selected':''}" data-color="${c.name}" title="${c.name}" aria-label="${c.name}" style="--swatch:${c.hex};${c.border?'--swatch-border:#bdbdbd;':''}"><span></span></button>`).join('');
}

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const cartKey='nr_cart_v3';
function getCart(){try{const raw=JSON.parse(localStorage.getItem(cartKey)||'[]');const clean=Array.isArray(raw)?raw.filter(item=>PRODUCTS.some(p=>p.id===item.id)):[];if(clean.length!==raw.length)localStorage.setItem(cartKey,JSON.stringify(clean));return clean}catch(e){return[]}}
function setCart(c){localStorage.setItem(cartKey,JSON.stringify(c));renderCartCount();renderDrawer()}
function addToCart(id,qty=1,options={}){const p=PRODUCTS.find(x=>x.id===id);if(!p)return;const amount=Math.max(1,parseInt(qty,10)||1);const color=options.color||'';const size=options.size||'';const stock=getVariantStock(p,color,size);const existing=getCartVariantQty(id,color,size);if(Number.isFinite(stock)){const available=Math.max(0,stock-existing);if(available<=0){alert('Esta variante está agotada.');return false}if(amount>available){alert(`Solo quedan ${available} pieza${available===1?'':'s'} disponibles de esta variante.`);return false}}const c=getCart();const found=c.find(x=>x.id===id&&(x.color||'')===color&&(x.size||'')===size);if(found)found.qty+=amount;else c.push({id,qty:amount,color,size});setCart(c);if(options.openDrawer!==false)openCart();return true}
function renderCartCount(){const n=getCart().reduce((a,b)=>a+b.qty,0);$$('[data-cart-count]').forEach(x=>x.textContent=n)}
function header(active=''){return `<header class="site-header" id="site-header"><a class="brand" href="index.html"><img class="brand-desktop" src="assets/logo-ninos-rancios.svg" alt="Niños Rancios"><img class="brand-mobile" src="assets/logo-ninos-rancios.svg" alt="Niños Rancios"></a><nav class="main-nav"><a class="${active==='home'?'active':''}" href="index.html">Inicio</a><div class="shop-menu"><a class="${['shop','woman','men'].includes(active)?'active':''}" href="shop-all.html">Tienda</a><div class="shop-sub"><a href="woman.html">Mujer</a><a href="men.html">Hombre</a></div></div><a class="${active==='about'?'active':''}" href="about-us.html">Nosotros</a><a class="${active==='contact'?'active':''}" href="contact.html">Contacto</a><button class="currency">MXN ($)⌄</button></nav><div class="account-cart"><div class="header-account-group" data-customer-menu><a href="#" class="header-account-trigger" data-login>Iniciar sesión</a><button type="button" class="header-account-toggle" data-account-toggle aria-label="Abrir menú de cuenta" aria-expanded="false" hidden>⌄</button><div class="header-account-dropdown" data-account-dropdown hidden><a href="account.html#summary">Perfil</a><a href="account.html#orders">Mis Pedidos</a><a href="account.html#favorites">Mis Favoritos</a><button type="button" data-account-logout>Cerrar Sesión</button></div></div><a href="cart.html" class="cart-link">Carrito (<span data-cart-count>0</span>)</a></div><button class="mobile-currency" type="button" aria-label="Moneda">MXN⌄</button><button class="menu-toggle" id="menu-toggle" aria-label="Abrir menú" aria-controls="mobile-menu" aria-expanded="false">☰</button></header><div class="mobile-menu" id="mobile-menu" aria-hidden="true"><a class="mobile-login" href="#" data-login>Iniciar sesión</a><button class="mobile-menu-close" id="mobile-menu-close" type="button" aria-label="Cerrar menú"></button><nav class="mobile-nav" aria-label="Navegación móvil"><a class="${active==='home'?'active':''}" href="index.html">Inicio</a><div class="mobile-shop-block"><div class="mobile-shop-row"><button class="mobile-shop-toggle" id="mobile-shop-toggle" type="button" aria-label="Mostrar categorías de tienda" aria-expanded="false"></button><a class="${['shop','woman','men'].includes(active)?'active':''}" href="shop-all.html">Tienda</a></div><div class="mobile-shop-sub" id="mobile-shop-sub"><a href="woman.html">Mujer</a><a href="men.html">Hombre</a></div></div><a class="${active==='about'?'active':''}" href="about-us.html">Nosotros</a><a class="${active==='contact'?'active':''}" href="contact.html">Contacto</a></nav></div>`}
const DEFAULT_PROMO_RIBBON_PAGES=['index.html','shop-all.html','woman.html','men.html','product.html','about-us.html','contact.html','privacy.html','returns.html','shipping.html','stockists.html','partners.html','jobs.html','offers.html','account.html'];
function safePromoText(value){return String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]||m)).trim()}
function buildPromoRibbonGroup(text,separator='✦',separatorIcon='',iconSize=22){
  const clean=safePromoText(text);if(!clean)return '';
  const cleanSeparator=safePromoText(separator||'✦')||'✦';
  const safeIcon=safePromoText(separatorIcon||'');
  const separatorHtml=safeIcon
    ? `<img class="promo-ribbon-separator-icon" src="${safeIcon}" alt="" aria-hidden="true" style="--promo-icon-size:${Math.max(10,Number(iconSize)||22)}px">`
    : `<span class="promo-ribbon-separator" aria-hidden="true">${cleanSeparator}</span>`;
  const item=`<span class="promo-ribbon-item">${clean}${separatorHtml}</span>`;
  return Array(8).fill(item).join('');
}
function currentPageFile(){const raw=(location.pathname.split('/').pop()||'index.html').split('?')[0].trim().toLowerCase();return raw||'index.html'}
function normalizePromoRibbonPages(value){const source=Array.isArray(value)?value:(Array.isArray(DEFAULT_HOMEPAGE?.promoRibbonPages)?DEFAULT_HOMEPAGE.promoRibbonPages:DEFAULT_PROMO_RIBBON_PAGES);return [...new Set(source.map(v=>String(v||'').trim().toLowerCase()).filter(Boolean))]}
function promoRibbonAllowedOnPage(settings){const current=currentPageFile();const pages=normalizePromoRibbonPages(settings?.promoRibbonPages);return pages.includes(current)}
function normalizeBenefitTextStyle(raw={},defaults={}){
  return {
    fontFamily:String(raw.fontFamily||defaults.fontFamily||'Helvetica Neue'),
    fontWeight:Number(raw.fontWeight)||Number(defaults.fontWeight)||400,
    italic:raw.italic===true,
    color:String(raw.color||defaults.color||'#282828'),
    fontSize:Number(raw.fontSize)||Number(defaults.fontSize)||16,
    mobileFontSize:Number(raw.mobileFontSize)||Number(defaults.mobileFontSize)||12
  };
}
const DEFAULT_BENEFITS_BAND={
  backgroundColor:'#b9df4b',
  items:[
    {icon:'icons/shipping-icon.svg',title:'PAGO SEGURO EN LÍNEA',subtitle:'Cifrado SSL · Compra 100% segura',titleStyle:{fontFamily:'Helvetica Neue',fontWeight:500,italic:false,color:'#282828',fontSize:17,mobileFontSize:13},subtitleStyle:{fontFamily:'Helvetica Neue',fontWeight:400,italic:false,color:'#4b5735',fontSize:13,mobileFontSize:10},textOffsetX:0,textOffsetY:0,mobileTextOffsetX:0,mobileTextOffsetY:0,subtitleOffsetX:0,subtitleOffsetY:0,mobileSubtitleOffsetX:0,mobileSubtitleOffsetY:0},
    {icon:'icons/support-icon.svg',title:'ATENCIÓN RÁPIDA',subtitle:'Estamos aquí para ayudarte',titleStyle:{fontFamily:'Helvetica Neue',fontWeight:500,italic:false,color:'#282828',fontSize:17,mobileFontSize:13},subtitleStyle:{fontFamily:'Helvetica Neue',fontWeight:400,italic:false,color:'#4b5735',fontSize:13,mobileFontSize:10},textOffsetX:0,textOffsetY:0,mobileTextOffsetX:0,mobileTextOffsetY:0,subtitleOffsetX:0,subtitleOffsetY:0,mobileSubtitleOffsetX:0,mobileSubtitleOffsetY:0},
    {icon:'icons/tarjeta-icon.svg',title:'ENVÍOS RÁPIDOS',subtitle:'Envíos rápidos y seguros',titleStyle:{fontFamily:'Helvetica Neue',fontWeight:500,italic:false,color:'#282828',fontSize:17,mobileFontSize:13},subtitleStyle:{fontFamily:'Helvetica Neue',fontWeight:400,italic:false,color:'#4b5735',fontSize:13,mobileFontSize:10},textOffsetX:0,textOffsetY:0,mobileTextOffsetX:0,mobileTextOffsetY:0,subtitleOffsetX:0,subtitleOffsetY:0,mobileSubtitleOffsetX:0,mobileSubtitleOffsetY:0}
  ]
};
const DEFAULT_HERO_FEATURE_BLOCK={enabled:true,image:'https://static.wixstatic.com/media/11062b_2ffe9bf7695a4ef6abb5b61acdf992f9~mv2.jpg/v1/fill/w_985,h_657,al_c,q_85,usm_0.66_1.00_0.01/11062b_2ffe9bf7695a4ef6abb5b61acdf992f9~mv2.jpg',imageSide:'left',imagePositionX:50,imagePositionY:50,imageWidth:50,backgroundColor:'#ffffff',minHeight:360,mobileImageHeight:220,title:'Ponte rancio con Niños Rancios',subtitle:'Ropa con actitud. Sin filtros.',titleStyle:{fontFamily:'Helvetica Neue',fontWeight:400,italic:false,color:'#1f1e1c',fontSize:30,mobileFontSize:24,letterSpacing:0,textAlign:'left'},subtitleStyle:{fontFamily:'Helvetica Neue',fontWeight:400,italic:false,color:'#333333',fontSize:18,mobileFontSize:16,letterSpacing:0,textAlign:'left'},button:{enabled:true,text:'Acerca de Nosotros',href:'about-us.html',backgroundColor:'transparent',color:'#1f1e1c',borderColor:'#d7d1c8',borderWidth:1,borderRadius:0,fontFamily:'Helvetica Neue',fontWeight:400,italic:false,fontSize:16,mobileFontSize:15,textAlign:'center',width:280,height:48}};
const DEFAULT_HOME_FEATURE_BLOCK={enabled:false,image:'',imageSide:'right',imagePositionX:50,imagePositionY:50,imageWidth:58,backgroundColor:'#f4f2ed',minHeight:430,mobileImageHeight:250,contentOffsetX:0,contentOffsetY:0,mobileContentOffsetX:0,mobileContentOffsetY:0,title:'OBEDECE\nO QUÉDATE FUERA',subtitle:'Edición Limitada',titleStyle:{fontFamily:'Arial Black',fontWeight:900,italic:false,color:'#111111',fontSize:42,mobileFontSize:30,letterSpacing:0,textAlign:'left',offsetX:0,offsetY:0,mobileOffsetX:0,mobileOffsetY:0},subtitleStyle:{fontFamily:'Helvetica Neue',fontWeight:700,italic:true,color:'#222222',fontSize:18,mobileFontSize:15,letterSpacing:0,textAlign:'left',offsetX:0,offsetY:0,mobileOffsetX:0,mobileOffsetY:0},button:{enabled:true,text:'👉 Comprar Ahora',href:'shop-all.html',backgroundColor:'transparent',color:'#1f1e1c',borderColor:'#1f1e1c',borderWidth:0,borderRadius:0,fontFamily:'Helvetica Neue',fontWeight:400,italic:false,fontSize:17,mobileFontSize:16,textAlign:'left',width:190,height:46,offsetX:0,offsetY:0,mobileOffsetX:0,mobileOffsetY:0}};
function normalizedBenefitsBand(settings){
  const raw=settings?.benefitsBand||DEFAULT_BENEFITS_BAND;
  const source=Array.isArray(raw.items)?raw.items:DEFAULT_BENEFITS_BAND.items;
  const items=DEFAULT_BENEFITS_BAND.items.map((fallback,index)=>{
    const item=source[index]||{};
    return {
      icon:String(item.icon||fallback.icon),
      title:String(item.title??fallback.title),
      subtitle:String(item.subtitle??fallback.subtitle),
      titleStyle:normalizeBenefitTextStyle(item.titleStyle,fallback.titleStyle),
      subtitleStyle:normalizeBenefitTextStyle(item.subtitleStyle,fallback.subtitleStyle),
      textOffsetX:Math.max(-150,Math.min(150,Number(item.textOffsetX)||0)),
      textOffsetY:Math.max(-150,Math.min(150,Number(item.textOffsetY)||0)),
      mobileTextOffsetX:Math.max(-120,Math.min(120,Number(item.mobileTextOffsetX)||0)),
      mobileTextOffsetY:Math.max(-120,Math.min(120,Number(item.mobileTextOffsetY)||0)),
      subtitleOffsetX:Math.max(-150,Math.min(150,Number(item.subtitleOffsetX)||0)),
      subtitleOffsetY:Math.max(-150,Math.min(150,Number(item.subtitleOffsetY)||0)),
      mobileSubtitleOffsetX:Math.max(-120,Math.min(120,Number(item.mobileSubtitleOffsetX)||0)),
      mobileSubtitleOffsetY:Math.max(-120,Math.min(120,Number(item.mobileSubtitleOffsetY)||0))
    };
  });
  return {backgroundColor:String(raw.backgroundColor||DEFAULT_BENEFITS_BAND.backgroundColor),items};
}
function benefitTextStyle(style,type){
  const desktop=type==='title'?17:13,mobile=type==='title'?13:10;
  const family=heroFontStack(style?.fontFamily||'Helvetica Neue');
  const weight=Math.max(100,Math.min(900,Number(style?.fontWeight)||400));
  const color=String(style?.color|| (type==='title'?'#282828':'#4b5735'));
  const desktopSize=Math.max(8,Math.min(48,Number(style?.fontSize)||desktop));
  const mobileSize=Math.max(8,Math.min(36,Number(style?.mobileFontSize)||mobile));
  return `font-family:${family};font-weight:${weight};font-style:${style?.italic?'italic':'normal'};color:${color};--benefit-${type}-size:${desktopSize}px;--benefit-${type}-size-mobile:${mobileSize}px`;
}
function homeFeatureTextStyle(style){
  const s=style||{};
  return `font-family:${heroFontStack(s.fontFamily||'Helvetica Neue')};font-weight:${Number(s.fontWeight)||400};font-style:${s.italic?'italic':'normal'};color:${s.color||'#111'};text-align:${s.textAlign||'left'};--hf-font:${Number(s.fontSize)||32}px;--hf-font-mobile:${Number(s.mobileFontSize)||24}px;--hf-letter:${Number(s.letterSpacing)||0}px;--hf-x:${Number(s.offsetX)||0}px;--hf-y:${Number(s.offsetY)||0}px;--hf-x-mobile:${Number(s.mobileOffsetX)||0}px;--hf-y-mobile:${Number(s.mobileOffsetY)||0}px`;
}
function heroFeatureTextStyle(style){
  const s=style||{};
  return `font-family:${heroFontStack(s.fontFamily||'Helvetica Neue')};font-weight:${Number(s.fontWeight)||400};font-style:${s.italic?'italic':'normal'};color:${s.color||'#1f1e1c'};text-align:${s.textAlign||'left'};--hhf-font:${Number(s.fontSize)||30}px;--hhf-font-mobile:${Number(s.mobileFontSize)||24}px;--hhf-letter:${Number(s.letterSpacing)||0}px`;
}
function homeHeroFeatureBlockHtml(settings){
  const b=settings?.heroFeatureBlock||DEFAULT_HERO_FEATURE_BLOCK;
  if(b?.enabled===false)return '';
  const img=b.image?`<div class="home-hero-feature-media"><img src="${heroEscape(b.image)}" alt="" loading="eager" style="object-position:${Number(b.imagePositionX)||50}% ${Number(b.imagePositionY)||50}%"></div>`:`<div class="home-hero-feature-media home-hero-feature-media-empty" aria-hidden="true"></div>`;
  const btn=b.button||{};
  const button=btn.enabled!==false&&btn.text?`<a class="home-hero-feature-button" href="${heroEscape(btn.href||'#')}" style="--hhf-btn-bg:${btn.backgroundColor||'transparent'};--hhf-btn-color:${btn.color||'#1f1e1c'};--hhf-btn-border:${btn.borderColor||'#d7d1c8'};--hhf-btn-border-width:${Number(btn.borderWidth)||1}px;--hhf-btn-radius:${Number(btn.borderRadius)||0}px;--hhf-btn-font:${Number(btn.fontSize)||16}px;--hhf-btn-font-mobile:${Number(btn.mobileFontSize)||15}px;--hhf-btn-width:${Number(btn.width)||280}px;--hhf-btn-height:${Number(btn.height)||48}px;font-family:${heroFontStack(btn.fontFamily||'Helvetica Neue')};font-weight:${Number(btn.fontWeight)||400};font-style:${btn.italic?'italic':'normal'};justify-content:${btn.textAlign==='left'?'flex-start':btn.textAlign==='right'?'flex-end':'center'}">${heroEscape(btn.text)}</a>`:'';
  const copy=`<div class="home-hero-feature-copy"><h2 style="${heroFeatureTextStyle(b.titleStyle)}">${heroEscape(b.title||'').split('\n').join('<br>')}</h2><p style="${heroFeatureTextStyle(b.subtitleStyle)}">${heroEscape(b.subtitle||'').split('\n').join('<br>')}</p>${button}</div>`;
  return `<section class="home-hero-feature-block ${b.imageSide==='right'?'image-right':'image-left'}" style="--hhf-bg:${b.backgroundColor||'#ffffff'};--hhf-image-width:${Number(b.imageWidth)||50}%;--hhf-min-height:${Number(b.minHeight)||360}px;--hhf-mobile-image-height:${Number(b.mobileImageHeight)||220}px">${b.imageSide==='right'?copy+img:img+copy}</section>`;
}
function renderHomeHeroFeatureBlock(settings){
  const slot=document.getElementById('home-hero-feature-slot');if(!slot)return;
  slot.innerHTML=homeHeroFeatureBlockHtml(settings);
}
function homeFeatureBlockHtml(settings){
  const b=settings?.homeFeatureBlock||DEFAULT_HOME_FEATURE_BLOCK;
  if(!b?.enabled)return '';
  const img=b.image?`<div class="home-feature-media"><img src="${heroEscape(b.image)}" alt="" loading="lazy" style="object-position:${Number(b.imagePositionX)||50}% ${Number(b.imagePositionY)||50}%"></div>`:`<div class="home-feature-media home-feature-media-empty" aria-hidden="true"></div>`;
  const btn=b.button||{};
  const button=btn.enabled!==false&&btn.text?`<a class="home-feature-button" href="${heroEscape(btn.href||'#')}" style="--hf-btn-bg:${btn.backgroundColor||'transparent'};--hf-btn-color:${btn.color||'#1f1e1c'};--hf-btn-border:${btn.borderColor||'#1f1e1c'};--hf-btn-border-width:${Number(btn.borderWidth)||0}px;--hf-btn-radius:${Number(btn.borderRadius)||0}px;--hf-btn-font:${Number(btn.fontSize)||17}px;--hf-btn-font-mobile:${Number(btn.mobileFontSize)||16}px;--hf-btn-width:${Number(btn.width)||190}px;--hf-btn-height:${Number(btn.height)||46}px;--hf-btn-x:${Number(btn.offsetX)||0}px;--hf-btn-y:${Number(btn.offsetY)||0}px;--hf-btn-x-mobile:${Number(btn.mobileOffsetX)||0}px;--hf-btn-y-mobile:${Number(btn.mobileOffsetY)||0}px;font-family:${heroFontStack(btn.fontFamily||'Helvetica Neue')};font-weight:${Number(btn.fontWeight)||400};font-style:${btn.italic?'italic':'normal'};text-align:${btn.textAlign||'left'};justify-content:${btn.textAlign==='center'?'center':btn.textAlign==='right'?'flex-end':'flex-start'}">${heroEscape(btn.text)}</a>`:'';
  const copy=`<div class="home-feature-copy" style="--hf-copy-x:${Number(b.contentOffsetX)||0}px;--hf-copy-y:${Number(b.contentOffsetY)||0}px;--hf-copy-x-mobile:${Number(b.mobileContentOffsetX)||0}px;--hf-copy-y-mobile:${Number(b.mobileContentOffsetY)||0}px"><h2 style="${homeFeatureTextStyle(b.titleStyle)}">${heroEscape(b.title||'').replace(/\n/g,'<br>')}</h2><p style="${homeFeatureTextStyle(b.subtitleStyle)}">${heroEscape(b.subtitle||'').replace(/\n/g,'<br>')}</p>${button}</div>`;
  const desktopHeight=(Number(b.minHeight)===520?430:(Number(b.minHeight)||430));
  const mobileImageHeight=(Number(b.mobileImageHeight)===320?250:(Number(b.mobileImageHeight)||250));
  return `<section class="home-feature-block ${b.imageSide==='left'?'image-left':'image-right'}" style="--hf-bg:${b.backgroundColor||'#f4f2ed'};--hf-image-width:${Number(b.imageWidth)||58}%;--hf-min-height:${desktopHeight}px;--hf-mobile-image-height:${mobileImageHeight}px">${b.imageSide==='left'?img+copy:copy+img}</section>`;
}
function benefits(){
  const settings=(typeof homepageHeroState!=='undefined'&&homepageHeroState?.settings)?homepageHeroState.settings:DEFAULT_HOMEPAGE;
  const show=settings?.promoRibbonEnabled!==false&&promoRibbonAllowedOnPage(settings);
  const text=String(settings?.promoRibbonText??DEFAULT_HOMEPAGE?.promoRibbonText??'').trim();
  const duration=Math.max(8,Number(settings?.promoRibbonDuration)||26);
  const background=String(settings?.promoRibbonBackgroundColor??DEFAULT_HOMEPAGE?.promoRibbonBackgroundColor??'#0f0f0f').trim()||'#0f0f0f';
  const textColor=String(settings?.promoRibbonTextColor??DEFAULT_HOMEPAGE?.promoRibbonTextColor??'#ffffff').trim()||'#ffffff';
  const separator=String(settings?.promoRibbonSeparator??DEFAULT_HOMEPAGE?.promoRibbonSeparator??'✦').trim()||'✦';
  const separatorIcon=String(settings?.promoRibbonSeparatorIcon??DEFAULT_HOMEPAGE?.promoRibbonSeparatorIcon??'').trim();
  const separatorIconSize=Math.max(10,Number(settings?.promoRibbonSeparatorIconSize)||22);
  const fontSize=Math.max(10,Number(settings?.promoRibbonFontSize)||15);
  const spacing=Math.max(4,Number(settings?.promoRibbonSpacing)||26);
  const ribbon=(show&&text)?`<section class="promo-ribbon" aria-label="Promoción destacada" style="--promo-duration:${duration}s;--promo-bg:${background};--promo-text:${textColor};--promo-font-size:${fontSize}px;--promo-spacing:${spacing}px;"><div class="promo-ribbon-track"><div class="promo-ribbon-group">${buildPromoRibbonGroup(text,separator,separatorIcon,separatorIconSize)}</div><div class="promo-ribbon-group" aria-hidden="true">${buildPromoRibbonGroup(text,separator,separatorIcon,separatorIconSize)}</div></div></section>`:'';
  const band=normalizedBenefitsBand(settings);
  const benefitsHtml=band.items.map((item,index)=>`<article class="benefit"><div class="benefit-icon"><img class="benefit-art" src="${safePromoText(item.icon)}" alt="${safePromoText(item.title)}"></div><div class="benefit-copy" style="--benefit-copy-x:${item.textOffsetX}px;--benefit-copy-y:${item.textOffsetY}px;--benefit-copy-x-mobile:${item.mobileTextOffsetX}px;--benefit-copy-y-mobile:${item.mobileTextOffsetY}px"><h3 style="${benefitTextStyle(item.titleStyle,'title')}">${safePromoText(item.title)}</h3><p style="${benefitTextStyle(item.subtitleStyle,'subtitle')};--benefit-subtitle-x:${item.subtitleOffsetX}px;--benefit-subtitle-y:${item.subtitleOffsetY}px;--benefit-subtitle-x-mobile:${item.mobileSubtitleOffsetX}px;--benefit-subtitle-y-mobile:${item.mobileSubtitleOffsetY}px">${safePromoText(item.subtitle)}</p></div></article>`).join('');
  const feature=(document.getElementById('home-hero'))?homeFeatureBlockHtml(settings):'';
  return `${ribbon}${feature}<section class="benefits" style="--benefits-bg:${safePromoText(band.backgroundColor)}">${benefitsHtml}</section>`;
}
function footer(){return `<footer><div class="footer-columns"><div class="footer-col"><a href="index.html">Inicio</a><a href="about-us.html">Nosotros</a><a href="contact.html">Contacto</a><a href="privacy.html">Aviso de privacidad</a><a data-footer-phone href="tel:+527571541553">☎ 7571541553</a></div><div class="footer-col"><a href="shipping.html">Envíos</a><a href="returns.html">Cambios y devoluciones</a><a href="order-lookup.html">Consultar pedido</a><a href="stockists.html">Puntos de venta</a></div><div class="footer-col"><a data-footer-facebook href="https://facebook.com/ninosrancios" target="_blank" rel="noopener noreferrer">Facebook</a><a data-footer-instagram href="https://instagram.com/ninosrancios" target="_blank" rel="noopener noreferrer">Instagram</a><a href="partners.html">Colaboraciones</a><a href="jobs.html">Empleos</a><a href="offers.html">Promociones</a></div><form class="join newsletter-form" data-newsletter-form><h3>¡ÚNETE!</h3><label for="newsletter-email">Email</label><input id="newsletter-email" name="email" type="email" autocomplete="email" required><input class="newsletter-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><label class="newsletter-consent"><input type="checkbox" name="consent" required><span>Quiero recibir novedades y promociones. Puedo darme de baja en cualquier momento.</span></label><button type="submit">Enviar</button><p class="newsletter-message" data-newsletter-message aria-live="polite"></p></form></div><div class="copyright">©2026 Niños Rancios. Todos los derechos reservados.</div></footer>`}
function card(p,sale=false){const soldOut=isProductSoldOut(p);return `<article class="product-card ${soldOut?'product-sold-out':''}" data-product-hover="${p.id}"><div class="product-image"><a class="product-image-link" href="product.html?id=${encodeURIComponent(p.id)}" aria-label="Ver ${p.name}"><img class="product-hover-image" src="${p.img}" alt="${p.name}" loading="lazy"></a><button class="quick-view-btn" type="button" data-quick="${p.id}">Vista rápida</button></div><a class="product-link" href="product.html?id=${encodeURIComponent(p.id)}"><div class="product-name">${p.name}</div><div class="product-price">${sale?'<span class="sale-old">MX$275.00</span><span class="sale-new">Precio de oferta MX$'+p.price+'</span>':'MX$'+p.price}</div>${soldOut?'<div class="product-stock-label">AGOTADO</div>':''}</a><button class="add-btn" type="button" ${soldOut?'disabled aria-disabled="true"':'data-add="'+p.id+'"'}>${soldOut?'Agotado':'Agregar al carrito'}</button></article>`}
let currentCustomerSession=null;
const NR_PENDING_FAVORITE_KEY='nr_pending_favorite';
const NR_AUTH_RETURN_KEY='nr_auth_return';
function rememberFavoriteAfterLogin(productId){
  try{
    localStorage.setItem(NR_PENDING_FAVORITE_KEY,String(productId||''));
    localStorage.setItem(NR_AUTH_RETURN_KEY,`${location.pathname}${location.search}${location.hash}`);
  }catch{}
}
function clearPendingFavoriteLogin(){try{localStorage.removeItem(NR_PENDING_FAVORITE_KEY);localStorage.removeItem(NR_AUTH_RETURN_KEY)}catch{}}
async function completePendingFavoriteAfterLogin(){
  let productId='',returnPath='';
  try{productId=String(localStorage.getItem(NR_PENDING_FAVORITE_KEY)||'').trim();returnPath=String(localStorage.getItem(NR_AUTH_RETURN_KEY)||'').trim()}catch{}
  if(!productId)return false;
  try{await fetch(`/api/account/favorites/${encodeURIComponent(productId)}`,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}'})}catch{}
  clearPendingFavoriteLogin();
  if(returnPath&&returnPath.startsWith('/')&&!returnPath.startsWith('//')){location.href=returnPath;return true}
  return false;
}
async function hydrateCustomerHeader(){
  try{
    const res=await fetch('/api/account/session',{cache:'no-store',credentials:'same-origin'});
    if(!res.ok)return null;
    const data=await res.json();
    currentCustomerSession=data.authenticated?data.customer:null;
    $$('[data-login]').forEach(link=>{
      if(data.authenticated&&data.customer){
        const first=String(data.customer.nombre||'').trim().split(/\s+/)[0]||'Mi cuenta';
        link.textContent=`Hola, ${first}`;
        link.classList.add('customer-signed-in');
        if(link.closest('[data-customer-menu]')) link.href='#';
        else link.href='account.html';
      }else{
        link.textContent='Iniciar sesión';
        link.href='#';
        link.classList.remove('customer-signed-in');
      }
    });
    setupCustomerMenu();
    bindLoginLinks();
    return currentCustomerSession;
  }catch{
    currentCustomerSession=null;
    setupCustomerMenu();
    bindLoginLinks();
    return null;
  }
}

function closeCustomerMenus(){
  $$('[data-customer-menu]').forEach(group=>{
    group.classList.remove('open');
    const toggle=$('[data-account-toggle]',group);
    if(toggle)toggle.setAttribute('aria-expanded','false');
  });
}
function toggleCustomerMenu(group){
  if(!currentCustomerSession)return;
  const isOpen=group.classList.contains('open');
  closeCustomerMenus();
  const toggle=$('[data-account-toggle]',group);
  if(!isOpen){
    group.classList.add('open');
    if(toggle)toggle.setAttribute('aria-expanded','true');
  }
}
async function logoutCustomerFromHeader(){
  try{
    await fetch('/api/account/logout',{
      method:'POST',
      credentials:'same-origin',
      headers:{'Content-Type':'application/json'},
      body:'{}'
    });
  }catch{}
  currentCustomerSession=null;
  closeCustomerMenus();
  await hydrateCustomerHeader();
  if(/\/account\.html$/i.test(location.pathname)||location.pathname.endsWith('/account.html')) location.href='index.html';
}
function setupCustomerMenu(){
  $$('[data-customer-menu]').forEach(group=>{
    const trigger=$('[data-login]',group);
    const toggle=$('[data-account-toggle]',group);
    const dropdown=$('[data-account-dropdown]',group);
    const logoutBtn=$('[data-account-logout]',group);
    if(!trigger||!toggle||!dropdown)return;
    group.classList.toggle('signed-in',!!currentCustomerSession);
    toggle.hidden=!currentCustomerSession;
    dropdown.hidden=!currentCustomerSession;
    if(!currentCustomerSession)group.classList.remove('open');
    if(group.dataset.menuBound==='1')return;
    group.dataset.menuBound='1';
    trigger.addEventListener('click',e=>{
      if(!currentCustomerSession)return;
      e.preventDefault();
      e.stopPropagation();
      toggleCustomerMenu(group);
    });
    toggle.addEventListener('click',e=>{
      if(!currentCustomerSession)return;
      e.preventDefault();
      e.stopPropagation();
      toggleCustomerMenu(group);
    });
    dropdown.addEventListener('click',e=>e.stopPropagation());
    logoutBtn?.addEventListener('click',async e=>{
      e.preventDefault();
      await logoutCustomerFromHeader();
    });
  });
  if(document.body?.dataset.customerMenuGlobalBound!=='1'){
    document.body.dataset.customerMenuGlobalBound='1';
    document.addEventListener('click',e=>{
      if(!e.target.closest('[data-customer-menu]'))closeCustomerMenus();
    });
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape')closeCustomerMenus();
    });
  }
}

function ensureCustomerAuthOverlay(){
  let overlay=$('#customer-auth-overlay');
  if(overlay)return overlay;

  overlay=document.createElement('div');
  overlay.id='customer-auth-overlay';
  overlay.className='customer-auth-overlay';
  overlay.hidden=true;
  overlay.innerHTML=`
    <button type="button" class="customer-auth-close" aria-label="Cerrar">×</button>
    <div class="customer-auth-shell">
      <section class="customer-auth-screen" data-auth-screen="login">
        <h2>Iniciar sesión</h2>
        <p class="customer-auth-switch">¿Aún no eres miembro? <button type="button" data-auth-go="register">Crear cuenta</button></p>
        <form class="customer-auth-form customer-auth-form-primary" id="overlay-login-form">
          <label>Correo electrónico<input type="email" name="email" autocomplete="email" required></label>
          <label>Contraseña
            <span class="customer-password-input-wrap">
              <input type="password" name="password" autocomplete="current-password" required>
              <button type="button" class="customer-password-toggle" data-password-toggle aria-label="Mostrar contraseña" aria-pressed="false">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"></path><circle cx="12" cy="12" r="2.8"></circle><path class="customer-password-eye-slash" d="M4 4 20 20"></path></svg>
              </button>
            </span>
          </label>
          <button type="button" class="customer-auth-text-button" data-auth-go="forgot">¿Olvidaste tu contraseña?</button>
          <button type="submit" class="customer-auth-submit">Entrar</button>
          <p class="customer-auth-message" id="overlay-login-message"></p>
        </form>
      </section>

      <section class="customer-auth-screen" data-auth-screen="register" hidden>
        <h2>Crear cuenta</h2>
        <p class="customer-auth-switch">¿Ya eres miembro? <button type="button" data-auth-go="login">Iniciar sesión</button></p>
        <form class="customer-auth-form customer-auth-form-primary" id="overlay-register-form">
          <div class="customer-auth-two"><label>Nombre<input type="text" name="nombre" autocomplete="given-name" required></label><label>Apellidos<input type="text" name="apellidos" autocomplete="family-name"></label></div>
          <label>Correo electrónico<input type="email" name="email" autocomplete="email" required></label>
          <label class="customer-password-field">Contraseña
            <span class="customer-password-input-wrap">
              <input type="password" name="password" minlength="8" maxlength="20" autocomplete="new-password" aria-describedby="register-password-rules" required>
              <button type="button" class="customer-password-toggle" data-password-toggle aria-label="Mostrar contraseña" aria-pressed="false">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"></path><circle cx="12" cy="12" r="2.8"></circle><path class="customer-password-eye-slash" d="M4 4 20 20"></path></svg>
              </button>
            </span>
          </label>
          <div class="customer-password-reveal" id="register-password-feedback" hidden>
            <div class="customer-password-rules" id="register-password-rules" aria-live="polite"><strong>Tu contraseña debe:</strong><ul><li data-password-rule="case"><span aria-hidden="true">•</span> Combinar mayúsculas con minúsculas.</li><li data-password-rule="length"><span aria-hidden="true">•</span> Tener de 8 a 20 caracteres.</li><li data-password-rule="number-symbol"><span aria-hidden="true">•</span> Incluir por lo menos un número o símbolo.</li></ul></div>
            <label class="customer-password-field">Repetir contraseña
              <span class="customer-password-input-wrap">
                <input type="password" name="confirmPassword" minlength="8" maxlength="20" autocomplete="new-password" required>
                <button type="button" class="customer-password-toggle" data-password-toggle aria-label="Mostrar contraseña" aria-pressed="false">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"></path><circle cx="12" cy="12" r="2.8"></circle><path class="customer-password-eye-slash" d="M4 4 20 20"></path></svg>
                </button>
              </span>
              <span class="customer-password-match" id="register-password-match" aria-live="polite"></span>
            </label>
          </div>
          <button type="submit" class="customer-auth-submit">Crear cuenta</button>
          <p class="customer-auth-message" id="overlay-register-message"></p>
        </form>
        <p class="customer-auth-privacy">Al registrarte aceptas nuestra <a href="privacy.html">Política de privacidad</a>.</p>
      </section>

      <section class="customer-auth-screen" data-auth-screen="forgot" hidden>
        <h2>Recuperar contraseña</h2>
        <p class="customer-auth-switch">Te enviaremos un enlace de un solo uso.</p>
        <form class="customer-auth-form" id="overlay-forgot-form">
          <label>Correo electrónico<input type="email" name="email" autocomplete="email" required></label>
          <button type="submit" class="customer-auth-submit">Enviar enlace</button>
          <button type="button" class="customer-auth-secondary" data-auth-go="login">Volver a iniciar sesión</button>
          <p class="customer-auth-message" id="overlay-forgot-message"></p>
        </form>
      </section>


    </div>`;

  document.body.appendChild(overlay);

  $('.customer-auth-close',overlay)?.addEventListener('click',()=>{clearPendingFavoriteLogin();window.location.href='index.html'});
  $$('[data-auth-go]',overlay).forEach(btn=>btn.addEventListener('click',()=>setCustomerAuthScreen(btn.dataset.authGo)));
  $$('[data-password-toggle]',overlay).forEach(btn=>btn.addEventListener('click',()=>{
    const wrap=btn.closest('.customer-password-input-wrap');
    const input=wrap?.querySelector('input');
    if(!input)return;
    const showing=input.type==='text';
    input.type=showing?'password':'text';
    btn.classList.toggle('is-visible',!showing);
    btn.setAttribute('aria-pressed',!showing?'true':'false');
    btn.setAttribute('aria-label',!showing?'Ocultar contraseña':'Mostrar contraseña');
    input.focus();
  }));

  $('#overlay-login-form',overlay)?.addEventListener('submit',async e=>{
    e.preventDefault();const message=$('#overlay-login-message',overlay),button=e.currentTarget.querySelector('button[type="submit"]');button.disabled=true;message.textContent='Entrando…';
    try{
      const body=Object.fromEntries(new FormData(e.currentTarget).entries());
      const res=await fetch('/api/account/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data.error||'No fue posible iniciar sesión.');
      currentCustomerSession=data.customer;closeCustomerAuthOverlay();await hydrateCustomerHeader();if(!(await completePendingFavoriteAfterLogin()))location.href='account.html';
    }catch(err){message.textContent=err.message}finally{button.disabled=false}
  });

  const registerPassword=$('#overlay-register-form input[name="password"]',overlay);
  const registerConfirmPassword=$('#overlay-register-form input[name="confirmPassword"]',overlay);
  const registerPasswordFeedback=$('#register-password-feedback',overlay);
  const registerPasswordMatch=$('#register-password-match',overlay);
  const passwordChecks=value=>{const text=String(value||'');return {case:/[A-ZÁÉÍÓÚÜÑ]/.test(text)&&/[a-záéíóúüñ]/.test(text),length:text.length>=8&&text.length<=20,'number-symbol':/[0-9]|[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s]/.test(text)}};
  const refreshPasswordMatch=()=>{
    if(!registerConfirmPassword||!registerPassword)return true;
    const hasValue=registerConfirmPassword.value.length>0;
    const matches=registerConfirmPassword.value===registerPassword.value;
    registerConfirmPassword.classList.toggle('is-valid',hasValue&&matches);
    registerConfirmPassword.classList.toggle('is-invalid',hasValue&&!matches);
    registerConfirmPassword.setCustomValidity(!hasValue||matches?'':'Las contraseñas no coinciden.');
    if(registerPasswordMatch)registerPasswordMatch.textContent=hasValue?(matches?'Las contraseñas coinciden.':'Las contraseñas no coinciden.') : '';
    registerPasswordMatch?.classList.toggle('is-valid',hasValue&&matches);
    registerPasswordMatch?.classList.toggle('is-invalid',hasValue&&!matches);
    return matches;
  };
  const refreshPasswordRules=()=>{
    if(!registerPassword)return true;
    const touched=registerPassword.value.length>0;
    if(registerPasswordFeedback)registerPasswordFeedback.hidden=!touched;
    if(!touched&&registerConfirmPassword){registerConfirmPassword.value='';registerConfirmPassword.setCustomValidity('');registerConfirmPassword.classList.remove('is-valid','is-invalid');if(registerPasswordMatch)registerPasswordMatch.textContent=''}
    const checks=passwordChecks(registerPassword.value);
    Object.entries(checks).forEach(([rule,valid])=>{const item=overlay.querySelector(`[data-password-rule="${rule}"]`);if(!item)return;item.classList.toggle('is-valid',valid);item.classList.toggle('is-invalid',touched&&!valid);const marker=item.querySelector('span');if(marker)marker.textContent=valid?'✓':'•'});
    const allValid=Object.values(checks).every(Boolean);
    registerPassword.classList.toggle('is-valid',touched&&allValid);
    registerPassword.classList.toggle('is-invalid',touched&&!allValid);
    registerPassword.setCustomValidity(allValid||!touched?'':'La contraseña no cumple todos los requisitos.');
    if(touched)refreshPasswordMatch();
    return allValid;
  };
  registerPassword?.addEventListener('input',refreshPasswordRules);registerPassword?.addEventListener('blur',refreshPasswordRules);
  registerConfirmPassword?.addEventListener('input',refreshPasswordMatch);registerConfirmPassword?.addEventListener('blur',refreshPasswordMatch);
  refreshPasswordRules();

  $('#overlay-register-form',overlay)?.addEventListener('submit',async e=>{
    e.preventDefault();const message=$('#overlay-register-message',overlay);if(!refreshPasswordRules()){message.textContent='Revisa los requisitos de la contraseña.';registerPassword?.reportValidity();return}if(!registerConfirmPassword?.value||!refreshPasswordMatch()){message.textContent='Repite la contraseña correctamente.';registerConfirmPassword?.reportValidity();return}const button=e.currentTarget.querySelector('button[type="submit"]');button.disabled=true;message.textContent='Creando tu cuenta…';
    try{
      const body=Object.fromEntries(new FormData(e.currentTarget).entries());delete body.confirmPassword;
      const res=await fetch('/api/account/register',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'No fue posible crear la cuenta.');
      currentCustomerSession=data.customer;closeCustomerAuthOverlay();await hydrateCustomerHeader();if(!(await completePendingFavoriteAfterLogin()))location.href='account.html';
    }catch(err){message.textContent=err.message}finally{button.disabled=false}
  });

  $('#overlay-forgot-form',overlay)?.addEventListener('submit',async e=>{
    e.preventDefault();const message=$('#overlay-forgot-message',overlay),button=e.currentTarget.querySelector('button[type="submit"]');button.disabled=true;message.textContent='Enviando…';
    try{const body=Object.fromEntries(new FormData(e.currentTarget).entries()),res=await fetch('/api/account/password/forgot',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'No fue posible procesar la solicitud.');message.textContent=data.message||'Revisa tu correo.'}catch(err){message.textContent=err.message}finally{button.disabled=false}
  });

  return overlay;
}

function resetCustomerAuthOverlay(){
  const overlay=ensureCustomerAuthOverlay();
  $$('[data-auth-screen]',overlay).forEach(screen=>{
    screen.querySelectorAll('.customer-auth-form').forEach(form=>form.reset?.());
    screen.querySelectorAll('.customer-auth-message').forEach(msg=>msg.textContent='');
  });
  $$('[data-password-toggle]',overlay).forEach(btn=>{
    const input=btn.closest('.customer-password-input-wrap')?.querySelector('input');
    if(input)input.type='password';
    btn.classList.remove('is-visible');
    btn.setAttribute('aria-pressed','false');
    btn.setAttribute('aria-label','Mostrar contraseña');
  });
  const registerFeedback=$('#register-password-feedback',overlay);if(registerFeedback)registerFeedback.hidden=true;
  const registerMatch=$('#register-password-match',overlay);if(registerMatch){registerMatch.textContent='';registerMatch.classList.remove('is-valid','is-invalid')}
  $$('[data-password-rule]',overlay).forEach(item=>{item.classList.remove('is-valid','is-invalid');const marker=item.querySelector('span');if(marker)marker.textContent='•'});
}

function setCustomerAuthScreen(kind='login'){
  const overlay=ensureCustomerAuthOverlay();
  $$('[data-auth-screen]',overlay).forEach(screen=>{
    screen.hidden=screen.dataset.authScreen!==kind;
  });
}

function openCustomerAuthOverlay(kind='login'){
  const overlay=ensureCustomerAuthOverlay();
  resetCustomerAuthOverlay();
  setCustomerAuthScreen(kind);
  overlay.hidden=false;
  document.body.classList.add('customer-auth-open');
}

function closeCustomerAuthOverlay(){
  const overlay=$('#customer-auth-overlay');
  if(!overlay)return;
  overlay.hidden=true;
  document.body.classList.remove('customer-auth-open');
}

function bindLoginLinks(){
  $$('[data-login]').forEach(link=>{
    if(link.dataset.authBound==='1')return;
    link.dataset.authBound='1';
    link.addEventListener('click',e=>{
      if(currentCustomerSession)return;
      e.preventDefault();
      openCustomerAuthOverlay('login');
    });
  });
}

async function prefillCheckoutFromAccount(){
  if(!$('#checkout-root'))return null;
  try{
    const res=await fetch('/api/account/session',{cache:'no-store',credentials:'same-origin'});
    if(!res.ok)return null;
    const data=await res.json();
    if(!data.authenticated||!data.customer)return null;
    const c=data.customer,a=c.address||{},state=getCheckoutState();
    const fill={
      nombre:state.nombre||c.nombre||'',
      apellidos:state.apellidos||c.apellidos||'',
      email:state.email||c.email||'',
      telefono:state.telefono||c.telefono||'',
      calle:state.calle||a.calle||'',
      colonia:state.colonia||a.colonia||'',
      cp:state.cp||a.cp||'',
      ciudad:state.ciudad||a.ciudad||'',
      estado:state.estado||a.estado||'',
      pais:state.pais||a.pais||'México'
    };
    setCheckoutState(fill);
    return c;
  }catch{return null}
}

const DEFAULT_CATALOG_STYLE={backgroundColor:'#ffffff',productNameColor:'#4d5e75',productPriceColor:'#738197',title:{visible:true,text:'🔥 HOT 🔥',fontFamily:'Helvetica Neue',fontWeight:700,italic:false,color:'#1f1e1c',backgroundColor:'transparent',fontSize:24,mobileFontSize:22,letterSpacing:.5,textAlign:'center',textTransform:'none',paddingX:0,paddingY:0,borderColor:'#1f1e1c',borderWidth:0,borderRadius:0,marginTop:0,marginBottom:48}};
const DEFAULT_HOMEPAGE={autoplaySeconds:0,autoplayDirection:'next',showArrows:true,showDots:true,arrowSize:46,arrowSizeMobile:34,arrowWeight:200,arrowColor:'#ffffff',arrowOpacity:.92,transitionType:'slide',transitionDurationMs:560,height:635,mobileHeight:560,desktopTextScale:.65,mobileTextScale:1,responsiveTextV2:true,promoRibbonEnabled:true,promoRibbonText:'ENVÍOS GRATIS EN TIENDA Y A DOMICILIO DESDE $799',promoRibbonDuration:26,promoRibbonBackgroundColor:'#0f0f0f',promoRibbonTextColor:'#ffffff',promoRibbonFontSize:15,promoRibbonSpacing:26,promoRibbonSeparator:'✦',promoRibbonSeparatorIcon:'',promoRibbonSeparatorIconSize:22,promoRibbonPages:['index.html','shop-all.html','woman.html','men.html','product.html','about-us.html','contact.html','privacy.html','returns.html','shipping.html','stockists.html','partners.html','jobs.html','offers.html','account.html'],footerSettings:{phone:'7571541553',facebookUrl:'https://facebook.com/ninosrancios',instagramUrl:'https://instagram.com/ninosrancios'},benefitsBand:DEFAULT_BENEFITS_BAND,homeFeatureBlock:DEFAULT_HOME_FEATURE_BLOCK,catalogStyle:DEFAULT_CATALOG_STYLE,slides:[{id:'default',mediaType:'image',video:'',image:'https://static.wixstatic.com/media/11062b_2ffe9bf7695a4ef6abb5b61acdf992f9~mv2.jpg/v1/fill/w_985,h_657,al_c,q_85,usm_0.66_1.00_0.01/11062b_2ffe9bf7695a4ef6abb5b61acdf992f9~mv2.jpg',imagePositionX:50,imagePositionY:50,overlayOpacity:.18,blocks:[{id:'t1',text:'OFERTA ESPECIAL',x:50,y:38,mobileX:50,mobileY:38,fontFamily:'Arial Black',fontSize:77,mobileFontSize:32,fontWeight:900,italic:true,color:'#050505',backgroundColor:'transparent',paddingX:0,paddingY:0,letterSpacing:-4,visible:true},{id:'t2',text:'FIN DE SEMANA',x:50,y:49,mobileX:50,mobileY:48,fontFamily:'Arial Black',fontSize:70,mobileFontSize:29,fontWeight:900,italic:true,color:'#050505',backgroundColor:'#ff3035',paddingX:12,paddingY:4,letterSpacing:-4,visible:true},{id:'t3',text:'20% DE DESCUENTO',x:50,y:60,mobileX:50,mobileY:58,fontFamily:'Arial Black',fontSize:44,mobileFontSize:19,fontWeight:900,italic:true,color:'#050505',backgroundColor:'transparent',paddingX:0,paddingY:0,letterSpacing:-2,visible:true},{id:'t4',text:'+ ENVÍO GRATIS DESDE $999',x:50,y:67,mobileX:50,mobileY:65,fontFamily:'Arial Black',fontSize:19,mobileFontSize:11,fontWeight:900,italic:true,color:'#050505',backgroundColor:'transparent',paddingX:0,paddingY:0,letterSpacing:0,visible:true},{id:'t5',text:'Disfruta hasta 20% de descuento en playeras. Envío gratis en compras desde MX$999.00.',x:50,y:76,mobileX:50,mobileY:90,fontFamily:'Helvetica Neue',fontSize:16,mobileFontSize:10,fontWeight:500,italic:false,color:'#ffffff',backgroundColor:'transparent',paddingX:0,paddingY:0,letterSpacing:0,visible:true}]}]};
let homepageHeroState={settings:DEFAULT_HOMEPAGE,index:0,timer:null,animating:false};
function heroFontStack(name){const map={'Montserrat':"'Montserrat',Arial,sans-serif",'Helvetica Neue':"'Helvetica Neue',Helvetica,Arial,sans-serif",'Arial':'Arial,sans-serif','Arial Black':"'Arial Black',Arial,sans-serif",'Impact':'Impact,Haettenschweiler,sans-serif','Georgia':'Georgia,serif','Times New Roman':"'Times New Roman',Times,serif",'Trebuchet MS':"'Trebuchet MS',Arial,sans-serif",'Courier New':"'Courier New',Courier,monospace"};return map[name]||map['Montserrat']}
function heroEscape(v){return String(v??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}
function heroBlocksHtml(slide,settings){
  const desktopScale=Number(settings?.desktopTextScale)||.65,mobileScale=Number(settings?.mobileTextScale)||1;
  return (slide.blocks||[]).filter(b=>b.visible!==false&&b.text).map(b=>{
    const fs=Number(b.fontSize)||32,mfs=Number(b.mobileFontSize)||Math.min(32,Math.max(10,Math.round(fs*.42)));
    const ls=Number(b.letterSpacing)||0,px=Number(b.paddingX)||0,py=Number(b.paddingY)||0;
    const mobileRatio=mfs/fs;
    const mx=Number.isFinite(Number(b.mobileX))?Number(b.mobileX):(Number(b.x)||50);
    const my=Number.isFinite(Number(b.mobileY))?Number(b.mobileY):(Number(b.y)||50);
    return `<div class="hero-editable-text" style="--hero-x-desktop:${Number(b.x)||50}%;--hero-y-desktop:${Number(b.y)||50}%;--hero-x-mobile:${mx}%;--hero-y-mobile:${my}%;--hero-font-size-desktop:${fs*desktopScale}px;--hero-font-size-mobile:${mfs*mobileScale}px;--hero-letter-spacing-desktop:${ls*desktopScale}px;--hero-letter-spacing-mobile:${ls*mobileRatio*mobileScale}px;--hero-padding-x-desktop:${px*desktopScale}px;--hero-padding-x-mobile:${px*mobileRatio*mobileScale}px;--hero-padding-y-desktop:${py*desktopScale}px;--hero-padding-y-mobile:${py*mobileRatio*mobileScale}px;font-family:${heroFontStack(b.fontFamily)};font-weight:${Number(b.fontWeight)||700};font-style:${b.italic?'italic':'normal'};color:${b.color||'#050505'};background:${b.backgroundColor||'transparent'}">${heroEscape(b.text).replace(/\n/g,'<br>')}</div>`;
  }).join('');
}
function heroImageUrl(value){
  const raw=String(value||'').trim();
  const fallback=String(DEFAULT_HOMEPAGE.slides?.[0]?.image||'');
  const source=raw||fallback;
  try{return new URL(source,document.baseURI).href}catch{return source}
}
function heroVideoUrl(value){
  const raw=String(value||'').trim();
  if(!raw)return '';
  try{return new URL(raw,document.baseURI).href}catch{return raw}
}
function createHeroLayer(slide,settings){
  const layer=document.createElement('div');
  layer.className='hero-slide-layer';

  let media;
  if(slide.mediaType==='video'&&slide.video){
    media=document.createElement('video');
    media.className='hero-media hero-video';
    media.muted=true;
    media.defaultMuted=true;
    media.autoplay=true;
    media.loop=true;
    media.playsInline=true;
    media.preload='auto';
    media.setAttribute('muted','');
    media.setAttribute('playsinline','');
    media.setAttribute('aria-hidden','true');
    const revealVideo=()=>{
      media.play().catch(()=>{});
      requestAnimationFrame(()=>media.classList.add('is-ready'));
    };
    media.addEventListener('loadeddata',revealVideo,{once:true});
    media.addEventListener('canplay',revealVideo,{once:true});
    media.addEventListener('error',()=>{
      if(slide.image){
        layer.style.backgroundImage=`url("${heroImageUrl(slide.image).replace(/"/g,'%22')}")`;
        layer.style.backgroundSize='cover';
        layer.style.backgroundPosition=`${Number(slide.imagePositionX)||50}% ${Number(slide.imagePositionY)||50}%`;
      }
    },{once:true});
    media.src=heroVideoUrl(slide.video);
  }else{
    media=document.createElement('img');
    media.className='hero-media';
    media.alt='';
    media.decoding='async';
    media.draggable=false;
    media.src=heroImageUrl(slide.image);
  }
  media.style.objectPosition=`${Number(slide.imagePositionX)||50}% ${Number(slide.imagePositionY)||50}%`;

  const overlay=document.createElement('div');
  overlay.className='hero-overlay';
  overlay.style.background=`rgba(0,0,0,${Number(slide.overlayOpacity)||0})`;

  const texts=document.createElement('div');
  texts.className='hero-dynamic-texts';
  texts.innerHTML=heroBlocksHtml(slide,settings);

  layer.append(media,overlay,texts);
  return layer;
}
function updateHeroNavigation(){
  const dots=$('#home-hero-dots'),prev=$('#home-hero-prev'),next=$('#home-hero-next');
  const settings=homepageHeroState.settings||DEFAULT_HOMEPAGE,slides=settings.slides||[],multi=slides.length>1;
  if(prev)prev.hidden=!multi||settings.showArrows===false;
  if(next)next.hidden=!multi||settings.showArrows===false;
  if(!dots)return;
  dots.hidden=!multi||settings.showDots===false;
  dots.innerHTML=(multi&&settings.showDots!==false)?slides.map((_,i)=>`<button type="button" class="${i===homepageHeroState.index?'active':''}" data-hero-dot="${i}" aria-label="Diapositiva ${i+1}"></button>`).join(''):'';
  $$('[data-hero-dot]',dots).forEach(btn=>btn.onclick=()=>{const nextIndex=Number(btn.dataset.heroDot)||0;const dir=nextIndex===homepageHeroState.index?0:(nextIndex>homepageHeroState.index?1:-1);if(dir)goToHeroSlide(nextIndex,dir);resetHeroAutoplay()});
}
function renderHomepageHero(){
  const hero=$('#home-hero'),stage=$('#home-hero-stage');if(!hero||!stage)return;
  const settings=homepageHeroState.settings||DEFAULT_HOMEPAGE,slides=settings.slides||[];if(!slides.length)return;
  homepageHeroState.index=Math.max(0,Math.min(homepageHeroState.index,slides.length-1));
  hero.style.setProperty('--hero-desktop-height',`${settings.height||635}px`);
  hero.style.setProperty('--hero-mobile-height',`${settings.mobileHeight||560}px`);
  hero.style.setProperty('--hero-arrow-size',`${Number(settings.arrowSize)||46}px`);
  hero.style.setProperty('--hero-arrow-size-mobile',`${Number(settings.arrowSizeMobile)||34}px`);
  hero.style.setProperty('--hero-arrow-weight',`${Number(settings.arrowWeight)||200}`);
  hero.style.setProperty('--hero-arrow-color',settings.arrowColor||'#ffffff');
  hero.style.setProperty('--hero-arrow-opacity',`${Number(settings.arrowOpacity)||.92}`);
  hero.style.setProperty('--hero-transition-duration',`${Number(settings.transitionDurationMs)||560}ms`);
  stage.innerHTML='';
  const layer=createHeroLayer(slides[homepageHeroState.index],settings);
  layer.classList.add('is-current');
  stage.appendChild(layer);
  updateHeroNavigation();
}
function goToHeroSlide(nextIndex,direction=1){
  const hero=$('#home-hero'),stage=$('#home-hero-stage');const settings=homepageHeroState.settings||DEFAULT_HOMEPAGE,slides=settings.slides||[];
  if(!hero||!stage||slides.length<2||homepageHeroState.animating)return;
  nextIndex=(nextIndex+slides.length)%slides.length;if(nextIndex===homepageHeroState.index)return;
  hero.style.setProperty('--hero-desktop-height',`${settings.height||635}px`);
  hero.style.setProperty('--hero-mobile-height',`${settings.mobileHeight||560}px`);
  hero.style.setProperty('--hero-transition-duration',`${Number(settings.transitionDurationMs)||560}ms`);
  const effect=settings.transitionType==='fade'?'fade':'slide';
  const currentLayer=stage.querySelector('.hero-slide-layer.is-current')||createHeroLayer(slides[homepageHeroState.index],settings);
  if(!currentLayer.parentNode)stage.appendChild(currentLayer);
  const nextLayer=createHeroLayer(slides[nextIndex],settings);
  nextLayer.classList.add('is-next');
  if(effect==='fade')nextLayer.classList.add('fade-in');
  else nextLayer.classList.add(direction>=0?'from-right':'from-left');
  stage.appendChild(nextLayer);
  homepageHeroState.animating=true;
  homepageHeroState.index=nextIndex;
  updateHeroNavigation();
  requestAnimationFrame(()=>{
    currentLayer.classList.add(effect==='fade'?'fade-out':(direction>=0?'slide-out-left':'slide-out-right'));
    nextLayer.classList.add('is-entering');
  });
  const cleanup=()=>{
    if(!nextLayer.isConnected)return;
    stage.querySelectorAll('.hero-slide-layer').forEach(layer=>{if(layer!==nextLayer)layer.remove()});
    nextLayer.className='hero-slide-layer is-current';
    homepageHeroState.animating=false;
  };
  nextLayer.addEventListener('transitionend',cleanup,{once:true});
  setTimeout(cleanup,(Number(settings.transitionDurationMs)||560)+180);
}
function heroStep(delta){const slides=homepageHeroState.settings?.slides||[];if(slides.length<2)return;goToHeroSlide(homepageHeroState.index+delta,delta>=0?1:-1);resetHeroAutoplay()}
function resetHeroAutoplay(){
  clearInterval(homepageHeroState.timer);
  const settings=homepageHeroState.settings||DEFAULT_HOMEPAGE,sec=Number(settings.autoplaySeconds)||0,slides=settings.slides||[];
  if(sec>0&&slides.length>1){
    const dir=settings.autoplayDirection==='previous'?-1:1;
    homepageHeroState.timer=setInterval(()=>goToHeroSlide(homepageHeroState.index+dir,dir),sec*1000);
  }
}
function applyHomeCatalogStyle(settings){
  const section=document.querySelector('.shop-home');
  if(!section)return;
  const c=settings?.catalogStyle||DEFAULT_CATALOG_STYLE;
  const t=c.title||DEFAULT_CATALOG_STYLE.title;
  section.style.setProperty('--home-catalog-bg',c.backgroundColor||'#ffffff');
  section.style.setProperty('--home-product-name-color',c.productNameColor||'#4d5e75');
  section.style.setProperty('--home-product-price-color',c.productPriceColor||'#738197');
  const title=section.querySelector('.section-title');
  if(!title)return;
  title.hidden=t.visible===false;
  title.textContent=t.text||'';
  title.style.fontFamily=t.fontFamily||'Helvetica Neue';
  title.style.fontWeight=String(Number(t.fontWeight)||700);
  title.style.fontStyle=t.italic?'italic':'normal';
  title.style.color=t.color||'#1f1e1c';
  title.style.background=t.backgroundColor||'transparent';
  title.style.setProperty('--catalog-title-font-size',`${Number(t.fontSize)||24}px`);
  title.style.setProperty('--catalog-title-font-size-mobile',`${Number(t.mobileFontSize)||22}px`);
  title.style.letterSpacing=`${Number(t.letterSpacing)||0}px`;
  title.style.textTransform=t.textTransform||'none';
  title.style.padding=`${Number(t.paddingY)||0}px ${Number(t.paddingX)||0}px`;
  title.style.border=`${Number(t.borderWidth)||0}px solid ${t.borderColor||'#1f1e1c'}`;
  title.style.borderRadius=`${Number(t.borderRadius)||0}px`;
  title.style.marginTop=`${Number(t.marginTop)||0}px`;
  title.style.marginBottom=`${Number(t.marginBottom)||48}px`;
  title.dataset.align=t.textAlign||'center';
}
async function initHomepageHero(){
  if(!$('#home-hero'))return;
  await hydrateSharedHomepageSettings();
  renderHomepageHero();resetHeroAutoplay();
  $('#home-hero-prev')?.addEventListener('click',()=>heroStep(-1));$('#home-hero-next')?.addEventListener('click',()=>heroStep(1));
}

function applyFooterSettings(settings){
  const defaults={phone:'7571541553',facebookUrl:'https://facebook.com/ninosrancios',instagramUrl:'https://instagram.com/ninosrancios'};
  const cfg={...defaults,...(settings?.footerSettings||{})};
  const phone=$('[data-footer-phone]');
  if(phone){
    const display=String(cfg.phone||defaults.phone).trim()||defaults.phone;
    const digits=display.replace(/\D/g,'');
    phone.textContent=`☎ ${display}`;
    phone.href=digits?`tel:${digits.length===10?'+52'+digits:digits}`:'#';
  }
  const facebook=$('[data-footer-facebook]');if(facebook)facebook.href=String(cfg.facebookUrl||defaults.facebookUrl);
  const instagram=$('[data-footer-instagram]');if(instagram)instagram.href=String(cfg.instagramUrl||defaults.instagramUrl);
}
async function hydrateSharedHomepageSettings(){try{const res=await fetch('/api/homepage',{cache:'no-store'});if(res.ok){const data=await res.json();if(data.homepage)homepageHeroState.settings=data.homepage}}catch{}renderHomeHeroFeatureBlock(homepageHeroState.settings);applyHomeCatalogStyle(homepageHeroState.settings);applyFooterSettings(homepageHeroState.settings);const b=$('[data-shell-benefits]');if(b)b.innerHTML=benefits();return homepageHeroState.settings}
function setupNewsletterForm(){
  const form=$('[data-newsletter-form]');
  if(!form||form.dataset.bound==='1')return;
  form.dataset.bound='1';
  const button=form.querySelector('button[type="submit"]');
  const message=form.querySelector('[data-newsletter-message]');
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    const data=new FormData(form);
    const email=String(data.get('email')||'').trim();
    const website=String(data.get('website')||'').trim();
    const consent=!!form.querySelector('input[name="consent"]')?.checked;
    button.disabled=true;
    message.className='newsletter-message';
    message.textContent='Suscribiendo…';
    try{
      const response=await fetch('/api/newsletter/subscribe',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,website,consent})});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||'No fue posible completar la suscripción.');
      message.className='newsletter-message is-success';
      message.textContent=result.message||'¡Gracias por unirte!';
      form.reset();
    }catch(err){
      message.className='newsletter-message is-error';
      message.textContent=err.message||'No fue posible completar la suscripción.';
    }finally{button.disabled=false}
  });
}

function mountShell(active){const h=$('[data-shell-header]'),b=$('[data-shell-benefits]'),f=$('[data-shell-footer]');if(h)h.innerHTML=header(active);if(b)b.innerHTML=benefits();if(f)f.innerHTML=footer();setupShell();setupNewsletterForm();renderCartCount();hydrateCustomerHeader();if(!$('#home-hero'))hydrateSharedHomepageSettings()}

function setupProductHoverGalleries(){
  const canHover=window.matchMedia?.('(hover:hover) and (pointer:fine)').matches;
  if(!canHover)return;

  $$('[data-product-hover]').forEach(cardEl=>{
    if(cardEl.dataset.hoverGalleryBound==='1')return;
    cardEl.dataset.hoverGalleryBound='1';

    const product=PRODUCTS.find(p=>p.id===cardEl.dataset.productHover);
    const image=$('.product-hover-image',cardEl);
    const gallery=getProductHoverGallery(product);
    if(!image||gallery.length<2)return;

    const STEP_MS=1;
    let index=0;
    let nextTimer=null;
    let swapTimer=null;
    let active=false;

    const preload=()=>gallery.slice(1).forEach(src=>{
      const img=new Image();
      img.src=src;
    });

    const showImage=(src)=>{
      image.src=src;
    };

    const scheduleNext=()=>{
      clearTimeout(nextTimer);
      if(!active)return;
      if(index>=gallery.length-1)return;
      nextTimer=setTimeout(()=>{
        if(!active)return;
        index+=1;
        showImage(gallery[index]);
        scheduleNext();
      },STEP_MS);
    };

    const start=()=>{
      active=true;
      index=0;
      preload();
      clearTimeout(nextTimer);
      clearTimeout(swapTimer);
      image.src=gallery[0];
      scheduleNext();
    };

    const stop=()=>{
      active=false;
      clearTimeout(nextTimer);
      clearTimeout(swapTimer);
      index=0;
      image.src=gallery[0];
    };

    cardEl.addEventListener('mouseenter',start);
    cardEl.addEventListener('mouseleave',stop);
  });
}

function setupShell(){
  setupProductHoverGalleries();
  const toggle=$('#menu-toggle'),menu=$('#mobile-menu'),close=$('#mobile-menu-close'),shopToggle=$('#mobile-shop-toggle'),shopSub=$('#mobile-shop-sub');
  const closeMenu=()=>{if(!menu)return;menu.classList.remove('open');menu.setAttribute('aria-hidden','true');toggle?.setAttribute('aria-expanded','false');document.body.classList.remove('mobile-menu-open')};
  const openMenu=()=>{if(!menu)return;menu.classList.add('open');menu.setAttribute('aria-hidden','false');toggle?.setAttribute('aria-expanded','true');document.body.classList.add('mobile-menu-open')};
  if(toggle&&!toggle.dataset.boundMenu){toggle.dataset.boundMenu='1';toggle.addEventListener('click',()=>menu?.classList.contains('open')?closeMenu():openMenu())}
  if(close&&!close.dataset.boundClose){close.dataset.boundClose='1';close.addEventListener('click',closeMenu)}
  if(shopToggle&&!shopToggle.dataset.boundShop){shopToggle.dataset.boundShop='1';shopToggle.addEventListener('click',()=>{const open=shopSub?.classList.toggle('open');shopToggle.classList.toggle('open',!!open);shopToggle.setAttribute('aria-expanded',open?'true':'false')})}
  if(menu&&!menu.dataset.boundKeys){menu.dataset.boundKeys='1';menu.addEventListener('click',e=>{if(e.target.closest('a')&&!e.target.closest('.mobile-shop-sub'))closeMenu()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()})}
  if(!window.__nrScrollBound){
    window.__nrScrollBound=true;
    let lastScrollY=window.scrollY;
    let lastWheelAt=0;
    let hidden=false;

    const setHeaderHidden=next=>{
      const h=$('#site-header');
      if(!h)return;
      hidden=!!next;
      h.classList.toggle('header-fade-hidden',hidden);
    };

    // Rueda / touchpad: misma lógica del video.
    // Abajo -> fade out. Arriba -> fade in.
    addEventListener('wheel',event=>{
      if(document.body.classList.contains('mobile-menu-open'))return;
      const dy=Number(event.deltaY)||0;
      if(Math.abs(dy)<4)return;
      lastWheelAt=performance.now();

      if(dy>0&&window.scrollY>10)setHeaderHidden(true);
      if(dy<0)setHeaderHidden(false);
    },{passive:true});

    // Respaldo para barra de scroll, teclado y móvil.
    addEventListener('scroll',()=>{
      if(document.body.classList.contains('mobile-menu-open')){
        lastScrollY=window.scrollY;
        return;
      }

      const y=window.scrollY;
      const delta=y-lastScrollY;
      lastScrollY=y;

      if(y<=4){
        setHeaderHidden(false);
        return;
      }

      // Cuando el evento viene de wheel dejamos que wheel mande,
      // así no se duplica el comportamiento.
      if(performance.now()-lastWheelAt<180)return;

      if(delta>5)setHeaderHidden(true);
      else if(delta<-5)setHeaderHidden(false);
    },{passive:true});

    setHeaderHidden(false);
  }
  $$('[data-add]').forEach(btn=>{if(btn.dataset.boundAdd)return;btn.dataset.boundAdd='1';btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const p=PRODUCTS.find(x=>x.id===btn.dataset.add);if(productRequiresOptions(p))openQuickView(btn.dataset.add);else addToCart(btn.dataset.add)})});
  $$('[data-quick]').forEach(btn=>{if(btn.dataset.boundQuick)return;btn.dataset.boundQuick='1';btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openQuickView(btn.dataset.quick)})})
}
function ensureDrawer(){if($('#cart-drawer'))return;document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="overlay"></div><aside class="cart-drawer" id="cart-drawer"><div class="drawer-head"><h3>Carrito</h3><button class="drawer-close" aria-label="Cerrar">×</button></div><div class="cart-items" id="cart-items"></div><div class="drawer-foot"><button type="button" id="drawer-cart-link">Ver carrito / pagar</button></div></aside>`);$('#overlay').onclick=closeCart;$('.drawer-close').onclick=closeCart;$('#drawer-cart-link').onclick=()=>{window.location.href='cart.html'}}
function openCart(){ensureDrawer();renderDrawer();$('#cart-drawer')?.classList.add('open');$('#overlay')?.classList.add('show')}
function closeCart(){$('#cart-drawer')?.classList.remove('open');$('#overlay')?.classList.remove('show')}
function ensureQuickView(){if($('#quick-view-overlay'))return;document.body.insertAdjacentHTML('beforeend',`<div class="quick-view-overlay" id="quick-view-overlay" role="dialog" aria-modal="true" aria-label="Vista rápida del producto"><div class="quick-view-modal"><button class="quick-view-close" type="button" aria-label="Cerrar">×</button><div class="quick-view-gallery"><div class="quick-view-image-stage"><div class="quick-view-image"><img id="quick-view-img" src="" alt=""></div></div><div class="quick-view-dots" aria-hidden="true"><span class="dot active"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div><div class="quick-view-info"><h2 id="quick-view-name"></h2><div class="quick-view-price" id="quick-view-price"></div><label class="quick-field-label" for="quick-view-color">Color *</label><select class="quick-select" id="quick-view-color"><option value="">Selecciona</option></select><div class="quick-color-swatches" id="quick-color-swatches" aria-label="Muestras de color"></div><label class="quick-field-label" for="quick-view-size">Talla *</label><select class="quick-select" id="quick-view-size"><option value="">Selecciona</option><option>CH</option><option>M</option><option>G</option><option>XG</option></select><div class="quick-field-label">Cantidad *</div><div class="quick-qty" aria-label="Cantidad"><button class="qty-btn" id="quick-qty-minus" type="button" aria-label="Disminuir cantidad">−</button><input id="quick-view-qty" type="number" min="1" value="1" inputmode="numeric"><button class="qty-btn" id="quick-qty-plus" type="button" aria-label="Aumentar cantidad">+</button></div><div class="quick-view-actions"><button class="quick-add" id="quick-view-add" type="button">Agregar al carrito</button><a class="quick-product-link" id="quick-view-link" href="#">Ver más detalles</a></div></div></div></div>`);const overlay=$('#quick-view-overlay');overlay.addEventListener('click',e=>{if(e.target===overlay)closeQuickView()});$('.quick-view-close')?.addEventListener('click',closeQuickView);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeQuickView()});$('#quick-qty-minus')?.addEventListener('click',()=>updateQuickQty(-1));$('#quick-qty-plus')?.addEventListener('click',()=>updateQuickQty(1));$('#quick-view-qty')?.addEventListener('input',()=>{const field=$('#quick-view-qty');if((parseInt(field.value,10)||0)<1)field.value=1})}
function updateQuickQty(delta){const field=$('#quick-view-qty');if(!field)return;field.value=Math.max(1,(parseInt(field.value,10)||1)+delta)}
function syncQuickSwatches(p){const selected=$('#quick-view-color')?.value||'';$$('#quick-color-swatches .color-swatch').forEach(btn=>{btn.classList.toggle('selected',btn.dataset.color===selected);btn.classList.toggle('sold-out',getColorStock(p,btn.dataset.color)<=0)});const img=$('#quick-view-img');if(img&&p)img.src=getProductImage(p,selected);const sizeSelect=$('#quick-view-size');updateSizeSelectForStock(sizeSelect,p,selected);clampQtyToStock($('#quick-view-qty'),p,selected,sizeSelect?.value||'')}
function openQuickView(id){const p=PRODUCTS.find(x=>x.id===id);if(!p)return;ensureQuickView();$('#quick-view-img').src=p.img;$('#quick-view-img').alt=p.name;$('#quick-view-name').textContent=p.name;$('#quick-view-price').textContent='MX$'+p.price;$('#quick-view-link').href='product.html?id='+encodeURIComponent(p.id);const colors=getProductColors(p),colorSelect=$('#quick-view-color'),sizeSelect=$('#quick-view-size'),swatches=$('#quick-color-swatches');colorSelect.innerHTML='<option value="">Selecciona</option>'+colors.map(c=>{const sold=getColorStock(p,c.name)<=0;return `<option value="${c.name}" ${sold?'disabled':''}>${c.name}${sold?' — Agotado':''}</option>`}).join('');swatches.innerHTML=renderColorSwatches(colors,colors.length===1?colors[0].name:'');colorSelect.value=colors.length===1?colors[0].name:'';$('#quick-view-qty').value=1;syncQuickSwatches(p);colorSelect.onchange=()=>syncQuickSwatches(p);sizeSelect.onchange=()=>clampQtyToStock($('#quick-view-qty'),p,colorSelect.value,sizeSelect.value);$$('.color-swatch',swatches).forEach(btn=>btn.onclick=()=>{if(getColorStock(p,btn.dataset.color)<=0)return;colorSelect.value=btn.dataset.color;syncQuickSwatches(p)});const add=$('#quick-view-add');const soldOut=isProductSoldOut(p);add.disabled=soldOut;add.textContent=soldOut?'Agotado':'Agregar al carrito';add.onclick=()=>{if(soldOut)return;if(!colorSelect.value||!sizeSelect.value){alert('Selecciona color y talla para continuar.');return}const stock=getVariantStock(p,colorSelect.value,sizeSelect.value);if(Number.isFinite(stock)&&stock<=0){alert('Esta variante está agotada.');return}if(addToCart(p.id,$('#quick-view-qty').value,{color:colorSelect.value,size:sizeSelect.value}))closeQuickView()};$('#quick-view-overlay').classList.add('show');document.body.style.overflow='hidden'}
function closeQuickView(){const q=$('#quick-view-overlay');if(q)q.classList.remove('show');document.body.style.overflow=''}

function getCartDetailed(){return getCart().map(item=>{const p=PRODUCTS.find(x=>x.id===item.id);if(!p)return null;return {...item,product:p,image:getProductImage(p,item.color||''),subtotal:Number(p.price)*item.qty}}).filter(Boolean)}
function updateCartItem(index,qty){const c=getCart();if(index<0||index>=c.length)return;const item=c[index],p=PRODUCTS.find(x=>x.id===item.id);let amount=Math.max(1,parseInt(qty,10)||1);if(p){const stock=getVariantStock(p,item.color||'',item.size||'');if(Number.isFinite(stock)){if(stock<=0){alert('Esta variante está agotada. Elimínala del carrito para continuar.');return}if(amount>stock){amount=stock;alert(`Solo hay ${stock} pieza${stock===1?'':'s'} disponibles de esta variante.`)}}}c[index].qty=amount;setCart(c)}
function removeCartItem(index){const c=getCart();if(index<0||index>=c.length)return;c.splice(index,1);setCart(c)}
function cartSubtotal(){return getCartDetailed().reduce((sum,item)=>sum+item.subtotal,0)}
const SHIPPING_FEE=180;
const FREE_SHIPPING_MIN=999;
let NR_LOCAL_DELIVERY={enabled:false,city:'Tlapa de Comonfort',state:'Guerrero',country:'México',postalCodes:[],fee:0,cashOnDelivery:false,label:'Entrega local'};
let NR_BANK_TRANSFER={enabled:false,paymentDeadlineHours:24,proofUploadEnabled:true};

function nrNormalizePlace(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[.,]/g,' ').replace(/\s+/g,' ').trim()}
function nrPlaceMatches(input,target){
  const a=nrNormalizePlace(input),b=nrNormalizePlace(target);
  if(!a||!b)return false;
  return a===b||(Math.min(a.length,b.length)>=5&&(a.startsWith(b)||b.startsWith(a)));
}
function nrPostal(value){return String(value||'').replace(/\D/g,'').slice(0,5)}
function localDeliveryEligible(state={}){
  const s=NR_LOCAL_DELIVERY||{};
  if(!s.enabled)return false;
  if(!nrPlaceMatches(state.ciudad,s.city)||!nrPlaceMatches(state.estado,s.state)||!nrPlaceMatches(state.pais||'México',s.country))return false;
  const codes=Array.isArray(s.postalCodes)?s.postalCodes.map(nrPostal).filter(Boolean):[];
  return !codes.length||codes.includes(nrPostal(state.cp));
}
function checkoutShippingCost(subtotal,state={}){
  if(state.deliveryMethod==='local'&&localDeliveryEligible(state))return Number(NR_LOCAL_DELIVERY.fee)||0;
  return shippingCost(subtotal);
}
async function loadLocalDeliveryConfig(){
  try{
    const r=await fetch('/api/local-delivery',{cache:'no-store'});
    if(r.ok){const data=await r.json();if(data.settings)NR_LOCAL_DELIVERY=data.settings}
  }catch{}
}
async function loadBankTransferConfig(){
  try{
    const r=await fetch('/api/bank-transfer',{cache:'no-store'});
    if(r.ok){const data=await r.json();if(data.settings)NR_BANK_TRANSFER=data.settings}
  }catch{}
}

function shippingCost(subtotal){return Number(subtotal)>=FREE_SHIPPING_MIN?0:SHIPPING_FEE}
function money(value){return 'MX$'+Number(value).toFixed(2)}
function cartPromoCode(){return String(getCheckoutState().promoCode||'').trim().toUpperCase()}
function cartOrderNote(){return String(getCheckoutState().nota||'')}
async function evaluateCartPromotion(promoCode='',checkout={}){
  try{
    const res=await fetch('/api/promotions/evaluate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:stripeCartPayload(),promoCode:String(promoCode||'').trim().toUpperCase(),checkout})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)return {ok:false,error:data.error||'El código promocional no es válido.'};
    return data;
  }catch{return {ok:false,error:'No fue posible validar la promoción.'}}
}
function renderCartExtras(promoEval=null){
  const state=getCheckoutState(),promo=String(state.promoCode||''),note=String(state.nota||'');
  const promoPanel=$('#cart-promo-panel'),notePanel=$('#cart-note-panel');
  if(promoPanel){
    promoPanel.innerHTML=`<div class="cart-extra-box">
      <div class="cart-extra-input-row">
        <input id="cart-promo-input" type="text" maxlength="40" value="${heroEscape(promo)}" placeholder="Código promocional">
        <button type="button" id="cart-promo-apply">Aplicar</button>
      </div>
      <div class="cart-extra-feedback ${promoEval&&!promoEval.ok?'error':''}" id="cart-promo-feedback">${promoEval&&!promoEval.ok?heroEscape(promoEval.error||''):promo&&promoEval?.promotion?`Aplicado: ${heroEscape(promoEval.promotion.name)}`:''}</div>
      ${promo?'<button type="button" class="cart-extra-remove" id="cart-promo-remove">Quitar código</button>':''}
    </div>`;
  }
  if(notePanel){
    notePanel.innerHTML=`<div class="cart-extra-box">
      <textarea id="cart-note-input" maxlength="500" rows="4" placeholder="Ej. Instrucciones de entrega o alguna observación para tu pedido.">${heroEscape(note)}</textarea>
      <div class="cart-extra-note-actions"><small>Máximo 500 caracteres.</small><button type="button" id="cart-note-save">Guardar nota</button></div>
      <div class="cart-extra-feedback" id="cart-note-feedback">${note?'Nota guardada.':''}</div>
    </div>`;
  }
  $('#cart-promo-apply')?.addEventListener('click',async()=>{
    const input=$('#cart-promo-input'),code=String(input?.value||'').trim().toUpperCase();
    if(!code){const f=$('#cart-promo-feedback');if(f)f.textContent='Escribe un código promocional.';return}
    setCheckoutState({promoCode:code});
    await renderCartPage();
  });
  $('#cart-promo-remove')?.addEventListener('click',async()=>{setCheckoutState({promoCode:''});await renderCartPage()});
  $('#cart-note-save')?.addEventListener('click',()=>{
    const value=String($('#cart-note-input')?.value||'').trim().slice(0,500);
    setCheckoutState({nota:value});
    const feedback=$('#cart-note-feedback');if(feedback)feedback.textContent=value?'Nota guardada.':'Nota eliminada.';
  });
}
async function renderCartPage(){
  const list=$('#cart-page-items'),empty=$('#cart-page-empty'),summary=$('#cart-summary');
  if(!list||!summary)return;
  const items=getCartDetailed();
  if(!items.length){
    if(empty)empty.hidden=false;list.innerHTML='';
    summary.innerHTML=`<div class="cart-summary-box"><h2>Resumen del pedido</h2><div class="cart-summary-line"><span>Subtotal</span><strong>MX$0.00</strong></div><div class="cart-summary-line"><span>Envío</span><strong>—</strong></div><div class="cart-summary-sep"></div><div class="cart-summary-total"><span>Total</span><strong>MX$0.00</strong></div><button class="cart-checkout-main" type="button" disabled>Checkout</button><button class="paypal-main" type="button" disabled><span class="paypal-word">PayPal</span> Pagar</button><div class="secure-checkout"><img class="secure-checkout-icon" src="assets/icons/cart/icono-candado.svg" alt="" aria-hidden="true"> <span>Secure Checkout</span></div></div>`;return;
  }
  if(empty)empty.hidden=true;
  list.innerHTML=items.map((item,index)=>`<article class="cart-page-item"><a class="cart-page-thumb" href="product.html?id=${encodeURIComponent(item.id)}"><img src="${item.image}" alt="${item.product.name}"></a><div class="cart-page-meta"><a class="cart-page-name" href="product.html?id=${encodeURIComponent(item.id)}">${item.product.name}</a>${item.color?`<div class="cart-page-variant">Color: ${item.color}</div>`:''}${item.size&&item.size!=='Selecciona'?`<div class="cart-page-variant">Talla: ${item.size}</div>`:''}</div><div class="cart-page-qty"><button type="button" class="cart-qty-btn" data-cart-minus="${index}">−</button><input type="number" min="1" value="${item.qty}" data-cart-qty="${index}"><button type="button" class="cart-qty-btn" data-cart-plus="${index}">+</button></div><div class="cart-page-price">${money(item.product.price)}</div><button class="cart-remove" type="button" aria-label="Eliminar producto" title="Eliminar producto" data-cart-remove="${index}"><img class="cart-remove-icon" src="assets/icons/cart/icono-bote-basura.svg" alt="" aria-hidden="true"></button></article>`).join('');
  $$('[data-cart-minus]').forEach(btn=>btn.onclick=async()=>{const i=+btn.dataset.cartMinus;updateCartItem(i,Math.max(1,(getCart()[i]?.qty||1)-1));await renderCartPage()});
  $$('[data-cart-plus]').forEach(btn=>btn.onclick=async()=>{const i=+btn.dataset.cartPlus;updateCartItem(i,(getCart()[i]?.qty||1)+1);await renderCartPage()});
  $$('[data-cart-qty]').forEach(input=>input.onchange=async()=>{updateCartItem(+input.dataset.cartQty,input.value);await renderCartPage()});
  $$('[data-cart-remove]').forEach(btn=>btn.onclick=async()=>{removeCartItem(+btn.dataset.cartRemove);await renderCartPage()});

  const state=getCheckoutState(),promo=cartPromoCode();
  const promoEval=await evaluateCartPromotion(promo,{...state,deliveryMethod:'national'});
  const subtotal=cartSubtotal();
  const totals=promoEval.ok?promoEval.totals:{subtotal,discount:0,shipping:shippingCost(subtotal),total:subtotal+shippingCost(subtotal)};
  const applied=promoEval.ok?promoEval.promotion:null;
  summary.innerHTML=`<div class="cart-summary-box"><h2>Resumen del pedido</h2><div class="cart-summary-line"><span>Subtotal</span><strong>${money(totals.subtotal)}</strong></div>${totals.discount?`<div class="cart-summary-line cart-discount-line"><span>Descuento${applied?.name?' · '+heroEscape(applied.name):''}</span><strong>- ${money(totals.discount)}</strong></div>`:''}<div class="cart-summary-line"><span>Envío</span><strong>${totals.shipping===0?'Gratis':money(totals.shipping)}</strong></div>${applied&&applied.discountType==='free_shipping'?`<div class="cart-promo-applied">Promoción aplicada: ${heroEscape(applied.name)}</div>`:''}<div class="cart-summary-country">México · Envío gratis desde ${money(FREE_SHIPPING_MIN)}</div><div class="cart-summary-sep"></div><div class="cart-summary-total"><span>Total</span><strong>${money(totals.total)}</strong></div><button class="cart-checkout-main" type="button" id="go-checkout">Checkout</button><button class="paypal-main" type="button" id="go-paypal"><span class="paypal-word">PayPal</span> Pagar</button><div class="secure-checkout"><img class="secure-checkout-icon" src="assets/icons/cart/icono-candado.svg" alt="" aria-hidden="true"> <span>Secure Checkout</span></div></div>`;
  $('#go-checkout')?.addEventListener('click',()=>location.href='checkout.html');
  $('#go-paypal')?.addEventListener('click',()=>{setCheckoutState({paymentMethod:'paypal'});location.href='checkout.html'});
  $('#cart-promo-toggle')?.addEventListener('click',()=>$('#cart-promo-panel')?.classList.toggle('open'));
  $('#cart-note-toggle')?.addEventListener('click',()=>$('#cart-note-panel')?.classList.toggle('open'));
  renderCartExtras(promoEval);
  // V127.38: si el cupón escrito no es válido, conservamos el mensaje visual
  // pero lo quitamos del estado activo para que no bloquee el checkout.
  if(promo&&!promoEval.ok&&promoEval.error!=='No fue posible validar la promoción.')setCheckoutState({promoCode:''});
  if(promo||(!promo&&applied))$('#cart-promo-panel')?.classList.add('open');
  if(!promo&&applied){const f=$('#cart-promo-feedback');if(f)f.textContent=`Promoción automática: ${applied.name}`}
  if(cartOrderNote())$('#cart-note-panel')?.classList.add('open');
}

function getCheckoutState(){try{return JSON.parse(sessionStorage.getItem('nr_checkout_state')||'{}')}catch(e){return{}}}
function setCheckoutState(data){sessionStorage.setItem('nr_checkout_state',JSON.stringify({...getCheckoutState(),...data}))}
function checkoutDiscount(){return 0}

function paymentMethodPanel(method,total){
  const amount=money(total);
  if(method==='paypal') return `<div class="payment-method-detail"><div class="payment-detail-brand paypal">PayPal</div><p>Al continuar, serás enviado a PayPal para aprobar el pago de forma segura. Después regresarás a Niños Rancios para confirmar tu pedido.</p><div class="payment-integration-note">El importe se calcula y valida nuevamente en nuestro servidor antes de crear la orden de PayPal.</div></div>`;
  if(method==='stripe') return `<div class="payment-method-detail"><div class="payment-detail-brand stripe">Tarjeta · Stripe</div><p>El pago con tarjeta se procesará de forma segura mediante Stripe. Niños Rancios no almacena los datos completos de la tarjeta.</p><div id="stripe-payment-element" class="stripe-payment-element"><div class="stripe-loading">Preparando campos seguros de pago…</div></div><div id="stripe-payment-message" class="stripe-payment-message" role="status"></div><div class="payment-integration-note" id="stripe-mode-note">Comprobando la configuración segura de Stripe…</div></div>`;
  if(method==='contraentrega') return `<div class="payment-method-detail"><div class="payment-detail-brand transfer">Pago contraentrega</div><p>Paga al momento de recibir tu pedido mediante la entrega local.</p><div class="payment-integration-note">Disponible únicamente para direcciones elegibles en la zona local configurada.</div></div>`;
  if(method==='transferencia') return `<div class="payment-method-detail"><div class="payment-detail-brand transfer">Transferencia bancaria</div><p>Se generará un pedido por <strong>${amount}</strong> con estado <strong>Pendiente de pago</strong>. Al crearlo verás los datos bancarios y tu referencia.</p><div class="transfer-flow"><span>1. Crear pedido</span><span>2. Realizar transferencia</span><span>3. Subir comprobante</span><span>4. Confirmamos el pago</span></div><div class="payment-integration-note">Procura realizar la transferencia dentro de ${Number(NR_BANK_TRANSFER.paymentDeadlineHours)||24} horas. El inventario quedará reservado para tu pedido mientras se valida el pago.</div></div>`;
  return `<div class="payment-method-detail"><div class="payment-detail-brand mercado">Mercado Pago</div><p>Al continuar, serás enviado al Checkout Pro de Mercado Pago para completar el pago de forma segura. Después regresarás a Niños Rancios para confirmar tu pedido.</p><div class="payment-integration-note">El total se calcula nuevamente en nuestro servidor y el Checkout Pro se inicia mediante una preferencia de Mercado Pago.</div></div>`;
}

let nrStripe=null;
let nrStripeElements=null;
let nrStripePaymentElement=null;
let nrStripeClientSecret='';
let nrStripeMode='unknown';
let nrStripePublicConfigPromise=null;
function stripeKeyMode(key){const value=String(key||'').trim();if(value.startsWith('pk_test_'))return 'test';if(value.startsWith('pk_live_'))return 'live';return 'unknown'}
async function stripePublicConfig(){
  if(nrStripePublicConfigPromise)return nrStripePublicConfigPromise;
  nrStripePublicConfigPromise=(async()=>{
    const fallback=(window.NR_STRIPE_PUBLISHABLE_KEY||'').trim();
    let server={};
    try{const response=await fetch('/api/stripe/config',{cache:'no-store'});if(response.ok)server=await response.json()}catch{}
    if(server.keyMismatch)throw new Error('Las claves de Stripe pertenecen a entornos distintos (prueba/real). Revisa server/.env.');
    const key=String(server.publishableKey||fallback||'').trim();
    const clientMode=stripeKeyMode(key);
    const serverMode=String(server.mode||'unknown');
    if(serverMode!=='unknown'&&clientMode!=='unknown'&&serverMode!==clientMode)throw new Error('La clave publicable y la clave del servidor de Stripe no pertenecen al mismo entorno.');
    nrStripeMode=serverMode!=='unknown'?serverMode:clientMode;
    return {key,mode:nrStripeMode,serverConfigured:server.serverConfigured!==false,webhookConfigured:!!server.webhookConfigured};
  })();
  return nrStripePublicConfigPromise;
}
function updateStripeModeNote(config){
  const note=$('#stripe-mode-note');if(!note)return;
  if(config?.mode==='live')note.textContent='Pago real habilitado. El cargo se realizará mediante Stripe al confirmar.';
  else if(config?.mode==='test')note.textContent='Modo de prueba: puedes probar el checkout sin realizar cargos reales.';
  else note.textContent='Stripe está configurado, pero no pudimos identificar si las claves son de prueba o reales.';
}
function stripeMessage(message,type='info'){
  const el=$('#stripe-payment-message');
  if(!el)return;
  el.textContent=message||'';
  el.className='stripe-payment-message '+(type||'info');
}
function stripeCartPayload(){
  return getCart().map(i=>({id:i.id,qty:i.qty,color:i.color||'',size:i.size||''}));
}
async function mountStripePaymentElement(){
  const target=$('#stripe-payment-element');
  if(!target)return;
  if(typeof Stripe!=='function'){
    target.innerHTML='<div class="stripe-error-box">No se pudo cargar Stripe.js. Revisa tu conexión a internet.</div>';
    return;
  }
  let publicConfig;
  try{publicConfig=await stripePublicConfig()}catch(err){target.innerHTML='<div class="stripe-error-box">La configuración de Stripe no es válida.</div>';stripeMessage(err.message||'Revisa las claves de Stripe.','error');return}
  const key=publicConfig.key;
  updateStripeModeNote(publicConfig);
  if(!key){
    target.innerHTML='<div class="stripe-error-box">Falta configurar la Publishable Key de Stripe.</div>';
    stripeMessage('Agrega STRIPE_PUBLISHABLE_KEY en server/.env o configura el valor de respaldo del frontend.','error');
    return;
  }
  if(location.protocol==='file:'){
    target.innerHTML='<div class="stripe-error-box">Stripe necesita abrir la tienda desde el servidor incluido, no directamente como archivo local.</div>';
    stripeMessage('La Publishable Key ya está integrada. Falta ejecutar el backend de prueba para generar el pago seguro.','info');
    return;
  }
  target.innerHTML='<div class="stripe-loading">Conectando con Stripe…</div>';
  try{
    const state=getCheckoutState();
    const response=await fetch('/api/stripe/create-payment-intent',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({items:stripeCartPayload(),promoCode:state.promoCode||'',email:state.email||'',checkout:state})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.clientSecret)throw new Error(data.error||'No fue posible preparar el pago con Stripe.');
    nrStripe=Stripe(key);
    nrStripeClientSecret=data.clientSecret;
    nrStripeElements=nrStripe.elements({
      clientSecret:nrStripeClientSecret,
      appearance:{theme:'stripe',variables:{fontFamily:'Arial, sans-serif',borderRadius:'0px'}}
    });
    nrStripePaymentElement=nrStripeElements.create('payment',{layout:'tabs'});
    target.innerHTML='';
    let stripeReady=false;
    const readyTimer=setTimeout(()=>{
      if(!stripeReady){
        stripeMessage('Stripe respondió, pero los campos de tarjeta todavía no terminan de cargar. Revisa que la clave publicable y la secreta pertenezcan al mismo entorno/cuenta de prueba y que el navegador no esté bloqueando Stripe.','error');
      }
    },10000);
    nrStripePaymentElement.on('loaderstart',()=>{
      stripeMessage('Cargando campos seguros de Stripe…','info');
    });
    nrStripePaymentElement.on('ready',()=>{
      stripeReady=true;
      clearTimeout(readyTimer);
      stripeMessage('Campos seguros de Stripe listos.','success');
    });
    nrStripePaymentElement.on('loaderror',(event)=>{
      stripeReady=false;
      clearTimeout(readyTimer);
      const msg=event&&event.error&&event.error.message ? event.error.message : 'Stripe no pudo renderizar los campos de pago.';
      console.error('Stripe Payment Element loaderror',event);
      stripeMessage('No se pudieron cargar los campos seguros de Stripe: '+msg,'error');
    });
    nrStripePaymentElement.mount('#stripe-payment-element');
  }catch(err){
    target.innerHTML='<div class="stripe-error-box">No se pudieron cargar los campos seguros de Stripe.</div>';
    stripeMessage(err.message||'Error al conectar con Stripe.','error');
  }
}
async function submitStripePayment(button){
  if(!nrStripe||!nrStripeElements){
    stripeMessage('Primero deben cargarse los campos seguros de Stripe.','error');
    return;
  }
  if(button){button.disabled=true;button.textContent='Procesando…'}
  stripeMessage(nrStripeMode==='live'?'Procesando pago…':'Procesando pago de prueba…','info');
  try{
    const checkoutForm=$('#checkout-form');
    if(checkoutForm)setCheckoutState(Object.fromEntries(new FormData(checkoutForm).entries()));
    const state=getCheckoutState();
    const paymentIntentId=(nrStripeClientSecret||'').split('_secret_')[0];
    if(paymentIntentId){
      const draftResponse=await fetch('/api/stripe/update-payment-draft',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({paymentIntentId,items:stripeCartPayload(),promoCode:state.promoCode||'',checkout:state})
      });
      if(!draftResponse.ok)throw new Error('No fue posible guardar los datos finales del pedido.');
    }
    const result=await nrStripe.confirmPayment({
      elements:nrStripeElements,
      confirmParams:{return_url:new URL('payment-success.html',location.href).href}
    });
    if(result&&result.error){
      stripeMessage(result.error.message||'No se pudo completar el pago.','error');
      if(button){button.disabled=false;button.textContent='Pagar con tarjeta'}
    }
  }catch(err){
    stripeMessage(err.message||'No se pudo completar el pago.','error');
    if(button){button.disabled=false;button.textContent='Pagar con tarjeta'}
  }
}
function paymentSubmitLabel(method){
  if(method==='paypal') return 'Continuar con PayPal';
  if(method==='stripe') return 'Pagar con tarjeta';
  if(method==='contraentrega') return 'Confirmar pedido';
  if(method==='transferencia') return 'Crear pedido';
  return 'Continuar con Mercado Pago';
}

async function renderCheckoutPage(){
  const wrap=$('#checkout-root');if(!wrap)return;
  const items=getCartDetailed(),subtotal=cartSubtotal(),state=getCheckoutState(),promoCode=state.promoCode||'';
  const eligible=localDeliveryEligible(state);
  let deliveryMethod=(state.deliveryMethod==='local'&&eligible)?'local':'national';
  let paymentMethod=state.paymentMethod||'mercadopago';
  if(paymentMethod==='contraentrega'&&!(eligible&&deliveryMethod==='local'&&NR_LOCAL_DELIVERY.cashOnDelivery))paymentMethod='mercadopago';
  if(paymentMethod==='transferencia'&&!NR_BANK_TRANSFER.enabled)paymentMethod='mercadopago';
  const effectiveState={...state,deliveryMethod,paymentMethod};
  const promoEval=items.length?await evaluateCartPromotion(promoCode,effectiveState):{ok:true,totals:{subtotal:0,discount:0,shipping:0,total:0},promotion:null};
  // V127.38: un cupón inválido se muestra como error, pero deja de considerarse activo.
  // Así el cliente puede continuar con su compra sin tener que borrarlo manualmente.
  const promoValidationUnavailable=!promoEval.ok&&promoEval.error==='No fue posible validar la promoción.';
  if(promoCode&&!promoEval.ok&&!promoValidationUnavailable)setCheckoutState({promoCode:''});
  const fallbackShipping=checkoutShippingCost(subtotal,effectiveState);
  const discount=promoEval.ok?Number(promoEval.totals?.discount||0):0;
  const shipping=promoEval.ok?Number(promoEval.totals?.shipping||0):fallbackShipping;
  const total=promoEval.ok?Number(promoEval.totals?.total||0):Math.max(0,subtotal-discount)+shipping;
  const appliedPromotion=promoEval.ok?promoEval.promotion:null;
  const itemsCount=items.reduce((a,b)=>a+b.qty,0);

  if(!items.length){
    wrap.innerHTML=`<div class="checkout-header"><a class="checkout-brand" href="index.html"><img src="assets/logo-ninos-rancios.svg" alt="Niños Rancios"><span>CHECKOUT</span></a><a class="checkout-back" href="shop-all.html">Seguir comprando</a></div><div class="checkout-shell"><section class="checkout-main empty"><div class="checkout-empty-icon">⊗</div><h1>No hay productos en tu carrito</h1><p>Agrega productos antes de continuar con el checkout.</p><a class="checkout-empty-btn" href="shop-all.html">Ir a la tienda</a></section><aside class="checkout-side"><div class="checkout-summary-box"><h2>Resumen del pedido (0 artículos)</h2><div class="checkout-totals"><div><span>Subtotal</span><strong>MX$0.00</strong></div><div><span>Envío</span><strong>—</strong></div><div class="checkout-total"><span>Total</span><strong>MX$0.00</strong></div></div></div></aside></div>`;
    return;
  }

  const localOption=eligible?`<label class="checkout-radio local-delivery-option ${deliveryMethod==='local'?'selected':''}"><input type="radio" name="deliveryMethod" value="local" ${deliveryMethod==='local'?'checked':''}><div><strong>${heroEscape(NR_LOCAL_DELIVERY.label||'Entrega local')}</strong><span>${Number(NR_LOCAL_DELIVERY.fee)===0?'Gratis':money(NR_LOCAL_DELIVERY.fee)} · Disponible para esta dirección${NR_LOCAL_DELIVERY.cashOnDelivery?' · Pago contraentrega disponible':''}</span></div></label>`:'';
  const codOption=(eligible&&deliveryMethod==='local'&&NR_LOCAL_DELIVERY.cashOnDelivery)?`<label class="payment-option ${paymentMethod==='contraentrega'?'selected':''}"><input type="radio" name="paymentMethod" value="contraentrega" ${paymentMethod==='contraentrega'?'checked':''}><span class="payment-option-copy"><strong>Pago contraentrega</strong><small>Paga cuando recibas tu pedido local</small></span></label>`:'';

  wrap.innerHTML=`<div class="checkout-header"><a class="checkout-brand" href="index.html"><img src="assets/logo-ninos-rancios.svg" alt="Niños Rancios"><span>CHECKOUT</span></a><a class="checkout-back" href="shop-all.html">Seguir comprando</a></div><div class="checkout-shell"><section class="checkout-main"><div class="checkout-main-scroll"><h1>Finaliza tu compra</h1><p class="checkout-intro">Completa tus datos para continuar con tu pedido.</p><form class="checkout-form" id="checkout-form"><div class="checkout-card"><h3>Información de contacto</h3><div class="checkout-fields two"><label><span>Nombre</span><input type="text" name="nombre" value="${state.nombre||''}" placeholder="Tu nombre" autocomplete="given-name" required></label><label><span>Apellidos</span><input type="text" name="apellidos" value="${state.apellidos||''}" placeholder="Tus apellidos" autocomplete="family-name" required></label></div><div class="checkout-fields two"><label><span>Correo electrónico</span><input type="email" name="email" value="${state.email||''}" placeholder="correo@ejemplo.com" autocomplete="email" required></label><label><span>Teléfono</span><input type="tel" name="telefono" value="${state.telefono||''}" placeholder="Tu número de contacto" autocomplete="tel" required></label></div></div><div class="checkout-card"><h3>Dirección de envío</h3><div class="checkout-fields"><label><span>Calle y número</span><input type="text" name="calle" value="${state.calle||''}" placeholder="Av. / Calle y número" autocomplete="street-address" required></label></div><div class="checkout-fields two"><label><span>Colonia</span><input type="text" name="colonia" value="${state.colonia||''}" placeholder="Colonia" required></label><label><span>Código postal</span><input type="text" name="cp" value="${state.cp||''}" placeholder="C.P." autocomplete="postal-code" inputmode="numeric" required></label></div><div class="checkout-fields three"><label><span>Ciudad</span><input type="text" name="ciudad" value="${state.ciudad||''}" placeholder="Ciudad" autocomplete="address-level2" required></label><label><span>Estado</span><input type="text" name="estado" value="${state.estado||''}" placeholder="Estado" autocomplete="address-level1" required></label><label><span>País</span><input type="text" name="pais" value="${state.pais||'México'}" placeholder="País" autocomplete="country-name" required></label></div>${eligible?'<div class="local-delivery-eligible">✓ Esta dirección tiene entrega local disponible.</div>':''}</div><div class="checkout-card"><h3>Nota para el pedido</h3><label class="checkout-note-field"><span>Opcional</span><textarea name="nota" maxlength="500" rows="4" placeholder="Ej. Instrucciones de entrega o alguna observación.">${state.nota||''}</textarea></label></div><div class="checkout-card"><h3>Método de entrega</h3><label class="checkout-radio ${deliveryMethod==='national'?'selected':''}"><input type="radio" name="deliveryMethod" value="national" ${deliveryMethod==='national'?'checked':''}><div><strong>Envío nacional</strong><span>${shippingCost(subtotal)===0?'Gratis':money(shippingCost(subtotal))} · Envío gratis en compras desde ${money(FREE_SHIPPING_MIN)}</span></div></label>${localOption}</div><div class="checkout-card payment-card"><h3>Método de pago</h3><div class="payment-methods"><label class="payment-option ${paymentMethod==='mercadopago'?'selected':''}"><input type="radio" name="paymentMethod" value="mercadopago" ${paymentMethod==='mercadopago'?'checked':''}><span class="payment-option-copy"><strong>Mercado Pago</strong><small>Pago en línea mediante Mercado Pago</small></span></label><label class="payment-option ${paymentMethod==='paypal'?'selected':''}"><input type="radio" name="paymentMethod" value="paypal" ${paymentMethod==='paypal'?'checked':''}><span class="payment-option-copy"><strong>PayPal</strong><small>Paga con tu cuenta de PayPal</small></span></label><label class="payment-option ${paymentMethod==='stripe'?'selected':''}"><input type="radio" name="paymentMethod" value="stripe" ${paymentMethod==='stripe'?'checked':''}><span class="payment-option-copy"><strong>Tarjeta con Stripe</strong><small>Tarjeta de crédito o débito</small></span></label>${NR_BANK_TRANSFER.enabled?`<label class="payment-option ${paymentMethod==='transferencia'?'selected':''}"><input type="radio" name="paymentMethod" value="transferencia" ${paymentMethod==='transferencia'?'checked':''}><span class="payment-option-copy"><strong>Transferencia bancaria</strong><small>El pedido quedará pendiente hasta confirmar el depósito</small></span></label>`:''}${codOption}</div>${paymentMethodPanel(paymentMethod,total)}</div><div class="checkout-actions"><button type="submit" class="place-order-btn">${paymentSubmitLabel(paymentMethod)}</button><div class="checkout-secure">${paymentMethod==='contraentrega'?'<span class="checkout-secure-package">📦</span><span>Pagarás al recibir tu pedido</span>':'<img class="checkout-secure-icon" src="assets/icons/cart/icono-candado-checkout.svg" alt="" aria-hidden="true"><span>El pago se procesará con el proveedor seleccionado</span>'}</div></div></form></div></section><aside class="checkout-side"><div class="checkout-summary-box"><h2>Resumen del pedido (${itemsCount} ${itemsCount===1?'artículo':'artículos'})</h2><div class="checkout-items">${items.map(item=>`<article class="checkout-item"><div class="checkout-item-img"><img src="${item.image}" alt="${item.product.name}"><span class="checkout-badge">${item.qty}</span></div><div class="checkout-item-copy"><div class="checkout-item-top"><strong>${item.product.name}</strong><span>${money(item.subtotal)}</span></div>${item.color?`<div class="checkout-item-meta">Color: ${item.color}</div>`:''}${item.size&&item.size!=='Selecciona'?`<div class="checkout-item-meta">Talla: ${item.size}</div>`:''}<button type="button" class="checkout-show-more">Mostrar más ▾</button></div></article>`).join('')}</div><div class="checkout-promo"><button type="button" class="promo-toggle" id="promo-toggle"><img class="promo-toggle-icon" src="assets/icons/cart/icono-etiqueta-checkout.svg" alt="" aria-hidden="true"><span>Ingresar un código promocional</span></button><div class="promo-box ${promoCode?'open':''}" id="promo-box"><input type="text" id="promo-code-input" value="${promoCode}" placeholder="Código promocional"><button type="button" id="promo-apply">Aplicar</button></div><div class="promo-help ${!promoEval.ok?'promo-error':''}">${!promoEval.ok?heroEscape(promoEval.error||'Código no válido'):appliedPromotion?`${promoCode?'Cupón':'Promoción automática'}: <strong>${heroEscape(appliedPromotion.name)}</strong>`:''}</div></div><div class="checkout-totals"><div><span>Subtotal</span><strong>${money(subtotal)}</strong></div><div><span>${deliveryMethod==='local'?'Entrega local':'Envío'}</span><strong>${shipping===0?'Gratis':money(shipping)}</strong></div>${discount?`<div><span>Descuento${appliedPromotion?.name?' · '+heroEscape(appliedPromotion.name):''}</span><strong>- ${money(discount)}</strong></div>`:''}<div class="checkout-total"><span>Total</span><strong>${money(total)}</strong></div><div class="checkout-tax-note">IVA incluido</div></div></div></aside></div>`;

  $('#promo-toggle')?.addEventListener('click',()=>$('#promo-box')?.classList.toggle('open'));
  $('#promo-apply')?.addEventListener('click',async()=>{setCheckoutState({promoCode:$('#promo-code-input').value});await renderCheckoutPage()});
  const form=$('#checkout-form');
  form?.addEventListener('input',()=>setCheckoutState(Object.fromEntries(new FormData(form).entries())));
  $$('input[name="paymentMethod"]',form).forEach(r=>r.addEventListener('change',()=>{setCheckoutState(Object.fromEntries(new FormData(form).entries()));renderCheckoutPage()}));
  $$('input[name="deliveryMethod"]',form).forEach(r=>r.addEventListener('change',()=>{const data=Object.fromEntries(new FormData(form).entries());if(data.deliveryMethod!=='local'&&data.paymentMethod==='contraentrega')data.paymentMethod='mercadopago';setCheckoutState(data);renderCheckoutPage()}));
  ['ciudad','estado','pais','cp'].forEach(name=>form?.elements?.[name]?.addEventListener('change',()=>{setCheckoutState(Object.fromEntries(new FormData(form).entries()));renderCheckoutPage()}));

  form?.addEventListener('submit',async e=>{
    e.preventDefault();
    const fd=new FormData(e.currentTarget),method=fd.get('paymentMethod')||'mercadopago';
    setCheckoutState(Object.fromEntries(fd.entries()));
    if(method==='stripe'){await submitStripePayment($('.place-order-btn',e.currentTarget));return}
    if(method==='mercadopago'){
      const btn=$('.place-order-btn',e.currentTarget);btn.disabled=true;btn.textContent='Conectando con Mercado Pago…';
      try{
        const latest=getCheckoutState();
        let requestId=latest.mercadoPagoRequestId;
        if(!requestId){requestId=(window.crypto?.randomUUID?.()||`mp-${Date.now()}-${Math.random().toString(16).slice(2)}`);setCheckoutState({mercadoPagoRequestId:requestId})}
        const response=await fetch('/api/mercadopago/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:stripeCartPayload(),promoCode:latest.promoCode||'',checkout:latest,requestId})});
        const data=await response.json().catch(()=>({}));
        if(!response.ok||!data.checkoutUrl)throw new Error(data.error||'No fue posible iniciar Mercado Pago.');
        location.href=data.checkoutUrl;
      }catch(err){alert(err.message||'No fue posible iniciar el pago con Mercado Pago.');btn.disabled=false;btn.textContent='Continuar con Mercado Pago'}
      return;
    }
    if(method==='paypal'){
      const btn=$('.place-order-btn',e.currentTarget);btn.disabled=true;btn.textContent='Conectando con PayPal…';
      try{
        const latest=getCheckoutState();
        let requestId=latest.paypalRequestId;
        if(!requestId){requestId=(window.crypto?.randomUUID?.()||`paypal-${Date.now()}-${Math.random().toString(16).slice(2)}`);setCheckoutState({paypalRequestId:requestId})}
        const response=await fetch('/api/paypal/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:stripeCartPayload(),promoCode:latest.promoCode||'',checkout:latest,requestId})});
        const data=await response.json().catch(()=>({}));
        if(!response.ok||!data.approveUrl)throw new Error(data.error||'No fue posible iniciar PayPal.');
        location.href=data.approveUrl;
      }catch(err){alert(err.message||'No fue posible iniciar el pago con PayPal.');btn.disabled=false;btn.textContent='Continuar con PayPal'}
      return;
    }
    if(method==='contraentrega'){
      const btn=$('.place-order-btn',e.currentTarget);btn.disabled=true;btn.textContent='Creando pedido…';
      try{
        const latest=getCheckoutState();
        let requestId=latest.localOrderRequestId;
        if(!requestId){requestId=(window.crypto?.randomUUID?.()||`local-${Date.now()}-${Math.random().toString(16).slice(2)}`);setCheckoutState({localOrderRequestId:requestId})}
        const response=await fetch('/api/orders/cash-on-delivery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:stripeCartPayload(),promoCode:latest.promoCode||'',checkout:{...latest,deliveryMethod:'local'},requestId})});
        const data=await response.json().catch(()=>({}));
        if(!response.ok||!data.order)throw new Error(data.error||'No fue posible crear el pedido.');
        localStorage.removeItem('nr_cart_v3');
        sessionStorage.setItem('nr_last_order',JSON.stringify({orderNumber:data.order.orderNumber,email:data.order.customer?.email||''}));
        sessionStorage.removeItem('nr_checkout_state');
        location.href=`payment-success.html?orderNumber=${encodeURIComponent(data.order.orderNumber)}&email=${encodeURIComponent(data.order.customer?.email||'')}`;
      }catch(err){alert(err.message||'No fue posible crear el pedido.');btn.disabled=false;btn.textContent='Confirmar pedido'}
      return;
    }
    if(method==='transferencia'){
      const btn=$('.place-order-btn',e.currentTarget);btn.disabled=true;btn.textContent='Creando pedido…';
      try{
        const latest=getCheckoutState();
        let requestId=latest.transferRequestId;
        if(!requestId){requestId=(window.crypto?.randomUUID?.()||`transfer-${Date.now()}-${Math.random().toString(16).slice(2)}`);setCheckoutState({transferRequestId:requestId})}
        const response=await fetch('/api/orders/bank-transfer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:stripeCartPayload(),promoCode:latest.promoCode||'',checkout:latest,requestId})});
        const data=await response.json().catch(()=>({}));
        if(!response.ok||!data.order)throw new Error(data.error||'No fue posible crear el pedido por transferencia.');
        localStorage.removeItem('nr_cart_v3');
        sessionStorage.setItem('nr_last_order',JSON.stringify({orderNumber:data.order.orderNumber,email:data.order.customer?.email||''}));
        sessionStorage.setItem('nr_transfer_order',JSON.stringify(data.order));
        sessionStorage.removeItem('nr_checkout_state');
        location.href=`payment-success.html?provider=transfer&orderNumber=${encodeURIComponent(data.order.orderNumber)}&email=${encodeURIComponent(data.order.customer?.email||'')}`;
      }catch(err){alert(err.message||'No fue posible crear el pedido por transferencia.');btn.disabled=false;btn.textContent='Crear pedido'}
      return;
    }
    else alert('No fue posible procesar el método de pago seleccionado.');
  });
  if(paymentMethod==='stripe')setTimeout(mountStripePaymentElement,0);
}

function renderDrawer(){ensureDrawer();const box=$('#cart-items');if(!box)return;const c=getCart().map(i=>{const p=PRODUCTS.find(x=>x.id===i.id);return p?{...i,p}:null}).filter(Boolean);if(!c.length){box.innerHTML='<p style="color:#777;font-size:14px">Tu carrito está vacío.</p>';return}box.innerHTML=c.map(i=>`<div class="cart-item"><img src="${getProductImage(i.p,i.color||'')}"><div>${i.p.name}${i.color||i.size?`<div class="cart-variant">${i.color?`Color: ${i.color}`:''}${i.color&&i.size?' · ':''}${i.size?`Talla: ${i.size}`:''}</div>`:''}<span style="color:#777">MX$${i.p.price} × ${i.qty}</span></div><strong>MX$${(Number(i.p.price)*i.qty).toFixed(2)}</strong></div>`).join('')}
function renderGrid(selector,items,sale=false){const g=$(selector);if(g){g.innerHTML=items.map(p=>card(p,sale)).join('');setupShell()}}
function renderPaginatedGrid(gridSelector,items,paginationSelector,perPage=15,sale=false){const g=$(gridSelector),pager=$(paginationSelector);if(!g)return;const list=Array.isArray(items)?items:[];const pageSize=Math.max(1,parseInt(perPage,10)||15);const totalPages=Math.max(1,Math.ceil(list.length/pageSize));let currentPage=1;const draw=()=>{const start=(currentPage-1)*pageSize;renderGrid(gridSelector,list.slice(start,start+pageSize),sale);if(!pager)return;if(totalPages<=1){pager.hidden=true;pager.innerHTML='';return}pager.hidden=false;const pageButtons=Array.from({length:totalPages},(_,i)=>`<button class="${i+1===currentPage?'selected':''}" data-page="${i+1}">${i+1}</button>`).join('');pager.innerHTML=`<button class="pagination-prev" aria-label="Página anterior" ${currentPage===1?'disabled':''}>‹</button><div class="pagination-pages">${pageButtons}</div><span class="page-status">${currentPage} / ${totalPages}</span><button class="pagination-next" aria-label="Página siguiente" ${currentPage===totalPages?'disabled':''}>›</button>`;$('.pagination-prev',pager)?.addEventListener('click',()=>{if(currentPage>1){currentPage--;draw();g.scrollIntoView({behavior:'smooth',block:'start'})}});$('.pagination-next',pager)?.addEventListener('click',()=>{if(currentPage<totalPages){currentPage++;draw();g.scrollIntoView({behavior:'smooth',block:'start'})}});$$('[data-page]',pager).forEach(btn=>btn.addEventListener('click',()=>{currentPage=Number(btn.dataset.page)||1;draw();g.scrollIntoView({behavior:'smooth',block:'start'})}))};draw()}
async function syncProductsFromServer(){
  try{
    const res=await fetch('/api/products',{cache:'no-store'});
    if(!res.ok)return false;
    const data=await res.json();
    const incoming=Array.isArray(data.products)?data.products:[];
    if(!incoming.length)return false;
    const keepIds=new Set(incoming.map(p=>p.id));
    incoming.forEach(serverProduct=>{
      const local=PRODUCTS.find(p=>p.id===serverProduct.id);
      if(local)Object.assign(local,serverProduct);
      else PRODUCTS.push(serverProduct);
    });
    for(let i=PRODUCTS.length-1;i>=0;i--)if(!keepIds.has(PRODUCTS[i].id))PRODUCTS.splice(i,1);
    document.dispatchEvent(new CustomEvent('nr-products-updated'));
    return true;
  }catch(e){return false}
}
async function syncInventoryFromServer(){
  try{
    const res=await fetch('/api/inventory',{cache:'no-store'});
    if(!res.ok)return false;
    const data=await res.json();
    const inventory=data&&data.inventory?data.inventory:{};
    PRODUCTS.forEach(p=>{if(inventory[p.id])p.inventory=inventory[p.id]});
    document.dispatchEvent(new CustomEvent('nr-inventory-updated'));
    return true;
  }catch(e){return false}
}
function refreshInventoryViews(){
  if($('#home-grid'))renderPaginatedGrid('#home-grid',PRODUCTS,'#home-pagination',15);
  if($('#shop-grid'))renderPaginatedGrid('#shop-grid',PRODUCTS,'#shop-pagination',15);
  if($('#men-grid'))renderPaginatedGrid('#men-grid',PRODUCTS.filter(p=>p.category==='men'),'#men-grid-pagination',15,true);
  if($('#woman-grid'))renderPaginatedGrid('#woman-grid',PRODUCTS.filter(p=>p.category==='woman'),'#woman-grid-pagination',15,true);
  renderCartPage();
}
async function initPage(){
  await syncProductsFromServer();
  await loadLocalDeliveryConfig();
  await loadBankTransferConfig();
  await syncInventoryFromServer();
  renderCartCount();
  refreshInventoryViews();
  await prefillCheckoutFromAccount();
  await renderCheckoutPage();
  ensureDrawer();
  hydrateCustomerHeader();
}
document.addEventListener('DOMContentLoaded',initPage);
