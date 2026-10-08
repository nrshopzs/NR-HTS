const fs=require('fs');
const path=require('path');

const dataDir=path.join(__dirname,'data');
const productsFile=path.join(dataDir,'products.json');
const SHIPPING_CENTS=18000;
const FREE_SHIPPING_MIN_CENTS=99900;

function ensureProductsFile(){
  fs.mkdirSync(dataDir,{recursive:true});
  if(!fs.existsSync(productsFile))fs.writeFileSync(productsFile,'[]\n','utf8');
}
function readProducts(){
  ensureProductsFile();
  try{const data=JSON.parse(fs.readFileSync(productsFile,'utf8'));return Array.isArray(data)?data:[]}catch{return[]}
}
function writeProducts(products){
  ensureProductsFile();
  fs.writeFileSync(productsFile,JSON.stringify(products,null,2)+'\n','utf8');
}
function cleanText(value,max=4000){return String(value??'').trim().slice(0,max)}
function escapeHtmlText(value){
  return String(value??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
}
function sanitizeDescriptionHtml(value,max=12000){
  const source=String(value??'').replace(/\0/g,'').slice(0,max);
  const allowed=new Set(['p','br','strong','b','em','i','ul','ol','li']);
  let out='',last=0;
  const tagRe=/<!--[\s\S]*?-->|<\/?\s*[a-zA-Z][^>]*>/g;
  let match;
  while((match=tagRe.exec(source))){
    out+=escapeHtmlText(source.slice(last,match.index));
    const token=match[0];
    if(!token.startsWith('<!--')){
      const nameMatch=token.match(/^<\s*\/?\s*([a-zA-Z0-9]+)/);
      const name=(nameMatch?.[1]||'').toLowerCase();
      if(allowed.has(name)){
        const closing=/^<\s*\//.test(token);
        if(name==='br')out+='<br>';
        else out+=closing?`</${name}>`:`<${name}>`;
      }
    }
    last=tagRe.lastIndex;
  }
  out+=escapeHtmlText(source.slice(last));
  return out.trim();
}
function descriptionToPlain(html){
  return sanitizeDescriptionHtml(html)
    .replace(/<br>/gi,'\n')
    .replace(/<\/(?:p|li)>/gi,'\n')
    .replace(/<[^>]+>/g,'')
    .replace(/&nbsp;/g,' ')
    .replace(/&amp;/g,'&')
    .replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"')
    .replace(/\n{3,}/g,'\n\n')
    .trim()
    .slice(0,4000);
}
function uniqueList(value,maxItems=20,maxLen=60){
  const list=Array.isArray(value)?value:String(value||'').split(',');
  return [...new Set(list.map(v=>cleanText(v,maxLen)).filter(Boolean))].slice(0,maxItems);
}
function normalizeImagePath(value){
  const v=cleanText(value,500);
  if(!v)return '';
  return v.replace(/^\/+/, '');
}
function normalizeImages(value,fallback=''){
  const list=Array.isArray(value)?value:[];
  const images=[...new Set(list.map(normalizeImagePath).filter(Boolean))].slice(0,12);
  const first=normalizeImagePath(fallback);
  if(first&&!images.includes(first))images.unshift(first);
  return images.slice(0,12);
}
function publicProduct(raw={}){
  const price=Number(raw.price);
  const rawImg=normalizeImagePath(raw.img);
  const images=normalizeImages(raw.images,rawImg);
  const img=images[0]||rawImg;
  return {
    id:cleanText(raw.id,80),
    name:cleanText(raw.name,160),
    price:Number.isFinite(price)?price.toFixed(2):'0.00',
    img,
    images,
    category:['all','men','woman'].includes(raw.category)?raw.category:'all',
    colors:uniqueList(raw.colors,20,60),
    sizes:uniqueList(raw.sizes,20,20),
    description:cleanText(raw.description||descriptionToPlain(raw.descriptionHtml||''),4000),
    descriptionHtml:sanitizeDescriptionHtml(raw.descriptionHtml||`<p>${escapeHtmlText(cleanText(raw.description,4000))}</p>`),
    variantImages:Object.fromEntries(Object.entries(raw.variantImages||{}).map(([k,v])=>[cleanText(k,60),normalizeImagePath(v)]).filter(([k,v])=>k&&v))
  };
}
function getProducts(){return readProducts().map(publicProduct).filter(p=>p.id&&p.name)}
function getProductMap(){
  return Object.fromEntries(getProducts().map(p=>[p.id,{...p,price:Math.round(Number(p.price)*100),image:'/'+p.img.replace(/^\/+/, '')}]));
}
function updateProduct(id,changes={}){
  const productId=cleanText(id,80);
  const products=readProducts();
  const index=products.findIndex(p=>String(p.id)===productId);
  if(index<0)throw new Error('Producto no encontrado.');
  const current=publicProduct(products[index]);
  const name=cleanText(changes.name??current.name,160);
  const price=Number(changes.price??current.price);
  const descriptionHtml=sanitizeDescriptionHtml(
    changes.descriptionHtml!==undefined
      ? changes.descriptionHtml
      : (current.descriptionHtml||`<p>${escapeHtmlText(current.description||'')}</p>`)
  );
  const description=descriptionToPlain(descriptionHtml);
  const colors=uniqueList(changes.colors??current.colors,20,60);
  const sizes=uniqueList(changes.sizes??current.sizes,20,20);
  const category=['all','men','woman'].includes(changes.category)?changes.category:current.category;
  if(!name)throw new Error('El nombre del producto es obligatorio.');
  if(!Number.isFinite(price)||price<=0||price>1000000)throw new Error('Precio no válido.');
  if(!colors.length)throw new Error('Agrega al menos un color.');
  if(!sizes.length)throw new Error('Agrega al menos una talla.');
  const next={...products[index],name,price:Number(price.toFixed(2)),description,descriptionHtml,colors,sizes,category};
  products[index]=next;
  writeProducts(products);
  return publicProduct(next);
}

function slugify(value){
  return String(value??'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,70);
}
function createProduct(changes={}){
  const products=readProducts();
  const name=cleanText(changes.name,160);
  const price=Number(changes.price);
  const descriptionHtml=sanitizeDescriptionHtml(
    changes.descriptionHtml!==undefined
      ? changes.descriptionHtml
      : `<p>${escapeHtmlText(cleanText(changes.description,4000))}</p>`
  );
  const description=descriptionToPlain(descriptionHtml);
  const colors=uniqueList(changes.colors,20,60);
  const sizes=uniqueList(changes.sizes,20,20);
  const category=['all','men','woman'].includes(changes.category)?changes.category:'all';
  const images=normalizeImages(changes.images,changes.img);
  const img=images[0]||'';

  if(!name)throw new Error('El nombre del producto es obligatorio.');
  if(!Number.isFinite(price)||price<=0||price>1000000)throw new Error('Precio no válido.');
  if(!img)throw new Error('Agrega una imagen principal para el producto.');
  if(!colors.length)throw new Error('Agrega al menos un color.');
  if(!sizes.length)throw new Error('Agrega al menos una talla.');

  const base=slugify(name)||'producto';
  const used=new Set(products.map(p=>String(p.id||'')));
  let id=base,n=2;
  while(used.has(id))id=`${base}-${n++}`;

  const next={
    id,
    name,
    price:Number(price.toFixed(2)),
    img,
    images,
    category,
    colors,
    sizes,
    description,
    descriptionHtml,
    variantImages:{}
  };
  products.push(next);
  writeProducts(products);
  return publicProduct(next);
}

function updateProductImages(id,changes={}){
  const productId=cleanText(id,80);
  const products=readProducts();
  const index=products.findIndex(p=>String(p.id)===productId);
  if(index<0)throw new Error('Producto no encontrado.');

  const current=publicProduct(products[index]);
  let images=[...(current.images||[])];

  const add=Array.isArray(changes.addImages)
    ? changes.addImages.map(normalizeImagePath).filter(Boolean)
    : [];
  for(const image of add){
    if(!images.includes(image))images.push(image);
  }
  images=images.slice(0,12);

  const removeImage=normalizeImagePath(changes.removeImage);
  if(removeImage)images=images.filter(image=>image!==removeImage);

  const primaryImage=normalizeImagePath(changes.primaryImage);
  if(primaryImage){
    if(!images.includes(primaryImage))throw new Error('La imagen seleccionada no pertenece a este producto.');
    images=[primaryImage,...images.filter(image=>image!==primaryImage)];
  }

  if(!images.length)throw new Error('El producto debe conservar al menos una imagen.');

  const next={...products[index],img:images[0],images};
  products[index]=next;
  writeProducts(products);
  return publicProduct(next);
}

function calculateOrder(items=[],promoCode=''){
  if(!Array.isArray(items)||!items.length)throw new Error('El carrito está vacío.');
  const PRODUCTS=getProductMap();
  let subtotal=0;
  for(const item of items){
    const p=PRODUCTS[item.id];
    const qty=Math.max(1,Math.min(20,Number.parseInt(item.qty,10)||1));
    if(!p)throw new Error('Hay un producto no válido en el carrito.');
    subtotal+=p.price*qty;
  }
  const normalized=String(promoCode||'').trim().toUpperCase();
  const discount=(normalized==='NR10'||normalized==='RANCIOS10')?Math.round(subtotal*.10):0;
  const shipping=subtotal>=FREE_SHIPPING_MIN_CENTS?0:SHIPPING_CENTS;
  return {subtotal,discount,shipping,total:Math.max(0,subtotal-discount)+shipping};
}
module.exports={getProducts,getProductMap,createProduct,updateProduct,updateProductImages,calculateOrder};
