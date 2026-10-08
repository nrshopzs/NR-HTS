const adminState={orders:[],statuses:[],inventory:null,products:[],homepage:null,homepageSlide:0,homepagePreviewMode:'desktop',localDelivery:null,bankTransfer:null,promotions:[],promotionProducts:[],editingPromotionId:'',sizeGuide:null,emailTemplates:null,emailTemplateDefaults:null,emailTemplateKey:'order_paid',emailMode:'templates',emailHistory:[],composeOrderNumber:'',collaborations:null,maintenance:null};
const HOMEPAGE_RIBBON_PAGES=[{file:'index.html',label:'Inicio'},{file:'shop-all.html',label:'Tienda / Shop All'},{file:'woman.html',label:'Mujer'},{file:'men.html',label:'Hombre'},{file:'product.html',label:'Detalle de producto'},{file:'about-us.html',label:'Nosotros'},{file:'contact.html',label:'Contacto'},{file:'privacy.html',label:'Aviso de privacidad'},{file:'returns.html',label:'Cambios y devoluciones'},{file:'shipping.html',label:'Envíos'},{file:'stockists.html',label:'Puntos de venta'},{file:'partners.html',label:'Colaboraciones'},{file:'jobs.html',label:'Empleos'},{file:'offers.html',label:'Promociones'},{file:'account.html',label:'Mi cuenta'}];
const MAINTENANCE_FONTS=['Montserrat','Helvetica Neue','Arial','Arial Black','Impact','Georgia','Times New Roman','Trebuchet MS','Courier New'];
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const money=n=>'MX$'+Number(n||0).toFixed(2);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(url,options={}){const res=await fetch(url,{credentials:'same-origin',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'Ocurrió un error.');return data}
function toast(msg){const el=$('#admin-toast');el.textContent=msg;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2500)}
function showLogin(message=''){ $('#admin-login').hidden=false;$('#admin-app').hidden=true;$('#login-message').textContent=message }
function showApp(){ $('#admin-login').hidden=true;$('#admin-app').hidden=false;const m=$('#login-message');if(m)m.textContent='' }
function clock(){const el=$('#admin-clock');if(el)el.textContent=new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(new Date())}
async function boot(){clock();setInterval(clock,30000);try{const s=await api('/api/admin/session');if(!s.configured)return showLogin('Primero configura ADMIN_PASSWORD en server/.env y reinicia el servidor.');if(!s.authenticated)return showLogin();showApp();await openView('dashboard')}catch(e){showLogin(e.message)}}
$('#admin-login-form')?.addEventListener('submit',async e=>{e.preventDefault();const msg=$('#login-message');msg.textContent='Entrando…';try{await api('/api/admin/login',{method:'POST',body:JSON.stringify({password:$('#admin-password').value})});$('#admin-password').value='';showApp();await openView('dashboard')}catch(err){msg.textContent=err.message}});
$('#admin-logout')?.addEventListener('click',async()=>{try{await api('/api/admin/logout',{method:'POST',body:'{}'})}catch{}showLogin('Sesión cerrada.')});
$$('.admin-nav').forEach(btn=>btn.addEventListener('click',()=>openView(btn.dataset.view)));
async function openView(view){$$('.admin-nav').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$$('.admin-view').forEach(v=>v.hidden=v.id!==`view-${view}`);$('#view-title').textContent={dashboard:'Resumen',orders:'Pedidos',inventory:'Inventario',products:'Productos',homepage:'Portada',maintenance:'Mantenimiento',collaborations:'Colaboraciones',localdelivery:'Entrega local',banktransfer:'Transferencia bancaria',promotions:'Cupones y promociones',sizeguide:'Guía de tallas',emails:'Correos'}[view]||view;if(view==='dashboard')await loadDashboard();if(view==='orders')await loadOrders();if(view==='inventory')await loadInventory();if(view==='products')await loadProducts();if(view==='homepage')await loadHomepage();if(view==='maintenance')await loadMaintenanceAdmin();if(view==='collaborations')await loadCollaborationsAdmin();if(view==='localdelivery')await loadLocalDeliveryAdmin();if(view==='banktransfer')await loadBankTransferAdmin();if(view==='promotions')await loadPromotionsAdmin();if(view==='sizeguide')await loadSizeGuideAdmin();if(view==='emails')await loadEmailTemplatesAdmin()}
async function loadDashboard(){const root=$('#view-dashboard');root.innerHTML='<div class="empty-state">Cargando…</div>';try{const {summary:s}=await api('/api/admin/dashboard');root.innerHTML=`<div class="metric-grid"><article class="metric"><span>Pedidos</span><strong>${s.orders}</strong></article><article class="metric"><span>Ventas pagadas</span><strong>${money(s.revenue)}</strong></article><article class="metric"><span>Unidades en inventario</span><strong>${s.totalUnits}</strong></article><article class="metric"><span>Variantes agotadas</span><strong>${s.outOfStock}</strong></article></div><div class="panel"><div class="panel-head"><h2>Operación</h2><p>Estado actual de la tienda</p></div><div class="metric-grid" style="padding:20px"><article class="metric"><span>Pagados</span><strong>${s.paidOrders}</strong></article><article class="metric"><span>Preparando</span><strong>${s.preparing}</strong></article><article class="metric"><span>Enviados</span><strong>${s.shipped}</strong></article><article class="metric"><span>Stock bajo (1–2)</span><strong>${s.lowStock}</strong></article></div></div>`}catch(e){root.innerHTML=`<div class="empty-state">${esc(e.message)}</div>`}}
async function loadOrders(){const root=$('#view-orders');root.innerHTML='<div class="empty-state">Cargando pedidos…</div>';try{const data=await api('/api/admin/orders');adminState.orders=data.orders;adminState.statuses=data.statuses;renderOrders()}catch(e){root.innerHTML=`<div class="empty-state">${esc(e.message)}</div>`}}
function renderOrders(){
  const root=$('#view-orders');
  if(!adminState.orders.length){
    root.innerHTML='<div class="panel"><div class="empty-state">Todavía no hay pedidos guardados en esta instalación.</div></div>';
    return;
  }
  root.innerHTML=`<div class="panel">
    <div class="panel-head"><h2>Pedidos</h2><p>${adminState.orders.length} pedido(s)</p></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th></th></tr></thead>
      <tbody>${adminState.orders.map(o=>`<tr>
        <td><strong>${esc(o.orderNumber)}</strong><br><small>${o.items.length} artículo(s) · ${esc(o.paymentMethod)}</small></td>
        <td class="order-customer">${esc([o.customer.nombre,o.customer.apellidos].filter(Boolean).join(' ')||'—')}<small>${esc(o.customer.email||'—')}</small></td>
        <td>${new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(new Date(o.createdAt))}</td>
        <td><strong>${money(o.totals.total)}</strong></td>
        <td><span class="status ${esc(o.status)}">${esc(o.status)}</span>${o.shipment?.trackingNumber?`<small class="tracking-mini">Guía: ${esc(o.shipment.trackingNumber)}</small>`:''}</td>
        <td><button class="order-manage-btn" data-order-manage="${esc(o.orderNumber)}">Ver / gestionar</button></td>
      </tr>`).join('')}</tbody>
    </table></div>
  </div>`;
  $$('[data-order-manage]',root).forEach(btn=>btn.addEventListener('click',()=>openOrderEditor(btn.dataset.orderManage)));
}

function orderByNumber(number){return adminState.orders.find(o=>o.orderNumber===number)}
function fmtDate(value){
  if(!value)return '—';
  const date=new Date(value);
  return Number.isNaN(date.getTime())?'—':new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(date);
}
function renderOrderHistory(order){
  const root=$('#order-edit-history');
  const history=Array.isArray(order.statusHistory)?order.statusHistory:[];
  const fallback=history.length?history:[{status:order.status,at:order.createdAt}];
  root.innerHTML=fallback.slice().reverse().map(item=>`<div class="order-history-item"><span></span><div><strong>${esc(item.status)}</strong><small>${esc(fmtDate(item.at))}</small></div></div>`).join('');
}
function fillOrderEditor(order){
  $('#order-edit-number').textContent=order.orderNumber;
  const status=$('#order-edit-status');
  status.innerHTML=adminState.statuses.map(s=>`<option ${s===order.status?'selected':''}>${esc(s)}</option>`).join('');
  $('#order-edit-payment').textContent=`${order.paymentStatus} · ${order.paymentMethod}${order.deliveryMethod?' · '+order.deliveryMethod:''}${order.promotion?.name?' · Promo: '+order.promotion.name:''}`;
  $('#order-edit-total').textContent=money(order.totals.total);

  const transferSection=$('#order-transfer-section');
  const isTransfer=order.paymentMethod==='Transferencia bancaria'&&order.transfer;
  if(transferSection){
    transferSection.hidden=!isTransfer;
    if(isTransfer){
      $('#order-transfer-reference').textContent=order.transfer.reference||order.orderNumber;
      $('#order-transfer-deadline').textContent=fmtDate(order.transfer.expiresAt);
      $('#order-transfer-proof-status').textContent=order.transfer.proof?`Recibido · ${fmtDate(order.transfer.proof.uploadedAt)}`:'Sin comprobante';
      const proofLink=$('#order-transfer-proof-link');
      if(proofLink){proofLink.hidden=!order.transfer.proof;proofLink.href=order.transfer.proof?`/api/admin/orders/${encodeURIComponent(order.orderNumber)}/transfer-proof`:'#'}
      const paidBtn=$('#order-mark-transfer-paid');
      if(paidBtn){paidBtn.hidden=order.paymentStatus==='Pagado'||order.status==='Cancelado';paidBtn.disabled=false;paidBtn.textContent='Marcar como pagado'}
      const msg=$('#order-transfer-message');if(msg)msg.textContent='';
    }
  }

  const c=order.customer||{};
  $('#order-edit-customer').innerHTML=`
    <strong>${esc([c.nombre,c.apellidos].filter(Boolean).join(' ')||'—')}</strong>
    <span>${esc(c.email||'—')}</span>
    <span>${esc(c.telefono||'—')}</span>`;

  $('#order-edit-address').innerHTML=`
    <strong>${esc(c.calle||'—')}</strong>
    <span>${esc(c.colonia||'')}</span>
    <span>${esc([c.cp,c.ciudad,c.estado].filter(Boolean).join(', '))}</span>
    <span>${esc(c.pais||'México')}</span>`;
  $('#order-edit-note').innerHTML=order.note?`<span class="order-customer-note">${esc(order.note)}</span>`:'<span>Sin nota.</span>';

  $('#order-edit-items').innerHTML=order.items.map(item=>`
    <div class="order-admin-item">
      <div><strong>${esc(item.name)}</strong><small>${esc(item.color)} · Talla ${esc(item.size)} · Cant. ${item.qty}</small></div>
      <span>${money(item.lineTotal)}</span>
    </div>`).join('')+`
    <div class="order-admin-totals">
      <span>Subtotal <strong>${money(order.totals.subtotal)}</strong></span>
      <span>Envío <strong>${order.totals.shipping?money(order.totals.shipping):'Gratis'}</strong></span>
      <span>Total <strong>${money(order.totals.total)}</strong></span>
    </div>`;

  $('#order-edit-carrier').value=order.shipment?.carrier||'';
  $('#order-edit-tracking-number').value=order.shipment?.trackingNumber||'';
  $('#order-edit-tracking-url').value=order.shipment?.trackingUrl||'';
  $('#order-edit-message').textContent='';
  renderOrderHistory(order);
}
function openOrderEditor(number){
  const order=orderByNumber(number);
  if(!order)return;
  $('#order-editor').dataset.orderNumber=number;
  fillOrderEditor(order);
  $('#order-editor').hidden=false;
  document.body.classList.add('modal-open');
}
function closeOrderEditor(){
  $('#order-editor').hidden=true;
  document.body.classList.remove('modal-open');
  renderOrders();
}
$$('[data-order-close]').forEach(btn=>btn.addEventListener('click',closeOrderEditor));

$('#order-edit-status')?.addEventListener('change',async e=>{
  const number=$('#order-editor').dataset.orderNumber;
  const previous=orderByNumber(number)?.status;
  const selected=e.currentTarget.value;
  e.currentTarget.disabled=true;
  try{
    const {order,statusEmailPending}=await api(`/api/admin/orders/${encodeURIComponent(number)}/status`,{method:'PATCH',body:JSON.stringify({status:selected})});
    const idx=adminState.orders.findIndex(o=>o.orderNumber===number);
    if(idx>=0)adminState.orders[idx]=order;
    fillOrderEditor(order);
    if(statusEmailPending){
      const msg=$('#order-edit-message');
      if(msg)msg.textContent='Estado Enviado guardado. Completa la paquetería, número de guía y enlace de rastreo; el correo al cliente se enviará cuando pulses “Guardar datos de envío”.';
      const carrier=$('#order-edit-carrier');
      carrier?.scrollIntoView({behavior:'smooth',block:'center'});
      setTimeout(()=>carrier?.focus(),350);
      toast(`${number}: completa los datos de envío`);
    }else{
      toast(`${number}: ${order.status}`);
    }
  }catch(err){
    e.currentTarget.value=previous;
    $('#order-edit-message').textContent=err.message;
  }finally{e.currentTarget.disabled=false}
});

$('#order-mark-transfer-paid')?.addEventListener('click',async()=>{
  const number=$('#order-editor').dataset.orderNumber;
  const order=orderByNumber(number);
  if(!order||order.paymentMethod!=='Transferencia bancaria')return;
  if(!confirm(`¿Confirmar que recibiste el pago del pedido ${number}?`))return;
  const button=$('#order-mark-transfer-paid'),msg=$('#order-transfer-message');
  button.disabled=true;button.textContent='Confirmando…';if(msg)msg.textContent='';
  try{
    const {order:updated}=await api(`/api/admin/orders/${encodeURIComponent(number)}/payment`,{method:'PATCH',body:'{}'});
    const idx=adminState.orders.findIndex(o=>o.orderNumber===number);if(idx>=0)adminState.orders[idx]=updated;
    fillOrderEditor(updated);toast(`${number}: pago confirmado`);
  }catch(err){if(msg)msg.textContent=err.message;button.disabled=false;button.textContent='Marcar como pagado'}
});

$('#order-save-shipment')?.addEventListener('click',async()=>{
  const number=$('#order-editor').dataset.orderNumber;
  const button=$('#order-save-shipment'),msg=$('#order-edit-message');
  button.disabled=true;msg.textContent='Guardando datos de envío…';
  try{
    const carrier=$('#order-edit-carrier').value.trim();
    const trackingNumber=$('#order-edit-tracking-number').value.trim();
    const trackingUrl=$('#order-edit-tracking-url').value.trim();
    const current=orderByNumber(number);
    if(current?.status==='Enviado'&&(!carrier||!trackingNumber||!trackingUrl)){
      throw new Error('Para enviar la notificación de envío completa Paquetería, Número de guía y Enlace de rastreo.');
    }
    const {order,statusEmailTriggered}=await api(`/api/admin/orders/${encodeURIComponent(number)}/shipment`,{
      method:'PATCH',
      body:JSON.stringify({carrier,trackingNumber,trackingUrl})
    });
    const idx=adminState.orders.findIndex(o=>o.orderNumber===number);
    if(idx>=0)adminState.orders[idx]=order;
    fillOrderEditor(order);
    msg.textContent=statusEmailTriggered?'Datos de envío guardados. Se envió la notificación de envío al cliente.':'Datos de envío guardados.';
    toast(statusEmailTriggered?'Datos guardados y correo de envío procesado':'Datos de envío actualizados');
  }catch(err){msg.textContent=err.message}
  finally{button.disabled=false}
});

async function loadInventory(){const root=$('#view-inventory');root.innerHTML='<div class="empty-state">Cargando inventario…</div>';try{adminState.inventory=await api('/api/admin/inventory');renderInventory()}catch(e){root.innerHTML=`<div class="empty-state">${esc(e.message)}</div>`}}
function renderInventory(){const root=$('#view-inventory'),data=adminState.inventory;const productMap=Object.fromEntries(data.products.map(p=>[p.id,p]));root.innerHTML=`<div class="admin-note">Los cambios guardados aquí afectan el inventario del servidor inmediatamente. La tienda, cuando se abre mediante <strong>localhost / servidor</strong>, sincroniza estas existencias.</div><div class="panel"><div class="panel-head"><h2>Inventario por variante</h2><p>${data.totalUnits} unidades · ${data.outOfStock} variantes agotadas</p></div><div class="table-wrap"><table><thead><tr><th>Producto</th><th>Color</th><th>Talla</th><th>Existencia</th><th></th></tr></thead><tbody>${data.variants.map(v=>`<tr><td>${esc(productMap[v.productId]?.name||v.productId)}</td><td>${esc(v.color)}</td><td>${esc(v.size)}</td><td><input class="stock-input ${v.qty===0?'stock-zero':v.qty<=2?'stock-low':''}" type="number" min="0" max="9999" value="${v.qty}" data-stock-input="${esc(v.productId)}|${esc(v.color)}|${esc(v.size)}"></td><td><button class="save-stock" data-stock-save="${esc(v.productId)}|${esc(v.color)}|${esc(v.size)}">Guardar</button></td></tr>`).join('')}</tbody></table></div></div>`;$$('[data-stock-save]',root).forEach(btn=>btn.addEventListener('click',async()=>{const [productId,color,size]=btn.dataset.stockSave.split('|');const input=$$('[data-stock-input]',root).find(el=>el.dataset.stockInput===btn.dataset.stockSave);btn.disabled=true;try{await api('/api/admin/inventory',{method:'PATCH',body:JSON.stringify({productId,color,size,qty:Number(input.value)})});toast('Inventario actualizado');await loadInventory()}catch(e){alert(e.message)}finally{btn.disabled=false}}))}
async function loadProducts(){
  const root=$('#view-products');root.innerHTML='<div class="empty-state">Cargando productos…</div>';
  try{
    const {products}=await api('/api/admin/products');adminState.products=products;
    root.innerHTML=`<div class="products-admin-toolbar"><div class="admin-note">Puedes crear productos nuevos y editar los existentes. Los productos nuevos se publican al guardarlos y su inventario queda conectado al servidor.</div><button id="add-product-btn" class="primary-admin-action" type="button">+ Añadir producto</button></div><div class="product-grid-admin">${products.map(p=>`<article class="product-admin-card"><img src="${esc(p.image)}" alt="${esc(p.name)}"><div class="product-admin-copy"><h3>${esc(p.name)}</h3><div class="product-admin-meta"><span>${money(p.price)}</span><span>${p.stock} piezas</span></div><div class="product-admin-variants"><small><strong>Colores:</strong> ${esc((p.colors||[]).join(', ')||'—')}</small><small><strong>Tallas:</strong> ${esc((p.sizes||[]).join(', ')||'—')}</small></div><button class="edit-product-btn" type="button" data-product-edit="${esc(p.id)}">Editar producto</button></div></article>`).join('')}</div>`;
    $('#add-product-btn',root)?.addEventListener('click',openProductCreator);
    $$('[data-product-edit]',root).forEach(btn=>btn.addEventListener('click',()=>openProductEditor(btn.dataset.productEdit)));
  }catch(e){root.innerHTML=`<div class="empty-state">${esc(e.message)}</div>`}
}

let productCreatePreviewUrls=[];
function clearProductCreatePreviews(){
  productCreatePreviewUrls.forEach(url=>URL.revokeObjectURL(url));
  productCreatePreviewUrls=[];
}
function renderProductCreatePreviews(files=[]){
  const root=$('#product-create-previews');
  clearProductCreatePreviews();
  if(!files.length){root.innerHTML='<div class="admin-image-empty">Sin imágenes</div>';return}
  root.innerHTML=[...files].slice(0,8).map((file,index)=>{
    const url=URL.createObjectURL(file);productCreatePreviewUrls.push(url);
    return `<div class="admin-image-preview-card"><img src="${url}" alt="Vista previa ${index+1}">${index===0?'<span>Principal</span>':''}</div>`;
  }).join('');
}
function openProductCreator(){
  const form=$('#product-create-form');
  form.reset();
  $('#product-create-sizes').value='CH, M, G, XG';
  $('#product-create-stock').value='0';
  $('#product-create-description').innerHTML='<p>Playera unisex de manga corta, corte Regular Fit y cuello redondo. Estampado frontal en serigrafía con tinta base agua. Confeccionada en tela 100% algodón peinado.</p>';
  $('#product-create-message').textContent='';
  renderProductCreatePreviews([]);
  $('#product-creator').hidden=false;
  document.body.classList.add('modal-open');
}
function closeProductCreator(){
  $('#product-creator').hidden=true;
  document.body.classList.remove('modal-open');
  clearProductCreatePreviews();
}
$$('[data-product-create-close]').forEach(btn=>btn.addEventListener('click',closeProductCreator));
$('#product-create-images')?.addEventListener('change',e=>{
  const files=[...(e.currentTarget.files||[])];
  const msg=$('#product-create-message');
  if(files.length>8){msg.textContent='Puedes seleccionar hasta 8 imágenes.';e.currentTarget.value='';renderProductCreatePreviews([]);return}
  msg.textContent='';
  renderProductCreatePreviews(files);
});
$('#product-create-form')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.currentTarget,msg=$('#product-create-message'),save=$('#product-create-save');
  const images=[...($('#product-create-images').files||[])];
  if(!images.length){msg.textContent='Selecciona al menos una imagen.';return}
  if(images.length>8){msg.textContent='Puedes subir hasta 8 imágenes.';return}
  const body=new FormData();
  images.forEach(image=>body.append('images',image));
  body.append('name',$('#product-create-name').value);
  body.append('price',$('#product-create-price').value);
  body.append('category',$('#product-create-category').value);
  body.append('descriptionHtml',$('#product-create-description').innerHTML);
  body.append('colors',$('#product-create-colors').value);
  body.append('sizes',$('#product-create-sizes').value);
  body.append('initialStock',$('#product-create-stock').value);
  msg.textContent='Creando producto…';save.disabled=true;
  try{
    const res=await fetch('/api/admin/products',{method:'POST',credentials:'same-origin',body});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||'No fue posible crear el producto.');
    toast(`Producto creado: ${data.product.name}`);
    closeProductCreator();
    await loadProducts();
  }catch(err){msg.textContent=err.message}finally{save.disabled=false}
});


function replaceAdminProduct(product){
  const index=adminState.products.findIndex(p=>p.id===product.id);
  if(index>=0)adminState.products[index]=product;
  else adminState.products.push(product);
}
function renderProductImageManager(product){
  const root=$('#product-edit-gallery');
  const images=Array.isArray(product.images)&&product.images.length?product.images:[product.image||product.img].filter(Boolean);
  root.innerHTML=images.map((image,index)=>`<div class="admin-image-manager-card ${index===0?'is-primary':''}">
    <img src="${esc(image)}" alt="${esc(product.name)}">
    <div class="admin-image-manager-actions">
      ${index===0?'<span class="primary-image-badge">Principal</span>':`<button type="button" data-image-primary="${esc(image)}">Hacer principal</button>`}
      <button type="button" class="danger-link" data-image-remove="${esc(image)}" ${images.length<=1?'disabled':''}>Eliminar</button>
    </div>
  </div>`).join('');
  $$('[data-image-primary]',root).forEach(btn=>btn.addEventListener('click',async()=>{
    const id=$('#product-edit-form').dataset.productId,msg=$('#product-edit-image-message');
    btn.disabled=true;msg.textContent='Cambiando imagen principal…';
    try{
      const {product:updated}=await api(`/api/admin/products/${encodeURIComponent(id)}/images/primary`,{method:'PATCH',body:JSON.stringify({image:btn.dataset.imagePrimary})});
      replaceAdminProduct(updated);renderProductImageManager(updated);msg.textContent='';toast('Imagen principal actualizada');
    }catch(err){msg.textContent=err.message}finally{btn.disabled=false}
  }));
  $$('[data-image-remove]',root).forEach(btn=>btn.addEventListener('click',async()=>{
    if(btn.disabled)return;
    if(!confirm('¿Eliminar esta imagen de la galería del producto?'))return;
    const id=$('#product-edit-form').dataset.productId,msg=$('#product-edit-image-message');
    btn.disabled=true;msg.textContent='Eliminando imagen…';
    try{
      const {product:updated}=await api(`/api/admin/products/${encodeURIComponent(id)}/images`,{method:'DELETE',body:JSON.stringify({image:btn.dataset.imageRemove})});
      replaceAdminProduct(updated);renderProductImageManager(updated);msg.textContent='';toast('Imagen eliminada');
    }catch(err){msg.textContent=err.message}finally{btn.disabled=false}
  }));
}
$('#product-edit-upload-images')?.addEventListener('click',async()=>{
  const input=$('#product-edit-add-images'),files=[...(input.files||[])],msg=$('#product-edit-image-message');
  const id=$('#product-edit-form').dataset.productId;
  if(!files.length){msg.textContent='Selecciona una o más imágenes.';return}
  if(files.length>8){msg.textContent='Puedes subir hasta 8 imágenes por carga.';return}
  const current=adminState.products.find(p=>p.id===id);
  const currentCount=(current?.images||[]).length||1;
  if(currentCount+files.length>12){msg.textContent='Cada producto puede tener hasta 12 imágenes en total.';return}
  const body=new FormData();files.forEach(file=>body.append('images',file));
  const button=$('#product-edit-upload-images');button.disabled=true;msg.textContent='Subiendo imágenes…';
  try{
    const res=await fetch(`/api/admin/products/${encodeURIComponent(id)}/images`,{method:'POST',credentials:'same-origin',body});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||'No fue posible subir las imágenes.');
    replaceAdminProduct(data.product);renderProductImageManager(data.product);input.value='';msg.textContent='';toast('Imágenes añadidas');
  }catch(err){msg.textContent=err.message}finally{button.disabled=false}
});

function openProductEditor(id){
  const p=adminState.products.find(x=>x.id===id);if(!p)return;
  $('#product-edit-form').dataset.productId=p.id;
  $('#product-edit-id').textContent=p.id;
  $('#product-edit-add-images').value='';
  $('#product-edit-image-message').textContent='';
  renderProductImageManager(p);
  $('#product-edit-name').value=p.name||'';
  $('#product-edit-price').value=Number(p.price||0).toFixed(2);
  $('#product-edit-category').value=p.category||'all';
  $('#product-edit-description').innerHTML=p.descriptionHtml||`<p>${esc(p.description||'')}</p>`;
  $('#product-edit-colors').value=(p.colors||[]).join(', ');
  $('#product-edit-sizes').value=(p.sizes||[]).join(', ');
  $('#product-edit-message').textContent='';
  $('#product-editor').hidden=false;
  document.body.classList.add('modal-open');
}
function closeProductEditor(){
  $('#product-editor').hidden=true;
  document.body.classList.remove('modal-open');
  loadProducts();
}
$$('[data-product-close]').forEach(btn=>btn.addEventListener('click',closeProductEditor));
$('#product-edit-form')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.currentTarget,id=form.dataset.productId,msg=$('#product-edit-message'),save=$('#product-edit-save');
  const split=v=>[...new Set(String(v||'').split(',').map(x=>x.trim()).filter(Boolean))];
  const payload={name:$('#product-edit-name').value,price:Number($('#product-edit-price').value),category:$('#product-edit-category').value,descriptionHtml:$('#product-edit-description').innerHTML,colors:split($('#product-edit-colors').value),sizes:split($('#product-edit-sizes').value)};
  msg.textContent='Guardando…';save.disabled=true;
  try{
    await api(`/api/admin/products/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(payload)});
    toast('Producto actualizado');closeProductEditor();await loadProducts();
  }catch(err){msg.textContent=err.message}finally{save.disabled=false}
});


const HERO_FONTS=['Montserrat','Helvetica Neue','Arial','Arial Black','Impact','Georgia','Times New Roman','Trebuchet MS','Courier New'];
const BENEFIT_DEFAULTS=[
  {icon:'icons/shipping-icon.svg',title:'PAGO SEGURO EN LÍNEA',subtitle:'Cifrado SSL · Compra 100% segura'},
  {icon:'icons/support-icon.svg',title:'ATENCIÓN RÁPIDA',subtitle:'Estamos aquí para ayudarte'},
  {icon:'icons/tarjeta-icon.svg',title:'ENVÍOS RÁPIDOS',subtitle:'Envíos rápidos y seguros'}
];
function ensureBenefitsBand(){
  const hp=adminState.homepage;if(!hp)return null;
  if(!hp.benefitsBand||typeof hp.benefitsBand!=='object')hp.benefitsBand={backgroundColor:'#b9df4b',items:[]};
  if(!Array.isArray(hp.benefitsBand.items))hp.benefitsBand.items=[];
  BENEFIT_DEFAULTS.forEach((fallback,index)=>{
    if(!hp.benefitsBand.items[index])hp.benefitsBand.items[index]={...fallback};
    const item=hp.benefitsBand.items[index];
    item.icon=item.icon||fallback.icon;item.title=item.title??fallback.title;item.subtitle=item.subtitle??fallback.subtitle;
    item.titleStyle={fontFamily:'Helvetica Neue',fontWeight:500,italic:false,color:'#282828',fontSize:17,mobileFontSize:13,...(item.titleStyle||{})};
    item.subtitleStyle={fontFamily:'Helvetica Neue',fontWeight:400,italic:false,color:'#4b5735',fontSize:13,mobileFontSize:10,...(item.subtitleStyle||{})};
    item.textOffsetX=Number(item.textOffsetX)||0;item.textOffsetY=Number(item.textOffsetY)||0;
    item.mobileTextOffsetX=Number(item.mobileTextOffsetX)||0;item.mobileTextOffsetY=Number(item.mobileTextOffsetY)||0;
    item.subtitleOffsetX=Number(item.subtitleOffsetX)||0;item.subtitleOffsetY=Number(item.subtitleOffsetY)||0;
    item.mobileSubtitleOffsetX=Number(item.mobileSubtitleOffsetX)||0;item.mobileSubtitleOffsetY=Number(item.mobileSubtitleOffsetY)||0;
  });
  return hp.benefitsBand;
}
function benefitStyleControls(style,index,target){
  return `<div class="benefit-style-grid">
    <label>Fuente<select data-benefit-index="${index}" data-benefit-target="${target}" data-benefit-style="fontFamily">${HERO_FONTS.map(f=>`<option ${f===style.fontFamily?'selected':''}>${f}</option>`).join('')}</select></label>
    <label>Peso / negrita<select data-benefit-index="${index}" data-benefit-target="${target}" data-benefit-style="fontWeight">${[300,400,500,600,700,800,900].map(w=>`<option value="${w}" ${Number(style.fontWeight)===w?'selected':''}>${w}${w===400?' · Normal':w===500?' · Medio':w===600?' · Semibold':w===700?' · Negrita':w===800?' · ExtraBold':w===900?' · Black':''}</option>`).join('')}</select></label>
    <label class="home-check-setting"><input type="checkbox" data-benefit-index="${index}" data-benefit-target="${target}" data-benefit-style="italic" ${style.italic?'checked':''}> Cursiva</label>
    <label>Color<input type="color" data-benefit-index="${index}" data-benefit-target="${target}" data-benefit-style="color" value="${style.color||'#282828'}"></label>
    <label>Tamaño escritorio (px)<input type="number" min="8" max="48" data-benefit-index="${index}" data-benefit-target="${target}" data-benefit-style="fontSize" value="${Number(style.fontSize)||16}"></label>
    <label>Tamaño móvil (px)<input type="number" min="8" max="36" data-benefit-index="${index}" data-benefit-target="${target}" data-benefit-style="mobileFontSize" value="${Number(style.mobileFontSize)||12}"></label>
  </div>`;
}
function benefitPositionControls(item,index){
  const arrow=(device,axis,delta,label,symbol)=>`<button type="button" class="benefit-move-btn" data-benefit-move="${index}" data-benefit-device="${device}" data-benefit-axis="${axis}" data-benefit-delta="${delta}" title="${label}" aria-label="${label}">${symbol}</button>`;
  return `<div class="benefit-position-editor">
    <div class="benefit-format-label">Posición general del título + texto inferior</div>
    <div class="benefit-position-grid">
      <div class="benefit-position-panel">
        <strong>Escritorio</strong>
        <div class="benefit-move-pad">
          <span></span>${arrow('desktop','y',-2,'Mover arriba','↑')}<span></span>
          ${arrow('desktop','x',-2,'Mover a la izquierda','←')}<button type="button" class="benefit-move-reset" data-benefit-move-reset="${index}" data-benefit-device="desktop" title="Centrar texto">●</button>${arrow('desktop','x',2,'Mover a la derecha','→')}
          <span></span>${arrow('desktop','y',2,'Mover abajo','↓')}<span></span>
        </div>
        <div class="benefit-position-values"><label>Horizontal (px)<input type="number" min="-150" max="150" data-benefit-offset="textOffsetX" data-benefit-index="${index}" value="${Number(item.textOffsetX)||0}"></label><label>Vertical (px)<input type="number" min="-150" max="150" data-benefit-offset="textOffsetY" data-benefit-index="${index}" value="${Number(item.textOffsetY)||0}"></label></div>
      </div>
      <div class="benefit-position-panel">
        <strong>Móvil</strong>
        <div class="benefit-move-pad">
          <span></span>${arrow('mobile','y',-2,'Mover arriba en móvil','↑')}<span></span>
          ${arrow('mobile','x',-2,'Mover a la izquierda en móvil','←')}<button type="button" class="benefit-move-reset" data-benefit-move-reset="${index}" data-benefit-device="mobile" title="Centrar texto en móvil">●</button>${arrow('mobile','x',2,'Mover a la derecha en móvil','→')}
          <span></span>${arrow('mobile','y',2,'Mover abajo en móvil','↓')}<span></span>
        </div>
        <div class="benefit-position-values"><label>Horizontal (px)<input type="number" min="-120" max="120" data-benefit-offset="mobileTextOffsetX" data-benefit-index="${index}" value="${Number(item.mobileTextOffsetX)||0}"></label><label>Vertical (px)<input type="number" min="-120" max="120" data-benefit-offset="mobileTextOffsetY" data-benefit-index="${index}" value="${Number(item.mobileTextOffsetY)||0}"></label></div>
      </div>
    </div>
    <small class="benefit-position-help">Este control mueve juntos el título y el texto inferior. Para mover solo el texto inferior usa el control independiente de arriba.</small>
  </div>`;
}
function benefitSubtitlePositionControls(item,index){
  const arrow=(device,axis,delta,label,symbol)=>`<button type="button" class="benefit-move-btn" data-benefit-subtitle-move="${index}" data-benefit-device="${device}" data-benefit-axis="${axis}" data-benefit-delta="${delta}" title="${label}" aria-label="${label}">${symbol}</button>`;
  return `<div class="benefit-position-editor benefit-subtitle-position-editor">
    <div class="benefit-format-label">Posición independiente del texto inferior</div>
    <div class="benefit-position-grid">
      <div class="benefit-position-panel">
        <strong>Escritorio</strong>
        <div class="benefit-move-pad">
          <span></span>${arrow('desktop','y',-2,'Mover texto inferior arriba','↑')}<span></span>
          ${arrow('desktop','x',-2,'Mover texto inferior a la izquierda','←')}<button type="button" class="benefit-move-reset" data-benefit-subtitle-reset="${index}" data-benefit-device="desktop" title="Centrar texto inferior">●</button>${arrow('desktop','x',2,'Mover texto inferior a la derecha','→')}
          <span></span>${arrow('desktop','y',2,'Mover texto inferior abajo','↓')}<span></span>
        </div>
        <div class="benefit-position-values"><label>Horizontal (px)<input type="number" min="-150" max="150" data-benefit-offset="subtitleOffsetX" data-benefit-index="${index}" value="${Number(item.subtitleOffsetX)||0}"></label><label>Vertical (px)<input type="number" min="-150" max="150" data-benefit-offset="subtitleOffsetY" data-benefit-index="${index}" value="${Number(item.subtitleOffsetY)||0}"></label></div>
      </div>
      <div class="benefit-position-panel">
        <strong>Móvil</strong>
        <div class="benefit-move-pad">
          <span></span>${arrow('mobile','y',-2,'Mover texto inferior arriba en móvil','↑')}<span></span>
          ${arrow('mobile','x',-2,'Mover texto inferior a la izquierda en móvil','←')}<button type="button" class="benefit-move-reset" data-benefit-subtitle-reset="${index}" data-benefit-device="mobile" title="Centrar texto inferior en móvil">●</button>${arrow('mobile','x',2,'Mover texto inferior a la derecha en móvil','→')}
          <span></span>${arrow('mobile','y',2,'Mover texto inferior abajo en móvil','↓')}<span></span>
        </div>
        <div class="benefit-position-values"><label>Horizontal (px)<input type="number" min="-120" max="120" data-benefit-offset="mobileSubtitleOffsetX" data-benefit-index="${index}" value="${Number(item.mobileSubtitleOffsetX)||0}"></label><label>Vertical (px)<input type="number" min="-120" max="120" data-benefit-offset="mobileSubtitleOffsetY" data-benefit-index="${index}" value="${Number(item.mobileSubtitleOffsetY)||0}"></label></div>
      </div>
    </div>
    <small class="benefit-position-help">Este control mueve solamente el texto inferior, sin mover el título ni el icono.</small>
  </div>`;
}
function benefitsBandAdminHtml(){
  const band=ensureBenefitsBand();if(!band)return '';
  return `<div class="home-slider-settings benefits-admin-settings">
    <div class="home-slider-settings-title"><strong>Franja verde de beneficios</strong><span>Edita el color, textos, tipografía e iconos que aparecen antes del pie de página.</span></div>
    <div class="home-global-grid benefits-global-row">
      <label>Color de la franja<input type="color" data-benefits-bg value="${band.backgroundColor||'#b9df4b'}"></label>
      <label>Vista previa<input type="text" value="Franja de beneficios" readonly style="background:${band.backgroundColor||'#b9df4b'};font-weight:700"></label>
      <label></label>
    </div>
    <div id="benefits-admin-preview" class="benefits-admin-preview"></div>
    <div class="benefits-editor-list">${band.items.map((item,index)=>`<details class="benefit-admin-card" ${index===0?'open':''}>
      <summary><span>Beneficio ${index+1}: ${esc(item.title||BENEFIT_DEFAULTS[index].title)}</span><small>Editar</small></summary>
      <div class="benefit-admin-body">
        <div class="benefit-icon-admin-row">
          <div class="benefit-current-icon"><img src="${esc(item.icon||BENEFIT_DEFAULTS[index].icon)}" alt="Icono actual"><span>Icono actual</span></div>
          <div class="benefit-icon-actions"><label>Reemplazar icono o imagen<input type="file" accept=".svg,image/svg+xml,image/png,image/jpeg,image/webp" data-benefit-icon-file="${index}"><small>SVG, PNG, JPG o WEBP · máximo 2 MB</small></label><button type="button" class="secondary-home-action" data-benefit-icon-upload="${index}">Subir archivo</button><button type="button" class="secondary-home-action" data-benefit-icon-reset="${index}">Restaurar original</button></div>
        </div>
        <label class="home-wide">Título<input type="text" maxlength="120" data-benefit-index="${index}" data-benefit-field="title" value="${esc(item.title||'')}"></label>
        <div class="benefit-format-label">Formato del título</div>${benefitStyleControls(item.titleStyle,index,'titleStyle')}
        <label class="home-wide">Texto inferior<textarea rows="2" maxlength="220" data-benefit-index="${index}" data-benefit-field="subtitle">${esc(item.subtitle||'')}</textarea></label>
        <div class="benefit-format-label">Formato del texto inferior</div>${benefitStyleControls(item.subtitleStyle,index,'subtitleStyle')}
        ${benefitSubtitlePositionControls(item,index)}
        ${benefitPositionControls(item,index)}
        <p class="message" data-benefit-message="${index}"></p>
      </div>
    </details>`).join('')}</div>
  </div>`;
}
function renderBenefitsAdminPreview(){
  const preview=$('#benefits-admin-preview'),band=ensureBenefitsBand();if(!preview||!band)return;
  preview.style.background=band.backgroundColor||'#b9df4b';
  preview.innerHTML=band.items.map(item=>`<article><img src="${esc(item.icon)}" alt=""><div class="benefit-preview-copy" style="transform:translate(${Number(item.textOffsetX)||0}px,${Number(item.textOffsetY)||0}px)"><h4 style="font-family:${heroAdminFont(item.titleStyle.fontFamily)};font-weight:${item.titleStyle.fontWeight};font-style:${item.titleStyle.italic?'italic':'normal'};color:${item.titleStyle.color};font-size:${Math.max(10,Math.min(24,Number(item.titleStyle.fontSize)||17))}px">${esc(item.title)}</h4><p style="font-family:${heroAdminFont(item.subtitleStyle.fontFamily)};font-weight:${item.subtitleStyle.fontWeight};font-style:${item.subtitleStyle.italic?'italic':'normal'};color:${item.subtitleStyle.color};font-size:${Math.max(9,Math.min(18,Number(item.subtitleStyle.fontSize)||13))}px;transform:translate(${Number(item.subtitleOffsetX)||0}px,${Number(item.subtitleOffsetY)||0}px)">${esc(item.subtitle)}</p></div></article>`).join('');
}
function updateBenefitsBandFromControls(){
  const band=ensureBenefitsBand();if(!band)return;
  const bg=$('[data-benefits-bg]');if(bg)band.backgroundColor=bg.value;
  $$('[data-benefit-field]').forEach(input=>{const item=band.items[Number(input.dataset.benefitIndex)];if(item)item[input.dataset.benefitField]=input.value});
  $$('[data-benefit-style]').forEach(input=>{const item=band.items[Number(input.dataset.benefitIndex)];if(!item)return;const target=input.dataset.benefitTarget,field=input.dataset.benefitStyle;if(!item[target])item[target]={};if(field==='italic')item[target][field]=input.checked;else if(['fontWeight','fontSize','mobileFontSize'].includes(field))item[target][field]=Number(input.value);else item[target][field]=input.value});
  $$('[data-benefit-offset]').forEach(input=>{const item=band.items[Number(input.dataset.benefitIndex)];if(item)item[input.dataset.benefitOffset]=Number(input.value)||0});
}
function moveBenefitText(index,device,axis,delta){
  updateBenefitsBandFromControls();const item=ensureBenefitsBand()?.items?.[index];if(!item)return;
  const field=device==='mobile'?(axis==='x'?'mobileTextOffsetX':'mobileTextOffsetY'):(axis==='x'?'textOffsetX':'textOffsetY');
  const limit=device==='mobile'?120:150;item[field]=Math.max(-limit,Math.min(limit,(Number(item[field])||0)+Number(delta||0)));
  const input=$(`[data-benefit-offset="${field}"][data-benefit-index="${index}"]`);if(input)input.value=item[field];renderBenefitsAdminPreview();
}
function resetBenefitTextPosition(index,device){
  updateBenefitsBandFromControls();const item=ensureBenefitsBand()?.items?.[index];if(!item)return;
  if(device==='mobile'){item.mobileTextOffsetX=0;item.mobileTextOffsetY=0}else{item.textOffsetX=0;item.textOffsetY=0}
  const fields=device==='mobile'?['mobileTextOffsetX','mobileTextOffsetY']:['textOffsetX','textOffsetY'];fields.forEach(field=>{const input=$(`[data-benefit-offset="${field}"][data-benefit-index="${index}"]`);if(input)input.value=0});renderBenefitsAdminPreview();
}
function moveBenefitSubtitle(index,device,axis,delta){
  updateBenefitsBandFromControls();const item=ensureBenefitsBand()?.items?.[index];if(!item)return;
  const field=device==='mobile'?(axis==='x'?'mobileSubtitleOffsetX':'mobileSubtitleOffsetY'):(axis==='x'?'subtitleOffsetX':'subtitleOffsetY');
  const limit=device==='mobile'?120:150;item[field]=Math.max(-limit,Math.min(limit,(Number(item[field])||0)+Number(delta||0)));
  const input=$(`[data-benefit-offset="${field}"][data-benefit-index="${index}"]`);if(input)input.value=item[field];renderBenefitsAdminPreview();
}
function resetBenefitSubtitlePosition(index,device){
  updateBenefitsBandFromControls();const item=ensureBenefitsBand()?.items?.[index];if(!item)return;
  if(device==='mobile'){item.mobileSubtitleOffsetX=0;item.mobileSubtitleOffsetY=0}else{item.subtitleOffsetX=0;item.subtitleOffsetY=0}
  const fields=device==='mobile'?['mobileSubtitleOffsetX','mobileSubtitleOffsetY']:['subtitleOffsetX','subtitleOffsetY'];fields.forEach(field=>{const input=$(`[data-benefit-offset="${field}"][data-benefit-index="${index}"]`);if(input)input.value=0});renderBenefitsAdminPreview();
}
async function uploadBenefitIcon(index){
  updateBenefitsBandFromControls();const input=$(`[data-benefit-icon-file="${index}"]`),file=input?.files?.[0],msg=$(`[data-benefit-message="${index}"]`);if(!file){if(msg)msg.textContent='Selecciona un archivo SVG, PNG, JPG o WEBP.';return}
  const body=new FormData();body.append('icon',file);if(msg)msg.textContent='Subiendo icono…';
  try{const res=await fetch(`/api/admin/homepage/benefit-icon/${index}`,{method:'POST',credentials:'same-origin',body});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'No fue posible subir el icono.');ensureBenefitsBand().items[index].icon=data.path;if(msg)msg.textContent='Icono cargado. Guarda la portada para publicar el cambio.';renderHomepageEditor();toast('Icono de la franja actualizado.');}catch(e){if(msg)msg.textContent=e.message}
}
function heroAdminFont(name){return ({'Montserrat':"'Montserrat',Arial,sans-serif",'Helvetica Neue':"'Helvetica Neue',Helvetica,Arial,sans-serif",'Arial':'Arial,sans-serif','Arial Black':"'Arial Black',Arial,sans-serif",'Impact':'Impact,Haettenschweiler,sans-serif','Georgia':'Georgia,serif','Times New Roman':"'Times New Roman',Times,serif",'Trebuchet MS':"'Trebuchet MS',Arial,sans-serif",'Courier New':"'Courier New',Courier,monospace"})[name]||'Arial,sans-serif'}


function promoStatusLabel(p){
  return ({active:'Activa',inactive:'Inactiva',upcoming:'Próximamente',expired:'Vencida',exhausted:'Límite alcanzado'})[p.status]||p.status;
}
function promoDiscountLabel(p){
  if(p.discountType==='free_shipping')return 'Envío gratis';
  if(p.discountType==='fixed')return `MX$${Number(p.value||0).toFixed(2)}`;
  return `${Number(p.value||0)}%`;
}
function promoDateInput(value){
  if(!value)return '';
  const d=new Date(value);if(Number.isNaN(d.getTime()))return '';
  const pad=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
async function loadPromotionsAdmin(){
  const root=$('#view-promotions');root.innerHTML='<div class="empty-state">Cargando promociones…</div>';
  try{
    const data=await api('/api/admin/promotions');
    adminState.promotions=data.promotions||[];
    adminState.promotionProducts=data.products||[];
    renderPromotionsAdmin();
  }catch(e){root.innerHTML=`<div class="empty-state">${esc(e.message)}</div>`}
}
function renderPromotionsAdmin(){
  const root=$('#view-promotions');if(!root)return;
  const editing=adminState.promotions.find(p=>p.id===adminState.editingPromotionId)||null;
  root.innerHTML=`<div class="promotions-toolbar"><div><h2>Cupones y promociones</h2><p>Crea códigos de descuento o promociones automáticas. Solo se aplica una promoción por pedido.</p></div><button type="button" class="primary-admin-action" id="promo-new">+ Crear promoción</button></div>
  <div class="panel">
    <div class="promo-table-head"><span>Promoción</span><span>Tipo</span><span>Descuento</span><span>Vigencia</span><span>Usos</span><span>Estado</span><span></span></div>
    <div class="promo-admin-list">${adminState.promotions.length?adminState.promotions.map(p=>`<div class="promo-row">
      <div><strong>${esc(p.name)}</strong>${p.kind==='coupon'?`<small>Código: ${esc(p.code)}</small>`:'<small>Automática · sin código</small>'}</div>
      <span>${p.kind==='coupon'?'Cupón':'Automática'}</span>
      <span>${esc(promoDiscountLabel(p))}</span>
      <span>${p.startsAt||p.endsAt?`${p.startsAt?new Date(p.startsAt).toLocaleDateString('es-MX'):'Ahora'} – ${p.endsAt?new Date(p.endsAt).toLocaleDateString('es-MX'):'Sin vencimiento'}`:'Sin límite'}</span>
      <span>${p.usageCount}${p.usageLimit?` / ${p.usageLimit}`:''}</span>
      <span class="promo-status ${p.status}">${promoStatusLabel(p)}</span>
      <div class="promo-row-actions"><button type="button" data-promo-edit="${p.id}">Editar</button><button type="button" class="danger-lite" data-promo-delete="${p.id}">Eliminar</button></div>
    </div>`).join(''):'<div class="empty-state">Todavía no hay promociones.</div>'}</div>
  </div>
  <div id="promo-editor-wrap">${editing?promotionEditorHtml(editing):''}</div>`;
  $('#promo-new')?.addEventListener('click',()=>{adminState.editingPromotionId='__new__';renderPromotionNewEditor()});
  $$('[data-promo-edit]').forEach(btn=>btn.onclick=()=>{adminState.editingPromotionId=btn.dataset.promoEdit;renderPromotionsAdmin();document.querySelector('#promo-editor-wrap')?.scrollIntoView({behavior:'smooth'})});
  $$('[data-promo-delete]').forEach(btn=>btn.onclick=async()=>{if(!confirm('¿Eliminar esta promoción? Los pedidos anteriores conservarán su registro.'))return;try{const data=await api(`/api/admin/promotions/${encodeURIComponent(btn.dataset.promoDelete)}`,{method:'DELETE'});adminState.promotions=data.promotions||[];adminState.editingPromotionId='';renderPromotionsAdmin();toast('Promoción eliminada')}catch(e){alert(e.message)}});
  if(editing)bindPromotionEditor(editing.id);
}
function renderPromotionNewEditor(){
  const wrap=$('#promo-editor-wrap');if(!wrap)return;
  wrap.innerHTML=promotionEditorHtml({id:'',name:'',kind:'coupon',code:'',discountType:'percentage',value:10,minSubtotal:0,minQuantity:0,maxDiscount:0,active:true,startsAt:'',endsAt:'',usageLimit:0,perCustomerLimit:0,productIds:[]},true);
  bindPromotionEditor('');
  wrap.scrollIntoView({behavior:'smooth'});
}
function promotionEditorHtml(p,isNew=false){
  const selected=new Set(p.productIds||[]);
  return `<form class="panel promo-editor" id="promo-editor-form">
    <div class="panel-head"><div><h2>${isNew?'Crear cupón o promoción':'Editar promoción'}</h2><p>Los campos con 0 significan “sin límite”.</p></div><button type="button" class="secondary-home-action" id="promo-cancel">Cerrar</button></div>
    <div class="promo-editor-body">
      <div class="editor-two"><label>Nombre<input name="name" type="text" maxlength="160" value="${esc(p.name||'')}" placeholder="Ej. Bienvenida 10%" required></label><label>Tipo<select name="kind"><option value="coupon" ${p.kind!=='automatic'?'selected':''}>Cupón con código</option><option value="automatic" ${p.kind==='automatic'?'selected':''}>Promoción automática</option></select></label></div>
      <div class="editor-two"><label class="promo-code-field">Código<input name="code" type="text" maxlength="40" value="${esc(p.code||'')}" placeholder="BIENVENIDO10"></label><label>Tipo de descuento<select name="discountType"><option value="percentage" ${p.discountType==='percentage'?'selected':''}>Porcentaje</option><option value="fixed" ${p.discountType==='fixed'?'selected':''}>Monto fijo</option><option value="free_shipping" ${p.discountType==='free_shipping'?'selected':''}>Envío gratis</option></select></label></div>
      <div class="editor-three"><label>Valor<input name="value" type="number" min="0" step="0.01" value="${Number(p.value||0)}"><small>% o MXN según el tipo.</small></label><label>Compra mínima (MXN)<input name="minSubtotal" type="number" min="0" step="1" value="${Number(p.minSubtotal||0)}"></label><label>Cantidad mínima<input name="minQuantity" type="number" min="0" step="1" value="${Number(p.minQuantity||0)}"></label></div>
      <div class="editor-three"><label>Descuento máximo (MXN)<input name="maxDiscount" type="number" min="0" step="1" value="${Number(p.maxDiscount||0)}"><small>Útil para porcentajes.</small></label><label>Límite total de usos<input name="usageLimit" type="number" min="0" step="1" value="${Number(p.usageLimit||0)}"></label><label>Usos por cliente<input name="perCustomerLimit" type="number" min="0" step="1" value="${Number(p.perCustomerLimit||0)}"></label></div>
      <div class="editor-two"><label>Inicio<input name="startsAt" type="datetime-local" value="${promoDateInput(p.startsAt)}"></label><label>Vencimiento<input name="endsAt" type="datetime-local" value="${promoDateInput(p.endsAt)}"></label></div>
      <label>Productos incluidos <small>Si no seleccionas ninguno, aplica a todos.</small><select name="productIds" multiple size="7">${adminState.promotionProducts.map(prod=>`<option value="${prod.id}" ${selected.has(prod.id)?'selected':''}>${esc(prod.name)}</option>`).join('')}</select></label>
      <label class="home-check-setting"><input name="active" type="checkbox" ${p.active!==false?'checked':''}> Promoción activa</label>
      <div class="editor-warning">Las promociones no se acumulan: si el cliente usa un cupón válido, se aplica ese cupón; si no usa código, el sistema aplica automáticamente la promoción automática disponible que genere el mayor ahorro.</div>
      <div class="admin-modal-actions"><button type="button" class="secondary" id="promo-cancel-bottom">Cancelar</button><button type="submit">${isNew?'Crear promoción':'Guardar cambios'}</button></div>
      <p id="promo-editor-message" class="message"></p>
    </div>
  </form>`;
}
function bindPromotionEditor(id){
  const form=$('#promo-editor-form');if(!form)return;
  const syncFields=()=>{const kind=form.elements.kind.value,type=form.elements.discountType.value;$('.promo-code-field',form).style.display=kind==='automatic'?'none':'grid';form.elements.code.required=kind!=='automatic';form.elements.value.disabled=type==='free_shipping'};
  form.elements.kind.addEventListener('change',syncFields);form.elements.discountType.addEventListener('change',syncFields);syncFields();
  const close=()=>{adminState.editingPromotionId='';renderPromotionsAdmin()};
  $('#promo-cancel')?.addEventListener('click',close);$('#promo-cancel-bottom')?.addEventListener('click',close);
  form.addEventListener('submit',async e=>{
    e.preventDefault();const fd=new FormData(form),msg=$('#promo-editor-message');
    const productIds=[...form.elements.productIds.selectedOptions].map(o=>o.value);
    const payload={
      name:fd.get('name'),kind:fd.get('kind'),code:fd.get('code'),discountType:fd.get('discountType'),
      value:Number(fd.get('value')||0),minSubtotal:Number(fd.get('minSubtotal')||0),minQuantity:Number(fd.get('minQuantity')||0),
      maxDiscount:Number(fd.get('maxDiscount')||0),usageLimit:Number(fd.get('usageLimit')||0),perCustomerLimit:Number(fd.get('perCustomerLimit')||0),
      startsAt:fd.get('startsAt')||'',endsAt:fd.get('endsAt')||'',active:fd.get('active')==='on',productIds
    };
    msg.textContent='Guardando…';
    try{
      const url=id?`/api/admin/promotions/${encodeURIComponent(id)}`:'/api/admin/promotions';
      const data=await api(url,{method:id?'PATCH':'POST',body:JSON.stringify(payload)});
      adminState.promotions=data.promotions||[];adminState.editingPromotionId='';renderPromotionsAdmin();toast(id?'Promoción actualizada':'Promoción creada');
    }catch(err){msg.textContent=err.message}
  });
}

async function loadLocalDeliveryAdmin(){
  const root=$('#view-localdelivery');root.innerHTML='<div class="empty-state">Cargando entrega local…</div>';
  try{const data=await api('/api/admin/local-delivery');adminState.localDelivery=data.settings;renderLocalDeliveryAdmin()}
  catch(e){root.innerHTML=`<div class="empty-state">${esc(e.message)}</div>`}
}
function renderLocalDeliveryAdmin(){
  const root=$('#view-localdelivery'),s=adminState.localDelivery;if(!root||!s)return;
  root.innerHTML=`<div class="panel local-delivery-admin">
    <div class="panel-head"><h2>Entrega local y contraentrega</h2><p>La opción aparecerá en checkout únicamente cuando la dirección coincida con esta zona.</p></div>
    <form id="local-delivery-form" class="local-delivery-form">
      <div class="local-setting-toggles">
        <label class="home-check-setting"><input type="checkbox" name="enabled" ${s.enabled?'checked':''}> Activar entrega local</label>
        <label class="home-check-setting"><input type="checkbox" name="cashOnDelivery" ${s.cashOnDelivery?'checked':''}> Permitir pago contraentrega</label>
      </div>
      <div class="editor-two">
        <label>Ciudad / municipio<input name="city" type="text" value="${esc(s.city||'')}" required></label>
        <label>Estado<input name="state" type="text" value="${esc(s.state||'')}" required></label>
      </div>
      <div class="editor-two">
        <label>País<input name="country" type="text" value="${esc(s.country||'México')}" required></label>
        <label>Costo de entrega local (MXN)<input name="fee" type="number" min="0" step="1" value="${Number(s.fee)||0}"></label>
      </div>
      <label>Códigos postales permitidos <small>Separados por coma. Si dejas el campo vacío, se validará solo ciudad, estado y país.</small><input name="postalCodes" type="text" value="${esc((s.postalCodes||[]).join(', '))}" placeholder="41300"></label>
      <label>Nombre que verá el cliente<input name="label" type="text" maxlength="180" value="${esc(s.label||'Entrega local')}"></label>
      <div class="editor-warning">La validación también se hace en el servidor. Un cliente fuera de esta zona no podrá forzar el pago contraentrega.</div>
      <button type="submit" class="primary-admin-action">Guardar entrega local</button>
      <p class="message" id="local-delivery-message"></p>
    </form>
  </div>`;
  $('#local-delivery-form')?.addEventListener('submit',async e=>{
    e.preventDefault();const fd=new FormData(e.currentTarget),msg=$('#local-delivery-message');
    const payload={enabled:fd.get('enabled')==='on',cashOnDelivery:fd.get('cashOnDelivery')==='on',city:fd.get('city'),state:fd.get('state'),country:fd.get('country'),fee:Number(fd.get('fee')||0),postalCodes:String(fd.get('postalCodes')||'').split(',').map(v=>v.trim()).filter(Boolean),label:fd.get('label')};
    msg.textContent='Guardando…';
    try{const data=await api('/api/admin/local-delivery',{method:'PATCH',body:JSON.stringify(payload)});adminState.localDelivery=data.settings;msg.textContent='Entrega local actualizada.';toast('Entrega local guardada');renderLocalDeliveryAdmin()}
    catch(err){msg.textContent=err.message}
  });
}

async function loadBankTransferAdmin(){
  const root=$('#view-banktransfer');root.innerHTML='<div class="empty-state">Cargando transferencia bancaria…</div>';
  try{const data=await api('/api/admin/bank-transfer');adminState.bankTransfer=data.settings;renderBankTransferAdmin()}
  catch(e){root.innerHTML=`<div class="empty-state">${esc(e.message)}</div>`}
}
function renderBankTransferAdmin(){
  const root=$('#view-banktransfer'),s=adminState.bankTransfer;if(!root||!s)return;
  root.innerHTML=`<div class="panel bank-transfer-admin">
    <div class="panel-head"><h2>Transferencia bancaria</h2><p>Configura los datos que se mostrarán al cliente después de crear un pedido pendiente de pago.</p></div>
    <form id="bank-transfer-form" class="local-delivery-form">
      <div class="local-setting-toggles">
        <label class="home-check-setting"><input type="checkbox" name="enabled" ${s.enabled?'checked':''}> Activar transferencia bancaria</label>
        <label class="home-check-setting"><input type="checkbox" name="proofUploadEnabled" ${s.proofUploadEnabled!==false?'checked':''}> Permitir subir comprobante</label>
      </div>
      <div class="editor-two">
        <label>Banco<input name="bankName" type="text" maxlength="100" value="${esc(s.bankName||'')}" placeholder="Ej. BBVA"></label>
        <label>Titular de la cuenta<input name="accountHolder" type="text" maxlength="160" value="${esc(s.accountHolder||'')}" placeholder="Nombre del titular"></label>
      </div>
      <div class="editor-two">
        <label>CLABE <small>18 dígitos</small><input name="clabe" type="text" inputmode="numeric" maxlength="18" value="${esc(s.clabe||'')}" placeholder="000000000000000000"></label>
        <label>Número de cuenta<input name="accountNumber" type="text" inputmode="numeric" maxlength="30" value="${esc(s.accountNumber||'')}" placeholder="Opcional"></label>
      </div>
      <div class="editor-two">
        <label>Número de tarjeta <small>Opcional</small><input name="cardNumber" type="text" inputmode="numeric" maxlength="19" value="${esc(s.cardNumber||'')}" placeholder="Opcional"></label>
        <label>Plazo sugerido para pagar (horas)<input name="paymentDeadlineHours" type="number" min="1" max="168" value="${Number(s.paymentDeadlineHours)||24}"></label>
      </div>
      <label>Instrucciones para el cliente<textarea name="instructions" rows="5" maxlength="900">${esc(s.instructions||'')}</textarea></label>
      <div class="editor-warning">Al crear un pedido por transferencia, el inventario se reserva inmediatamente. Si el cliente no paga, puedes cambiar el pedido a <strong>Cancelado</strong> para devolver esas piezas al inventario.</div>
      <button type="submit" class="primary-admin-action">Guardar transferencia bancaria</button>
      <p class="message" id="bank-transfer-message"></p>
    </form>
  </div>`;
  $('#bank-transfer-form')?.addEventListener('submit',async e=>{
    e.preventDefault();const fd=new FormData(e.currentTarget),msg=$('#bank-transfer-message');
    const payload={enabled:fd.get('enabled')==='on',proofUploadEnabled:fd.get('proofUploadEnabled')==='on',bankName:fd.get('bankName'),accountHolder:fd.get('accountHolder'),clabe:fd.get('clabe'),accountNumber:fd.get('accountNumber'),cardNumber:fd.get('cardNumber'),paymentDeadlineHours:Number(fd.get('paymentDeadlineHours')||24),instructions:fd.get('instructions')};
    msg.textContent='Guardando…';
    try{const data=await api('/api/admin/bank-transfer',{method:'PATCH',body:JSON.stringify(payload)});adminState.bankTransfer=data.settings;msg.textContent='Transferencia bancaria actualizada.';toast('Transferencia bancaria guardada');renderBankTransferAdmin()}
    catch(err){msg.textContent=err.message}
  });
}


const HOME_CATALOG_DEFAULT={backgroundColor:'#ffffff',productNameColor:'#4d5e75',productPriceColor:'#738197',title:{visible:true,text:'🔥 HOT 🔥',fontFamily:'Helvetica Neue',fontWeight:700,italic:false,color:'#1f1e1c',backgroundColor:'transparent',fontSize:24,mobileFontSize:22,letterSpacing:.5,textAlign:'center',textTransform:'none',paddingX:0,paddingY:0,borderColor:'#1f1e1c',borderWidth:0,borderRadius:0,marginTop:0,marginBottom:48}};
function ensureHomeCatalogStyle(){
  const hp=adminState.homepage;if(!hp)return null;
  if(!hp.catalogStyle||typeof hp.catalogStyle!=='object')hp.catalogStyle=JSON.parse(JSON.stringify(HOME_CATALOG_DEFAULT));
  if(!hp.catalogStyle.title||typeof hp.catalogStyle.title!=='object')hp.catalogStyle.title=JSON.parse(JSON.stringify(HOME_CATALOG_DEFAULT.title));
  return hp.catalogStyle;
}
function catalogAdminHtml(){
  const c=ensureHomeCatalogStyle();if(!c)return '';
  const t=c.title||HOME_CATALOG_DEFAULT.title;
  return `<div class="home-slider-settings home-catalog-admin">
    <div class="home-slider-settings-title"><strong>Catálogo de productos de la página principal</strong><span>Personaliza el fondo del catálogo y el encabezado que actualmente dice “🔥 HOT 🔥”.</span></div>
    <div class="home-global-grid">
      <label>Color de fondo del catálogo<input type="color" data-catalog-field="backgroundColor" value="${c.backgroundColor||'#ffffff'}"></label>
      <label>Color nombre de producto<input type="color" data-catalog-field="productNameColor" value="${c.productNameColor||'#4d5e75'}"></label>
      <label>Color precio<input type="color" data-catalog-field="productPriceColor" value="${c.productPriceColor||'#738197'}"></label>
    </div>
    <div id="home-catalog-preview" class="home-catalog-admin-preview"></div>
    <details class="home-feature-details" open><summary>Encabezado del catálogo</summary><div class="home-feature-detail-body">
      <div class="home-global-grid">
        <label class="home-check-setting"><input type="checkbox" data-catalog-title="visible" ${t.visible!==false?'checked':''}> Mostrar encabezado</label>
        <label class="home-wide">Texto<input type="text" maxlength="180" data-catalog-title="text" value="${esc(t.text||'')}"><small>Puedes usar texto y emojis.</small></label>
      </div>
      <div class="home-feature-format-grid">
        <label>Fuente<select data-catalog-title="fontFamily">${HERO_FONTS.map(f=>`<option ${f===t.fontFamily?'selected':''}>${f}</option>`).join('')}</select></label>
        <label>Peso<select data-catalog-title="fontWeight">${[100,200,300,400,500,600,700,800,900].map(w=>`<option value="${w}" ${Number(t.fontWeight)===w?'selected':''}>${w}</option>`).join('')}</select></label>
        <label class="home-check-setting"><input type="checkbox" data-catalog-title="italic" ${t.italic?'checked':''}> Cursiva</label>
        <label>Alineación<select data-catalog-title="textAlign"><option value="left" ${t.textAlign==='left'?'selected':''}>Izquierda</option><option value="center" ${t.textAlign!=='left'&&t.textAlign!=='right'?'selected':''}>Centro</option><option value="right" ${t.textAlign==='right'?'selected':''}>Derecha</option></select></label>
        <label>Transformación<select data-catalog-title="textTransform"><option value="none" ${t.textTransform==='none'?'selected':''}>Normal</option><option value="uppercase" ${t.textTransform==='uppercase'?'selected':''}>MAYÚSCULAS</option><option value="lowercase" ${t.textTransform==='lowercase'?'selected':''}>minúsculas</option><option value="capitalize" ${t.textTransform==='capitalize'?'selected':''}>Iniciales</option></select></label>
        <label>Color texto<input type="color" data-catalog-title="color" value="${t.color||'#1f1e1c'}"></label>
        <label>Fondo<input type="color" data-catalog-title="backgroundColor" value="${t.backgroundColor==='transparent'?'#ffffff':(t.backgroundColor||'#ffffff')}"></label>
        <label class="home-check-setting"><input type="checkbox" id="catalog-title-transparent" ${t.backgroundColor==='transparent'?'checked':''}> Fondo transparente</label>
        <label>Tamaño escritorio<input type="number" min="8" max="72" data-catalog-title="fontSize" value="${Number(t.fontSize)||24}"></label>
        <label>Tamaño móvil<input type="number" min="8" max="52" data-catalog-title="mobileFontSize" value="${Number(t.mobileFontSize)||22}"></label>
        <label>Espaciado letras<input type="number" min="-8" max="20" step="0.5" data-catalog-title="letterSpacing" value="${Number(t.letterSpacing)||0}"></label>
        <label>Padding horizontal<input type="number" min="0" max="80" data-catalog-title="paddingX" value="${Number(t.paddingX)||0}"></label>
        <label>Padding vertical<input type="number" min="0" max="40" data-catalog-title="paddingY" value="${Number(t.paddingY)||0}"></label>
        <label>Color borde<input type="color" data-catalog-title="borderColor" value="${t.borderColor||'#1f1e1c'}"></label>
        <label>Grosor borde<input type="number" min="0" max="8" data-catalog-title="borderWidth" value="${Number(t.borderWidth)||0}"></label>
        <label>Radio esquinas<input type="number" min="0" max="80" data-catalog-title="borderRadius" value="${Number(t.borderRadius)||0}"></label>
        <label>Margen superior<input type="number" min="0" max="140" data-catalog-title="marginTop" value="${Number(t.marginTop)||0}"></label>
        <label>Margen inferior<input type="number" min="0" max="140" data-catalog-title="marginBottom" value="${Number(t.marginBottom)||48}"></label>
      </div>
    </div></details>
  </div>`;
}
function updateCatalogFromControls(){
  const c=ensureHomeCatalogStyle();if(!c)return;
  $$('[data-catalog-field]').forEach(input=>c[input.dataset.catalogField]=input.value);
  $$('[data-catalog-title]').forEach(input=>{
    const f=input.dataset.catalogTitle;
    if(f==='visible'||f==='italic')c.title[f]=input.checked;
    else if(['fontWeight','fontSize','mobileFontSize','letterSpacing','paddingX','paddingY','borderWidth','borderRadius','marginTop','marginBottom'].includes(f))c.title[f]=Number(input.value);
    else c.title[f]=input.value;
  });
  if($('#catalog-title-transparent')?.checked)c.title.backgroundColor='transparent';
}
function renderCatalogAdminPreview(){
  const el=$('#home-catalog-preview'),c=ensureHomeCatalogStyle();if(!el||!c)return;
  const t=c.title||HOME_CATALOG_DEFAULT.title;
  const justify=t.textAlign==='left'?'flex-start':t.textAlign==='right'?'flex-end':'center';
  el.style.background=c.backgroundColor||'#ffffff';
  el.innerHTML=`<div class="home-catalog-preview-inner"><div style="display:flex;justify-content:${justify};width:100%">${t.visible===false?'':`<div style="font-family:${heroAdminFont(t.fontFamily)};font-weight:${Number(t.fontWeight)||700};font-style:${t.italic?'italic':'normal'};color:${t.color||'#1f1e1c'};background:${t.backgroundColor||'transparent'};font-size:${Math.min(38,Math.max(10,Number(t.fontSize)||24))}px;letter-spacing:${Number(t.letterSpacing)||0}px;text-transform:${t.textTransform||'none'};padding:${Number(t.paddingY)||0}px ${Number(t.paddingX)||0}px;border:${Number(t.borderWidth)||0}px solid ${t.borderColor||'#1f1e1c'};border-radius:${Number(t.borderRadius)||0}px">${esc(t.text||'')}</div>`}</div><div class="home-catalog-preview-products"><div><span class="fake-shirt">👕</span><strong style="color:${c.productNameColor||'#4d5e75'}">Producto de ejemplo</strong><small style="color:${c.productPriceColor||'#738197'}">MX$149.00</small></div><div><span class="fake-shirt">👕</span><strong style="color:${c.productNameColor||'#4d5e75'}">Producto de ejemplo</strong><small style="color:${c.productPriceColor||'#738197'}">MX$220.00</small></div></div></div>`;
}

const HERO_FEATURE_DEFAULT={enabled:true,image:'https://static.wixstatic.com/media/11062b_2ffe9bf7695a4ef6abb5b61acdf992f9~mv2.jpg/v1/fill/w_985,h_657,al_c,q_85,usm_0.66_1.00_0.01/11062b_2ffe9bf7695a4ef6abb5b61acdf992f9~mv2.jpg',imageSide:'left',imagePositionX:50,imagePositionY:50,imageWidth:50,backgroundColor:'#ffffff',minHeight:360,mobileImageHeight:220,title:'Ponte rancio con Niños Rancios',subtitle:'Ropa con actitud. Sin filtros.',titleStyle:{fontFamily:'Helvetica Neue',fontWeight:400,italic:false,color:'#1f1e1c',fontSize:30,mobileFontSize:24,letterSpacing:0,textAlign:'left'},subtitleStyle:{fontFamily:'Helvetica Neue',fontWeight:400,italic:false,color:'#333333',fontSize:18,mobileFontSize:16,letterSpacing:0,textAlign:'left'},button:{enabled:true,text:'Acerca de Nosotros',href:'about-us.html',backgroundColor:'transparent',color:'#1f1e1c',borderColor:'#d7d1c8',borderWidth:1,borderRadius:0,fontFamily:'Helvetica Neue',fontWeight:400,italic:false,fontSize:16,mobileFontSize:15,textAlign:'center',width:280,height:48}};
function ensureHeroFeatureBlock(){
  const hp=adminState.homepage;if(!hp)return null;
  if(!hp.heroFeatureBlock||typeof hp.heroFeatureBlock!=='object')hp.heroFeatureBlock=JSON.parse(JSON.stringify(HERO_FEATURE_DEFAULT));
  const b=hp.heroFeatureBlock;if(!b.titleStyle)b.titleStyle={...HERO_FEATURE_DEFAULT.titleStyle};if(!b.subtitleStyle)b.subtitleStyle={...HERO_FEATURE_DEFAULT.subtitleStyle};if(!b.button)b.button={...HERO_FEATURE_DEFAULT.button};return b;
}
function heroFeatureStyleControls(style,target){return `<div class="home-feature-format-grid"><label>Fuente<select data-hero-feature-style-target="${target}" data-hero-feature-style="fontFamily">${HERO_FONTS.map(f=>`<option ${f===style.fontFamily?'selected':''}>${f}</option>`).join('')}</select></label><label>Peso<select data-hero-feature-style-target="${target}" data-hero-feature-style="fontWeight">${[300,400,500,600,700,800,900].map(w=>`<option value="${w}" ${Number(style.fontWeight)===w?'selected':''}>${w}</option>`).join('')}</select></label><label class="home-check-setting"><input type="checkbox" data-hero-feature-style-target="${target}" data-hero-feature-style="italic" ${style.italic?'checked':''}> Cursiva</label><label>Alineación<select data-hero-feature-style-target="${target}" data-hero-feature-style="textAlign"><option value="left" ${style.textAlign==='left'?'selected':''}>Izquierda</option><option value="center" ${style.textAlign==='center'?'selected':''}>Centro</option><option value="right" ${style.textAlign==='right'?'selected':''}>Derecha</option></select></label><label>Color<input type="color" data-hero-feature-style-target="${target}" data-hero-feature-style="color" value="${style.color||'#111111'}"></label><label>Tamaño escritorio<input type="number" min="8" max="72" data-hero-feature-style-target="${target}" data-hero-feature-style="fontSize" value="${Number(style.fontSize)||30}"></label><label>Tamaño móvil<input type="number" min="8" max="52" data-hero-feature-style-target="${target}" data-hero-feature-style="mobileFontSize" value="${Number(style.mobileFontSize)||24}"></label><label>Espaciado letras<input type="number" min="-8" max="20" data-hero-feature-style-target="${target}" data-hero-feature-style="letterSpacing" value="${Number(style.letterSpacing)||0}"></label></div>`}
function heroFeatureAdminHtml(){
  const b=ensureHeroFeatureBlock();if(!b)return '';const btn=b.button||HERO_FEATURE_DEFAULT.button;
  return `<div class="home-slider-settings home-feature-admin"><div class="home-slider-settings-title"><strong>Bloque dividido debajo del hero</strong><span>Se muestra inmediatamente después del hero principal. Inspirado en un layout de imagen + texto, con una altura moderada.</span></div><div class="home-global-grid"><label class="home-check-setting"><input type="checkbox" data-hero-feature-field="enabled" ${b.enabled!==false?'checked':''}> Mostrar bloque</label><label>Imagen a la<select data-hero-feature-field="imageSide"><option value="left" ${b.imageSide!=='right'?'selected':''}>Izquierda</option><option value="right" ${b.imageSide==='right'?'selected':''}>Derecha</option></select></label><label>Color de fondo del bloque<input type="color" data-hero-feature-field="backgroundColor" value="${b.backgroundColor||'#ffffff'}"><small>Este color se aplica al fondo del bloque debajo del hero.</small></label></div><div id="home-hero-feature-preview" class="home-feature-admin-preview"></div><div class="home-image-actions"><label>Imagen del bloque<input id="home-hero-feature-image-file" type="file" accept="image/jpeg,image/png,image/webp"><small>JPG, PNG o WEBP · máximo 12 MB.</small></label><button type="button" id="home-hero-feature-image-upload">Subir imagen</button></div><div class="home-global-grid"><label>Ancho imagen escritorio (%)<input type="number" min="35" max="65" data-hero-feature-number="imageWidth" value="${Number(b.imageWidth)||50}"></label><label>Alto bloque escritorio (px)<input type="number" min="260" max="620" data-hero-feature-number="minHeight" value="${Number(b.minHeight)||360}"></label><label>Alto imagen móvil (px)<input type="number" min="150" max="420" data-hero-feature-number="mobileImageHeight" value="${Number(b.mobileImageHeight)||220}"></label><label>Posición imagen X (%)<input type="number" min="0" max="100" data-hero-feature-number="imagePositionX" value="${Number(b.imagePositionX)||50}"></label><label>Posición imagen Y (%)<input type="number" min="0" max="100" data-hero-feature-number="imagePositionY" value="${Number(b.imagePositionY)||50}"></label></div><details class="home-feature-details" open><summary>Título</summary><div class="home-feature-detail-body"><label>Texto<textarea rows="2" data-hero-feature-field="title">${esc(b.title||'')}</textarea></label>${heroFeatureStyleControls(b.titleStyle,'titleStyle')}</div></details><details class="home-feature-details"><summary>Texto secundario</summary><div class="home-feature-detail-body"><label>Texto<textarea rows="2" data-hero-feature-field="subtitle">${esc(b.subtitle||'')}</textarea></label>${heroFeatureStyleControls(b.subtitleStyle,'subtitleStyle')}</div></details><details class="home-feature-details"><summary>Botón</summary><div class="home-feature-detail-body"><div class="home-global-grid"><label class="home-check-setting"><input type="checkbox" data-hero-feature-button="enabled" ${btn.enabled!==false?'checked':''}> Mostrar botón</label><label>Texto<input type="text" data-hero-feature-button="text" value="${esc(btn.text||'')}"></label><label>Enlace<input type="text" data-hero-feature-button="href" value="${esc(btn.href||'about-us.html')}"></label></div><div class="home-feature-format-grid"><label>Fuente<select data-hero-feature-button="fontFamily">${HERO_FONTS.map(f=>`<option ${f===btn.fontFamily?'selected':''}>${f}</option>`).join('')}</select></label><label>Peso<select data-hero-feature-button="fontWeight">${[300,400,500,600,700,800,900].map(w=>`<option value="${w}" ${Number(btn.fontWeight)===w?'selected':''}>${w}</option>`).join('')}</select></label><label class="home-check-setting"><input type="checkbox" data-hero-feature-button="italic" ${btn.italic?'checked':''}> Cursiva</label><label>Alineación<select data-hero-feature-button="textAlign"><option value="left" ${btn.textAlign==='left'?'selected':''}>Izquierda</option><option value="center" ${btn.textAlign==='center'?'selected':''}>Centro</option><option value="right" ${btn.textAlign==='right'?'selected':''}>Derecha</option></select></label><label>Color texto<input type="color" data-hero-feature-button="color" value="${btn.color||'#1f1e1c'}"></label><label>Fondo<input type="color" data-hero-feature-button="backgroundColor" value="${btn.backgroundColor==='transparent'?'#ffffff':(btn.backgroundColor||'#ffffff')}"></label><label class="home-check-setting"><input type="checkbox" id="home-hero-feature-button-transparent" ${btn.backgroundColor==='transparent'?'checked':''}> Fondo transparente</label><label>Borde<input type="color" data-hero-feature-button="borderColor" value="${btn.borderColor||'#d7d1c8'}"></label><label>Grosor borde<input type="number" min="0" max="8" data-hero-feature-button="borderWidth" value="${Number(btn.borderWidth)||1}"></label><label>Radio esquinas<input type="number" min="0" max="80" data-hero-feature-button="borderRadius" value="${Number(btn.borderRadius)||0}"></label><label>Ancho (px)<input type="number" min="100" max="520" data-hero-feature-button="width" value="${Number(btn.width)||280}"></label><label>Alto (px)<input type="number" min="32" max="90" data-hero-feature-button="height" value="${Number(btn.height)||48}"></label><label>Tamaño escritorio<input type="number" min="8" max="42" data-hero-feature-button="fontSize" value="${Number(btn.fontSize)||16}"></label><label>Tamaño móvil<input type="number" min="8" max="36" data-hero-feature-button="mobileFontSize" value="${Number(btn.mobileFontSize)||15}"></label></div></div></details><p id="home-hero-feature-message" class="message"></p></div>`;
}
function updateHeroFeatureFromControls(){const b=ensureHeroFeatureBlock();if(!b)return;$$('[data-hero-feature-field]').forEach(input=>{const f=input.dataset.heroFeatureField;if(f==='enabled')b[f]=input.checked;else b[f]=input.value});$$('[data-hero-feature-number]').forEach(input=>b[input.dataset.heroFeatureNumber]=Number(input.value));$$('[data-hero-feature-style]').forEach(input=>{const target=input.dataset.heroFeatureStyleTarget,field=input.dataset.heroFeatureStyle;if(!b[target])b[target]={};if(field==='italic')b[target][field]=input.checked;else if(['fontWeight','fontSize','mobileFontSize','letterSpacing'].includes(field))b[target][field]=Number(input.value);else b[target][field]=input.value});$$('[data-hero-feature-button]').forEach(input=>{const f=input.dataset.heroFeatureButton;if(f==='enabled'||f==='italic')b.button[f]=input.checked;else if(['fontWeight','fontSize','mobileFontSize','borderWidth','borderRadius','width','height'].includes(f))b.button[f]=Number(input.value);else b.button[f]=input.value});if($('#home-hero-feature-button-transparent')?.checked)b.button.backgroundColor='transparent'}
function renderHeroFeatureAdminPreview(){const preview=$('#home-hero-feature-preview'),b=ensureHeroFeatureBlock();if(!preview||!b)return;const img=b.image?`<div class="hfap-media"><img src="${esc(b.image)}" alt=""></div>`:'<div class="hfap-media hfap-empty">Sube una imagen</div>';const btn=b.button||{};const copy=`<div class="hfap-copy"><h3 style="font-family:${heroAdminFont(b.titleStyle.fontFamily)};font-weight:${b.titleStyle.fontWeight};font-style:${b.titleStyle.italic?'italic':'normal'};color:${b.titleStyle.color};text-align:${b.titleStyle.textAlign};font-size:${Math.min(40,Math.max(12,Number(b.titleStyle.fontSize)||30))}px">${esc(b.title||'')}</h3><p style="font-family:${heroAdminFont(b.subtitleStyle.fontFamily)};font-weight:${b.subtitleStyle.fontWeight};font-style:${b.subtitleStyle.italic?'italic':'normal'};color:${b.subtitleStyle.color};text-align:${b.subtitleStyle.textAlign};font-size:${Math.min(24,Math.max(10,Number(b.subtitleStyle.fontSize)||18))}px">${esc(b.subtitle||'')}</p>${btn.enabled!==false?`<span class="hfap-button" style="background:${btn.backgroundColor==='transparent'?'transparent':btn.backgroundColor};color:${btn.color};border:${Number(btn.borderWidth)||0}px solid ${btn.borderColor};border-radius:${Number(btn.borderRadius)||0}px;width:${Math.min(300,Number(btn.width)||280)}px;height:${Math.min(58,Number(btn.height)||48)}px;justify-content:${btn.textAlign==='left'?'flex-start':btn.textAlign==='right'?'flex-end':'center'}">${esc(btn.text||'')}</span>`:''}</div>`;preview.style.background=b.backgroundColor||'#fff';preview.style.gridTemplateColumns=b.imageSide==='right'?`1fr ${Number(b.imageWidth)||50}%`:`${Number(b.imageWidth)||50}% 1fr`;preview.innerHTML=b.imageSide==='right'?copy+img:img+copy;const image=preview.querySelector('img');if(image)image.style.objectPosition=`${Number(b.imagePositionX)||50}% ${Number(b.imagePositionY)||50}%`}
async function uploadHeroFeatureImage(){updateHeroFeatureFromControls();const input=$('#home-hero-feature-image-file'),file=input?.files?.[0],msg=$('#home-hero-feature-message');if(!file){if(msg)msg.textContent='Selecciona una imagen.';return}const body=new FormData();body.append('image',file);if(msg)msg.textContent='Subiendo imagen…';try{const res=await fetch('/api/admin/homepage/image',{method:'POST',credentials:'same-origin',body});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'No fue posible subir la imagen.');ensureHeroFeatureBlock().image=data.path;renderHomepageEditor();const m=$('#home-hero-feature-message');if(m)m.textContent='Imagen cargada. Guarda la portada para publicar el cambio.'}catch(e){if(msg)msg.textContent=e.message}}

const HOME_FEATURE_DEFAULT={enabled:false,image:'',imageSide:'right',imagePositionX:50,imagePositionY:50,imageWidth:58,backgroundColor:'#f4f2ed',minHeight:430,mobileImageHeight:250,contentOffsetX:0,contentOffsetY:0,mobileContentOffsetX:0,mobileContentOffsetY:0,title:'OBEDECE\nO QUÉDATE FUERA',subtitle:'Edición Limitada',titleStyle:{fontFamily:'Arial Black',fontWeight:900,italic:false,color:'#111111',fontSize:42,mobileFontSize:30,letterSpacing:0,textAlign:'left',offsetX:0,offsetY:0,mobileOffsetX:0,mobileOffsetY:0},subtitleStyle:{fontFamily:'Helvetica Neue',fontWeight:700,italic:true,color:'#222222',fontSize:18,mobileFontSize:15,letterSpacing:0,textAlign:'left',offsetX:0,offsetY:0,mobileOffsetX:0,mobileOffsetY:0},button:{enabled:true,text:'👉 Comprar Ahora',href:'shop-all.html',backgroundColor:'transparent',color:'#1f1e1c',borderColor:'#1f1e1c',borderWidth:0,borderRadius:0,fontFamily:'Helvetica Neue',fontWeight:400,italic:false,fontSize:17,mobileFontSize:16,textAlign:'left',width:190,height:46,offsetX:0,offsetY:0,mobileOffsetX:0,mobileOffsetY:0}};
function ensureHomeFeatureBlock(){
  const hp=adminState.homepage;if(!hp)return null;
  if(!hp.homeFeatureBlock||typeof hp.homeFeatureBlock!=='object')hp.homeFeatureBlock=JSON.parse(JSON.stringify(HOME_FEATURE_DEFAULT));
  const b=hp.homeFeatureBlock;
  // V127.34: compactar automáticamente los valores predeterminados heredados de V127.33.
  if(Number(b.minHeight)===520)b.minHeight=430;
  if(Number(b.mobileImageHeight)===320)b.mobileImageHeight=250;
  if(!b.titleStyle)b.titleStyle={...HOME_FEATURE_DEFAULT.titleStyle};if(!b.subtitleStyle)b.subtitleStyle={...HOME_FEATURE_DEFAULT.subtitleStyle};if(!b.button)b.button={...HOME_FEATURE_DEFAULT.button};
  return b;
}
function featureTextControls(style,target){
  return `<div class="home-feature-format-grid">
    <label>Fuente<select data-feature-style-target="${target}" data-feature-style="fontFamily">${HERO_FONTS.map(f=>`<option ${f===style.fontFamily?'selected':''}>${f}</option>`).join('')}</select></label>
    <label>Peso<select data-feature-style-target="${target}" data-feature-style="fontWeight">${[100,200,300,400,500,600,700,800,900].map(w=>`<option value="${w}" ${Number(style.fontWeight)===w?'selected':''}>${w}${w===400?' · Regular':w===700?' · Bold':w===900?' · Black':''}</option>`).join('')}</select></label>
    <label class="home-check-setting"><input type="checkbox" data-feature-style-target="${target}" data-feature-style="italic" ${style.italic?'checked':''}> Cursiva</label>
    <label>Alineación<select data-feature-style-target="${target}" data-feature-style="textAlign"><option value="left" ${style.textAlign==='left'?'selected':''}>Izquierda</option><option value="center" ${style.textAlign==='center'?'selected':''}>Centro</option><option value="right" ${style.textAlign==='right'?'selected':''}>Derecha</option></select></label>
    <label>Color<input type="color" data-feature-style-target="${target}" data-feature-style="color" value="${style.color||'#111111'}"></label>
    <label>Tamaño escritorio<input type="number" min="8" max="96" data-feature-style-target="${target}" data-feature-style="fontSize" value="${Number(style.fontSize)||32}"></label>
    <label>Tamaño móvil<input type="number" min="8" max="64" data-feature-style-target="${target}" data-feature-style="mobileFontSize" value="${Number(style.mobileFontSize)||24}"></label>
    <label>Espaciado letras<input type="number" min="-8" max="20" data-feature-style-target="${target}" data-feature-style="letterSpacing" value="${Number(style.letterSpacing)||0}"></label>
    <label>X escritorio (px)<input type="number" min="-250" max="250" data-feature-style-target="${target}" data-feature-style="offsetX" value="${Number(style.offsetX)||0}"></label>
    <label>Y escritorio (px)<input type="number" min="-250" max="250" data-feature-style-target="${target}" data-feature-style="offsetY" value="${Number(style.offsetY)||0}"></label>
    <label>X móvil (px)<input type="number" min="-160" max="160" data-feature-style-target="${target}" data-feature-style="mobileOffsetX" value="${Number(style.mobileOffsetX)||0}"></label>
    <label>Y móvil (px)<input type="number" min="-160" max="160" data-feature-style-target="${target}" data-feature-style="mobileOffsetY" value="${Number(style.mobileOffsetY)||0}"></label>
  </div>`;
}
function homeFeatureAdminHtml(){
  const b=ensureHomeFeatureBlock();if(!b)return '';
  const btn=b.button||HOME_FEATURE_DEFAULT.button;
  return `<div class="home-slider-settings home-feature-admin">
    <div class="home-slider-settings-title"><strong>Bloque promocional antes de la franja verde</strong><span>Diseña un bloque dividido con imagen, textos y botón. Puedes activarlo o desactivarlo cuando quieras.</span></div>
    <div class="home-global-grid">
      <label class="home-check-setting"><input type="checkbox" data-feature-field="enabled" ${b.enabled?'checked':''}> Mostrar bloque</label>
      <label>Imagen a la<select data-feature-field="imageSide"><option value="right" ${b.imageSide!=='left'?'selected':''}>Derecha</option><option value="left" ${b.imageSide==='left'?'selected':''}>Izquierda</option></select></label>
      <label>Color de fondo del bloque<input type="color" data-feature-field="backgroundColor" value="${b.backgroundColor||'#f4f2ed'}"><small>Este color se aplica al bloque promocional antes de la franja verde.</small></label>
    </div>
    <div id="home-feature-preview" class="home-feature-admin-preview"></div>
    <div class="home-image-actions"><label>Imagen del bloque<input id="home-feature-image-file" type="file" accept="image/jpeg,image/png,image/webp"><small>JPG, PNG o WEBP · máximo 12 MB.</small></label><button type="button" id="home-feature-image-upload">Subir imagen</button></div>
    <div class="home-global-grid">
      <label>Ancho imagen escritorio (%)<input type="number" min="30" max="75" data-feature-number="imageWidth" value="${Number(b.imageWidth)||58}"></label>
      <label>Alto bloque escritorio (px)<input type="number" min="240" max="900" data-feature-number="minHeight" value="${Number(b.minHeight)||430}"></label>
      <label>Alto imagen móvil (px)<input type="number" min="140" max="650" data-feature-number="mobileImageHeight" value="${Number(b.mobileImageHeight)||250}"></label>
      <label>Posición imagen X (%)<input type="number" min="0" max="100" data-feature-number="imagePositionX" value="${Number(b.imagePositionX)||50}"></label>
      <label>Posición imagen Y (%)<input type="number" min="0" max="100" data-feature-number="imagePositionY" value="${Number(b.imagePositionY)||50}"></label>
      <label></label>
    </div>
    <div class="home-global-grid">
      <label>Contenido X escritorio (px)<input type="number" min="-250" max="250" data-feature-number="contentOffsetX" value="${Number(b.contentOffsetX)||0}"></label>
      <label>Contenido Y escritorio (px)<input type="number" min="-250" max="250" data-feature-number="contentOffsetY" value="${Number(b.contentOffsetY)||0}"></label>
      <label></label>
      <label>Contenido X móvil (px)<input type="number" min="-160" max="160" data-feature-number="mobileContentOffsetX" value="${Number(b.mobileContentOffsetX)||0}"></label>
      <label>Contenido Y móvil (px)<input type="number" min="-160" max="160" data-feature-number="mobileContentOffsetY" value="${Number(b.mobileContentOffsetY)||0}"></label>
      <label></label>
    </div>
    <details class="home-feature-details" open><summary>Título principal</summary><div class="home-feature-detail-body"><label>Texto<textarea rows="3" data-feature-field="title">${esc(b.title||'')}</textarea></label>${featureTextControls(b.titleStyle,'titleStyle')}</div></details>
    <details class="home-feature-details"><summary>Texto secundario</summary><div class="home-feature-detail-body"><label>Texto<textarea rows="2" data-feature-field="subtitle">${esc(b.subtitle||'')}</textarea></label>${featureTextControls(b.subtitleStyle,'subtitleStyle')}</div></details>
    <details class="home-feature-details"><summary>Botón</summary><div class="home-feature-detail-body">
      <div class="home-global-grid"><label class="home-check-setting"><input type="checkbox" data-feature-button="enabled" ${btn.enabled!==false?'checked':''}> Mostrar botón</label><label>Texto<input type="text" maxlength="120" data-feature-button="text" value="${esc(btn.text||'')}"></label><label>Enlace<input type="text" maxlength="500" data-feature-button="href" value="${esc(btn.href||'shop-all.html')}"></label></div>
      <div class="home-feature-format-grid">
        <label>Fuente<select data-feature-button="fontFamily">${HERO_FONTS.map(f=>`<option ${f===btn.fontFamily?'selected':''}>${f}</option>`).join('')}</select></label><label>Peso<select data-feature-button="fontWeight">${[300,400,500,600,700,800,900].map(w=>`<option value="${w}" ${Number(btn.fontWeight)===w?'selected':''}>${w}</option>`).join('')}</select></label><label class="home-check-setting"><input type="checkbox" data-feature-button="italic" ${btn.italic?'checked':''}> Cursiva</label><label>Alineación<select data-feature-button="textAlign"><option value="left" ${btn.textAlign==='left'?'selected':''}>Izquierda</option><option value="center" ${btn.textAlign==='center'?'selected':''}>Centro</option><option value="right" ${btn.textAlign==='right'?'selected':''}>Derecha</option></select></label>
        <label>Color texto<input type="color" data-feature-button="color" value="${btn.color||'#1f1e1c'}"></label><label>Fondo<input type="color" data-feature-button="backgroundColor" value="${btn.backgroundColor==='transparent'?'#ffffff':(btn.backgroundColor||'#ffffff')}"></label><label class="home-check-setting"><input type="checkbox" id="home-feature-button-transparent" ${btn.backgroundColor==='transparent'?'checked':''}> Fondo transparente</label><label>Borde<input type="color" data-feature-button="borderColor" value="${btn.borderColor||'#1f1e1c'}"></label>
        <label>Grosor borde<input type="number" min="0" max="8" data-feature-button="borderWidth" value="${Number(btn.borderWidth)||0}"></label><label>Radio esquinas<input type="number" min="0" max="80" data-feature-button="borderRadius" value="${Number(btn.borderRadius)||0}"></label><label>Ancho (px)<input type="number" min="90" max="420" data-feature-button="width" value="${Number(btn.width)||190}"></label><label>Alto (px)<input type="number" min="32" max="90" data-feature-button="height" value="${Number(btn.height)||46}"></label>
        <label>Tamaño escritorio<input type="number" min="8" max="42" data-feature-button="fontSize" value="${Number(btn.fontSize)||17}"></label><label>Tamaño móvil<input type="number" min="8" max="36" data-feature-button="mobileFontSize" value="${Number(btn.mobileFontSize)||16}"></label><label>X escritorio<input type="number" min="-250" max="250" data-feature-button="offsetX" value="${Number(btn.offsetX)||0}"></label><label>Y escritorio<input type="number" min="-250" max="250" data-feature-button="offsetY" value="${Number(btn.offsetY)||0}"></label><label>X móvil<input type="number" min="-160" max="160" data-feature-button="mobileOffsetX" value="${Number(btn.mobileOffsetX)||0}"></label><label>Y móvil<input type="number" min="-160" max="160" data-feature-button="mobileOffsetY" value="${Number(btn.mobileOffsetY)||0}"></label>
      </div>
    </div></details>
    <p id="home-feature-message" class="message"></p>
  </div>`;
}
function updateHomeFeatureFromControls(){
  const b=ensureHomeFeatureBlock();if(!b)return;
  $$('[data-feature-field]').forEach(input=>{const f=input.dataset.featureField;if(f==='enabled')b[f]=input.checked;else b[f]=input.value});
  $$('[data-feature-number]').forEach(input=>b[input.dataset.featureNumber]=Number(input.value));
  $$('[data-feature-style]').forEach(input=>{const target=input.dataset.featureStyleTarget,field=input.dataset.featureStyle;if(!b[target])b[target]={};if(field==='italic')b[target][field]=input.checked;else if(['fontWeight','fontSize','mobileFontSize','letterSpacing','offsetX','offsetY','mobileOffsetX','mobileOffsetY'].includes(field))b[target][field]=Number(input.value);else b[target][field]=input.value});
  $$('[data-feature-button]').forEach(input=>{const f=input.dataset.featureButton;if(f==='enabled'||f==='italic')b.button[f]=input.checked;else if(['fontWeight','fontSize','mobileFontSize','borderWidth','borderRadius','width','height','offsetX','offsetY','mobileOffsetX','mobileOffsetY'].includes(f))b.button[f]=Number(input.value);else b.button[f]=input.value});
  if($('#home-feature-button-transparent')?.checked)b.button.backgroundColor='transparent';
}
function renderHomeFeatureAdminPreview(){
  const preview=$('#home-feature-preview'),b=ensureHomeFeatureBlock();if(!preview||!b)return;
  const img=b.image?`<div class="hfap-media"><img src="${esc(b.image)}" alt=""></div>`:'<div class="hfap-media hfap-empty">Sube una imagen</div>';
  const btn=b.button||{};
  const copy=`<div class="hfap-copy" style="transform:translate(${Number(b.contentOffsetX)||0}px,${Number(b.contentOffsetY)||0}px)"><h3 style="font-family:${heroAdminFont(b.titleStyle.fontFamily)};font-weight:${b.titleStyle.fontWeight};font-style:${b.titleStyle.italic?'italic':'normal'};color:${b.titleStyle.color};text-align:${b.titleStyle.textAlign};font-size:${Math.min(44,Math.max(12,Number(b.titleStyle.fontSize)||42))}px;letter-spacing:${Number(b.titleStyle.letterSpacing)||0}px;transform:translate(${Number(b.titleStyle.offsetX)||0}px,${Number(b.titleStyle.offsetY)||0}px)">${esc(b.title||'').replace(/\n/g,'<br>')}</h3><p style="font-family:${heroAdminFont(b.subtitleStyle.fontFamily)};font-weight:${b.subtitleStyle.fontWeight};font-style:${b.subtitleStyle.italic?'italic':'normal'};color:${b.subtitleStyle.color};text-align:${b.subtitleStyle.textAlign};font-size:${Math.min(24,Math.max(10,Number(b.subtitleStyle.fontSize)||18))}px;transform:translate(${Number(b.subtitleStyle.offsetX)||0}px,${Number(b.subtitleStyle.offsetY)||0}px)">${esc(b.subtitle||'').replace(/\n/g,'<br>')}</p>${btn.enabled!==false?`<span class="hfap-button" style="background:${btn.backgroundColor==='transparent'?'transparent':btn.backgroundColor};color:${btn.color};border:${Number(btn.borderWidth)||0}px solid ${btn.borderColor};border-radius:${Number(btn.borderRadius)||0}px;font-family:${heroAdminFont(btn.fontFamily)};font-weight:${btn.fontWeight};font-style:${btn.italic?'italic':'normal'};text-align:${btn.textAlign};width:${Math.min(220,Number(btn.width)||190)}px;height:${Math.min(58,Number(btn.height)||46)}px;transform:translate(${Number(btn.offsetX)||0}px,${Number(btn.offsetY)||0}px)">${esc(btn.text||'')}</span>`:''}</div>`;
  preview.style.background=b.backgroundColor||'#f4f2ed';preview.style.gridTemplateColumns=b.imageSide==='left'?`${Number(b.imageWidth)||58}% 1fr`:`1fr ${Number(b.imageWidth)||58}%`;preview.innerHTML=b.imageSide==='left'?img+copy:copy+img;
  const image=preview.querySelector('img');if(image)image.style.objectPosition=`${Number(b.imagePositionX)||50}% ${Number(b.imagePositionY)||50}%`;
}
async function uploadHomeFeatureImage(){
  updateHomeFeatureFromControls();const input=$('#home-feature-image-file'),file=input?.files?.[0],msg=$('#home-feature-message');if(!file){if(msg)msg.textContent='Selecciona una imagen.';return}const body=new FormData();body.append('image',file);if(msg)msg.textContent='Subiendo imagen…';
  try{const res=await fetch('/api/admin/homepage/image',{method:'POST',credentials:'same-origin',body});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'No fue posible subir la imagen.');ensureHomeFeatureBlock().image=data.path;renderHomepageEditor();const m=$('#home-feature-message');if(m)m.textContent='Imagen cargada. Guarda la portada para publicar el cambio.';}catch(e){if(msg)msg.textContent=e.message}
}

async function loadHomepage(){
  const root=$('#view-homepage');root.innerHTML='<div class="empty-state">Cargando portada…</div>';
  try{const data=await api('/api/admin/homepage');adminState.homepage=data.homepage;adminState.homepageSlide=Math.min(adminState.homepageSlide,(data.homepage.slides?.length||1)-1);renderHomepageEditor()}catch(e){root.innerHTML=`<div class="empty-state">${esc(e.message)}</div>`}
}
function currentHomeSlide(){return adminState.homepage?.slides?.[adminState.homepageSlide]||null}
function homePreviewHtml(slide,mode=adminState.homepagePreviewMode){
  return (slide.blocks||[]).filter(b=>b.visible!==false&&b.text).map((b,i)=>{
    const mobile=mode==='mobile';
    const x=mobile?(Number.isFinite(Number(b.mobileX))?b.mobileX:b.x):b.x;
    const y=mobile?(Number.isFinite(Number(b.mobileY))?b.mobileY:b.y):b.y;
    return `<div class="home-preview-text" data-preview-block="${i}" style="left:${x}%;top:${y}%;font-family:${heroAdminFont(b.fontFamily)};font-weight:${b.fontWeight};font-style:${b.italic?'italic':'normal'};color:${b.color};background:${b.backgroundColor}">${esc(b.text)}</div>`;
  }).join('')
}
function ensureFooterSettings(){
  const hp=adminState.homepage;if(!hp)return null;
  if(!hp.footerSettings||typeof hp.footerSettings!=='object')hp.footerSettings={phone:'7571541553',facebookUrl:'https://facebook.com/ninosrancios',instagramUrl:'https://instagram.com/ninosrancios'};
  return hp.footerSettings;
}
function footerSettingsAdminHtml(){
  const f=ensureFooterSettings()||{};
  return `<div class="home-slider-settings">
    <div class="home-slider-settings-title"><strong>Pie de página · Contacto y redes</strong><span>Edita el teléfono y los enlaces de Facebook e Instagram sin tocar código.</span></div>
    <div class="home-global-grid">
      <label>Teléfono<input type="text" maxlength="40" data-footer-setting="phone" value="${esc(f.phone||'7571541553')}" placeholder="7571541553"><small>Se mostrará en el pie de página y será clicable en celular.</small></label>
      <label>Facebook<input type="url" maxlength="300" data-footer-setting="facebookUrl" value="${esc(f.facebookUrl||'https://facebook.com/ninosrancios')}" placeholder="https://facebook.com/ninosrancios"></label>
      <label>Instagram<input type="url" maxlength="300" data-footer-setting="instagramUrl" value="${esc(f.instagramUrl||'https://instagram.com/ninosrancios')}" placeholder="https://instagram.com/ninosrancios"></label>
    </div>
    <div class="admin-note">Los enlaces de redes sociales se abren en una pestaña nueva. Guarda la portada para publicar los cambios.</div>
  </div>`;
}
function renderHomepageEditor(){
  const root=$('#view-homepage'),hp=adminState.homepage,slide=currentHomeSlide();if(!hp||!slide)return;
  const ribbonPages=Array.isArray(hp.promoRibbonPages)?hp.promoRibbonPages:HOMEPAGE_RIBBON_PAGES.map(p=>p.file);
  root.innerHTML=`<div class="homepage-admin-toolbar"><div class="admin-note">Edita la portada principal sin tocar código. Puedes usar varias diapositivas, elegir imagen o video y mover/formatear cada texto. Montserrat ya está disponible con pesos 100–900 y cursiva.</div><div><button type="button" class="secondary-home-action" id="home-add-slide">+ Diapositiva</button><button type="button" class="primary-admin-action" id="home-save">Guardar portada</button></div></div>
  <div class="home-editor-layout">
    <div>
      <div class="home-slide-tabs">${hp.slides.map((s,i)=>`<button type="button" class="${i===adminState.homepageSlide?'active':''}" data-home-slide="${i}">Diapositiva ${i+1}</button>`).join('')}</div>
      <div class="home-preview-mode">
        <strong>Vista previa:</strong>
        <button type="button" class="${adminState.homepagePreviewMode==='desktop'?'active':''}" data-home-preview-mode="desktop">Escritorio</button>
        <button type="button" class="${adminState.homepagePreviewMode==='mobile'?'active':''}" data-home-preview-mode="mobile">Móvil 375 px</button>
        <button type="button" id="home-auto-mobile">Ajustar móvil automáticamente</button>
      </div>
      <div class="home-preview ${adminState.homepagePreviewMode==='mobile'?'mobile-preview':''}" id="home-preview">${slide.mediaType==='video'&&slide.video?`<video class="home-preview-media" src="${esc(slide.video)}" muted loop autoplay playsinline preload="auto" aria-hidden="true"></video>`:`<img class="home-preview-media" src="${esc(slide.image)}" alt="">`}<div class="home-preview-overlay"></div><div class="home-preview-texts">${homePreviewHtml(slide)}</div></div>
      <div class="home-media-type-row"><label>Contenido del hero<select id="home-media-type" data-home-slide-string="mediaType"><option value="image" ${slide.mediaType!=='video'?'selected':''}>Imagen</option><option value="video" ${slide.mediaType==='video'?'selected':''} ${!slide.video?'disabled':''}>Video</option></select><small>${slide.video?'Puedes alternar entre la imagen y el video cargados.':'Sube un video para habilitar esta opción.'}</small></label></div>
      <div class="home-image-actions"><label>Imagen de portada / respaldo<input id="home-image-file" type="file" accept="image/jpeg,image/png,image/webp"><small>JPG, PNG o WEBP · máximo 12 MB. También se usa como imagen de respaldo del video.</small></label><button type="button" id="home-upload-image">Subir imagen</button></div>
      <div class="home-image-actions"><label>Video de portada<input id="home-video-file" type="file" accept="video/mp4,video/webm,.mp4,.webm"><small>MP4 o WEBM · máximo 120 MB. Se reproduce automáticamente, en silencio y en bucle.</small></label><button type="button" id="home-upload-video">Subir video</button></div>
      <div class="home-global-grid"><label>Posición multimedia X (%)<input type="number" min="0" max="100" data-home-slide-field="imagePositionX" value="${slide.imagePositionX}"></label><label>Posición multimedia Y (%)<input type="number" min="0" max="100" data-home-slide-field="imagePositionY" value="${slide.imagePositionY}"></label><label>Oscurecer multimedia (0–0.8)<input type="number" min="0" max="0.8" step="0.05" data-home-slide-field="overlayOpacity" value="${slide.overlayOpacity}"></label></div>
      <div class="home-global-grid"><label>Alto escritorio (px)<input type="number" min="360" max="900" data-home-global="height" value="${hp.height}"></label><label>Alto móvil (px)<input type="number" min="320" max="800" data-home-global="mobileHeight" value="${hp.mobileHeight}"></label><label>Cambio automático (seg.)<input type="number" min="0" max="15" data-home-global="autoplaySeconds" value="${hp.autoplaySeconds}"><small>0 = desactivado</small></label></div>
      <div class="home-slider-settings">
        <div class="home-slider-settings-title"><strong>Navegación y transición</strong><span>Configura el comportamiento del carrusel sin tocar código.</span></div>
        <div class="home-global-grid">
          <label class="home-check-setting"><input type="checkbox" data-home-global-bool="showArrows" ${hp.showArrows!==false?'checked':''}> Mostrar flechas</label>
          <label class="home-check-setting"><input type="checkbox" data-home-global-bool="showDots" ${hp.showDots!==false?'checked':''}> Mostrar indicadores</label>
          <label>Dirección automática<select data-home-global-string="autoplayDirection"><option value="next" ${hp.autoplayDirection!=='previous'?'selected':''}>Hacia adelante</option><option value="previous" ${hp.autoplayDirection==='previous'?'selected':''}>Hacia atrás</option></select></label>
        </div>
        <div class="home-global-grid">
          <label>Tipo de transición<select data-home-global-string="transitionType"><option value="slide" ${hp.transitionType!=='fade'?'selected':''}>Deslizamiento lateral</option><option value="fade" ${hp.transitionType==='fade'?'selected':''}>Fundido</option></select></label>
          <label>Duración transición (ms)<input type="number" min="150" max="1600" step="50" data-home-global="transitionDurationMs" value="${hp.transitionDurationMs||560}"><small>560 ms recomendado</small></label>
          <label>Opacidad flechas (%)<input type="number" min="15" max="100" data-home-global-percent="arrowOpacity" value="${Math.round((hp.arrowOpacity??.92)*100)}"></label>
        </div>
        <div class="home-global-grid">
          <label>Tamaño flechas escritorio (px)<input type="number" min="18" max="90" data-home-global="arrowSize" value="${hp.arrowSize||46}"></label>
          <label>Tamaño flechas móvil (px)<input type="number" min="18" max="70" data-home-global="arrowSizeMobile" value="${hp.arrowSizeMobile||34}"></label>
          <label>Grosor flechas<select data-home-global="arrowWeight"><option value="100" ${Number(hp.arrowWeight)===100?'selected':''}>Muy fino</option><option value="200" ${Number(hp.arrowWeight||200)===200?'selected':''}>Fino</option><option value="300" ${Number(hp.arrowWeight)===300?'selected':''}>Normal</option><option value="400" ${Number(hp.arrowWeight)===400?'selected':''}>Medio</option></select></label>
        </div>
        <div class="home-global-grid home-slider-last-row">
          <label>Color flechas<input type="color" data-home-global-string="arrowColor" value="${hp.arrowColor||'#ffffff'}"></label>
        </div>
      </div>
      <div class="home-slider-settings">
        <div class="home-slider-settings-title"><strong>Cinta de texto antes de la franja verde</strong><span>Se muestra arriba de la franja verde de beneficios y se desplaza de forma continua, estilo marquee.</span></div>
        <div class="home-global-grid">
          <label class="home-check-setting"><input type="checkbox" data-home-global-bool="promoRibbonEnabled" ${hp.promoRibbonEnabled!==false?'checked':''}> Mostrar cinta</label>
          <label>Velocidad / recorrido (seg.)<input type="number" min="8" max="60" data-home-global="promoRibbonDuration" value="${hp.promoRibbonDuration||26}"><small>Menor número = más rápido</small></label>
          <label>Color de fondo<input type="color" data-home-global-string="promoRibbonBackgroundColor" value="${hp.promoRibbonBackgroundColor||'#0f0f0f'}"></label>
        </div>
        <div class="home-global-grid">
          <label>Color del texto<input type="color" data-home-global-string="promoRibbonTextColor" value="${hp.promoRibbonTextColor||'#ffffff'}"></label>
          <label>Tamaño del texto (px)<input type="number" min="10" max="40" data-home-global="promoRibbonFontSize" value="${hp.promoRibbonFontSize||15}"></label>
          <label>Espaciado (px)<input type="number" min="4" max="80" data-home-global="promoRibbonSpacing" value="${hp.promoRibbonSpacing||26}"><small>Controla el espacio entre repeticiones</small></label>
        </div>
        <div class="home-global-grid">
          <label>Separador / símbolo<input type="text" maxlength="12" data-home-global-string="promoRibbonSeparator" value="${esc(hp.promoRibbonSeparator||'✦')}" placeholder="✦"><small>Se usa cuando no hay un SVG cargado.</small></label>
          <label>Tamaño del icono SVG (px)<input type="number" min="10" max="60" data-home-global="promoRibbonSeparatorIconSize" value="${hp.promoRibbonSeparatorIconSize||22}"></label>
          <label>Vista previa<input type="text" value="Texto en movimiento" readonly style="background:${esc(hp.promoRibbonBackgroundColor||'#0f0f0f')};color:${esc(hp.promoRibbonTextColor||'#ffffff')};font-weight:800;font-size:${Number(hp.promoRibbonFontSize||15)}px"></label>
        </div>
        <div class="home-ribbon-icon-editor">
          <div class="home-ribbon-icon-preview">${hp.promoRibbonSeparatorIcon?`<img src="${esc(hp.promoRibbonSeparatorIcon)}" alt="Separador SVG actual"><span>SVG cargado</span>`:'<div class="home-ribbon-icon-empty">Sin icono SVG. Se usará el símbolo de texto.</div>'}</div>
          <div class="home-ribbon-icon-actions">
            <label>Icono separador SVG<input id="home-ribbon-icon-file" type="file" accept=".svg,image/svg+xml"><small>Solo SVG · máximo 512 KB. Conserva los colores originales del archivo.</small></label>
            <button type="button" id="home-ribbon-icon-upload">Subir SVG</button>
            ${hp.promoRibbonSeparatorIcon?'<button type="button" class="secondary-home-action" id="home-ribbon-icon-remove">Quitar SVG</button>':''}
          </div>
          <p id="home-ribbon-icon-message" class="message"></p>
        </div>
        <div class="home-global-grid">
          <label class="home-wide">Texto de la cinta<textarea rows="2" data-home-global-string="promoRibbonText">${esc(hp.promoRibbonText||'')}</textarea><small>Ejemplo: ENVÍOS GRATIS EN TIENDA Y A DOMICILIO DESDE $799</small></label>
        </div>
        <div class="home-page-visibility-block">
          <div class="home-page-visibility-title"><strong>Mostrar esta cinta en páginas específicas</strong><span>Activa solo las páginas donde quieres que aparezca. No se mostrará en carrito, checkout, pedido pagado ni búsqueda de pedidos.</span></div>
          <div class="home-page-checkboxes">${HOMEPAGE_RIBBON_PAGES.map(page=>`<label class="home-page-check"><input type="checkbox" data-home-ribbon-page="${page.file}" ${ribbonPages.includes(page.file)?'checked':''}> <span>${page.label}</span></label>`).join('')}</div>
        </div>
      </div>
      ${footerSettingsAdminHtml()}
      ${catalogAdminHtml()}
      ${heroFeatureAdminHtml()}
      ${homeFeatureAdminHtml()}
      ${benefitsBandAdminHtml()}
      <div class="home-global-grid"><label>Escala textos escritorio (%)<input type="number" min="30" max="150" data-home-global-scale="desktopTextScale" value="${Math.round((hp.desktopTextScale||.65)*100)}"><small>65% recomendado</small></label><label>Escala general móvil (%)<input type="number" min="30" max="150" data-home-global-scale="mobileTextScale" value="${Math.round((hp.mobileTextScale||1)*100)}"><small>100% recomendado</small></label><label>Vista previa<input type="text" value="Proporción escritorio 1680×635" readonly></label></div>
      <div class="home-slide-actions"><button type="button" id="home-add-text">+ Añadir texto</button>${hp.slides.length>1?'<button type="button" class="danger-home-action" id="home-remove-slide">Eliminar diapositiva</button>':''}</div>
    </div>
    <div class="home-text-editor"><h2>Textos de esta diapositiva</h2>${(slide.blocks||[]).map((b,i)=>homeTextBlockEditor(b,i)).join('')}</div>
  </div><p id="home-message" class="message"></p>`;
  bindHomepageEditor();
  requestAnimationFrame(()=>{renderHomeAdminPreview();renderCatalogAdminPreview();renderHeroFeatureAdminPreview();renderHomeFeatureAdminPreview();renderBenefitsAdminPreview()});
}
function homeTextBlockEditor(b,i){return `<details class="home-text-card" ${i===0?'open':''}><summary><span>${esc(b.text||'Texto nuevo').slice(0,38)}</span><small>Editar</small></summary><div class="home-text-fields">
  <label class="home-wide">Texto<textarea rows="2" data-home-block="${i}" data-block-field="text">${esc(b.text)}</textarea></label>
  <div class="home-wide home-device-label">Escritorio</div>
  <label>X escritorio (%)<input type="number" min="0" max="100" data-home-block="${i}" data-block-field="x" value="${b.x}"></label><label>Y escritorio (%)<input type="number" min="0" max="100" data-home-block="${i}" data-block-field="y" value="${b.y}"></label>
  <label>Tamaño escritorio (px)<input type="number" min="8" max="140" data-home-block="${i}" data-block-field="fontSize" value="${b.fontSize}"></label><label>Fuente<select data-home-block="${i}" data-block-field="fontFamily">${HERO_FONTS.map(f=>`<option ${f===b.fontFamily?'selected':''}>${f}</option>`).join('')}</select></label>
  <div class="home-wide home-device-label mobile">Móvil</div>
  <label>X móvil (%)<input type="number" min="0" max="100" data-home-block="${i}" data-block-field="mobileX" value="${Number.isFinite(Number(b.mobileX))?b.mobileX:b.x}"></label><label>Y móvil (%)<input type="number" min="0" max="100" data-home-block="${i}" data-block-field="mobileY" value="${Number.isFinite(Number(b.mobileY))?b.mobileY:b.y}"></label>
  <label class="home-wide">Tamaño móvil (px)<input type="number" min="8" max="72" data-home-block="${i}" data-block-field="mobileFontSize" value="${b.mobileFontSize||Math.round(Math.min(32,Math.max(10,b.fontSize*.42)))}"><small>Este tamaño es independiente del escritorio.</small></label>
  <label>Peso<select data-home-block="${i}" data-block-field="fontWeight">${[100,200,300,400,500,600,700,800,900].map(w=>`<option value="${w}" ${w===b.fontWeight?'selected':''}>${w}${w===400?' · Regular':w===500?' · Medium':w===600?' · SemiBold':w===700?' · Bold':w===800?' · ExtraBold':w===900?' · Black':''}</option>`).join('')}</select></label><label>Espaciado letras<input type="number" min="-10" max="20" step="1" data-home-block="${i}" data-block-field="letterSpacing" value="${b.letterSpacing}"></label>
  <label>Color texto<input type="color" data-home-block="${i}" data-block-field="color" value="${b.color==='transparent'?'#000000':b.color}"></label><label>Color fondo<input type="color" data-home-block="${i}" data-block-field="backgroundColor" value="${b.backgroundColor==='transparent'?'#ffffff':b.backgroundColor}"></label>
  <label>Padding horizontal<input type="number" min="0" max="60" data-home-block="${i}" data-block-field="paddingX" value="${b.paddingX}"></label><label>Padding vertical<input type="number" min="0" max="30" data-home-block="${i}" data-block-field="paddingY" value="${b.paddingY}"></label>
  <label class="home-check"><input type="checkbox" data-home-block="${i}" data-block-field="italic" ${b.italic?'checked':''}> Cursiva</label><label class="home-check"><input type="checkbox" data-home-block="${i}" data-block-field="visible" ${b.visible!==false?'checked':''}> Visible</label><label class="home-check"><input type="checkbox" data-home-block="${i}" data-block-transparent ${b.backgroundColor==='transparent'?'checked':''}> Fondo transparente</label>
  <button type="button" class="home-remove-text" data-remove-home-block="${i}">Eliminar texto</button>
</div></details>`}
function updateHomepageFromControls(){
  const hp=adminState.homepage,slide=currentHomeSlide();
  $$('[data-home-global]').forEach(input=>hp[input.dataset.homeGlobal]=Number(input.value));
  $$('[data-home-global-scale]').forEach(input=>hp[input.dataset.homeGlobalScale]=Number(input.value)/100);
  $$('[data-home-global-percent]').forEach(input=>hp[input.dataset.homeGlobalPercent]=Number(input.value)/100);
  $$('[data-home-global-bool]').forEach(input=>hp[input.dataset.homeGlobalBool]=input.checked);
  $$('[data-home-global-string]').forEach(input=>hp[input.dataset.homeGlobalString]=input.value);
  hp.promoRibbonPages=$$('[data-home-ribbon-page]').filter(input=>input.checked).map(input=>input.dataset.homeRibbonPage);
  const footerSettings=ensureFooterSettings();
  $$('[data-footer-setting]').forEach(input=>{if(footerSettings)footerSettings[input.dataset.footerSetting]=input.value.trim()});
  updateBenefitsBandFromControls();
  updateCatalogFromControls();
  updateHeroFeatureFromControls();
  updateHomeFeatureFromControls();
  $$('[data-home-slide-field]').forEach(input=>slide[input.dataset.homeSlideField]=Number(input.value));
  $$('[data-home-slide-string]').forEach(input=>slide[input.dataset.homeSlideString]=input.value);
  $$('[data-home-block]').forEach(input=>{const i=Number(input.dataset.homeBlock),b=slide.blocks[i],field=input.dataset.blockField;if(!b)return;if(field==='italic'||field==='visible')b[field]=input.checked;else if(['x','y','mobileX','mobileY','fontSize','mobileFontSize','fontWeight','letterSpacing','paddingX','paddingY'].includes(field))b[field]=Number(input.value);else b[field]=input.value});
  $$('[data-block-transparent]').forEach(input=>{const i=Number(input.dataset.homeBlock);if(slide.blocks[i]&&input.checked)slide.blocks[i].backgroundColor='transparent'});
}
function bindHomepageEditor(){
  if(!window.__homePreviewResizeBound){window.__homePreviewResizeBound=true;window.addEventListener('resize',()=>{if($('#home-preview'))renderHomeAdminPreview()})}
  $$('[data-home-slide]').forEach(btn=>btn.onclick=()=>{updateHomepageFromControls();adminState.homepageSlide=Number(btn.dataset.homeSlide);renderHomepageEditor()});
  $$('[data-home-preview-mode]').forEach(btn=>btn.onclick=()=>{updateHomepageFromControls();adminState.homepagePreviewMode=btn.dataset.homePreviewMode||'desktop';renderHomepageEditor()});
  $('#home-media-type')?.addEventListener('change',()=>{updateHomepageFromControls();renderHomepageEditor()});
  $('#home-auto-mobile')?.addEventListener('click',()=>{updateHomepageFromControls();const blocks=currentHomeSlide().blocks||[];blocks.forEach((b,i)=>{b.mobileX=Number(b.x)||50;b.mobileY=Number(b.y)||50;b.mobileFontSize=Math.round(Math.min(32,Math.max(10,(Number(b.fontSize)||32)*.42)));});renderHomepageEditor();toast('Ajuste móvil aplicado. Revisa la vista Móvil y guarda la portada.');});
  $$('[data-catalog-field],[data-catalog-title],#catalog-title-transparent').forEach(input=>{const evt=(input.type==='checkbox'||input.tagName==='SELECT'||input.type==='color')?'change':'input';input.addEventListener(evt,()=>{updateCatalogFromControls();renderCatalogAdminPreview()})});
  $('[data-catalog-title="backgroundColor"]')?.addEventListener('input',()=>{const transparent=$('#catalog-title-transparent');if(transparent)transparent.checked=false;updateCatalogFromControls();renderCatalogAdminPreview()});
  $$('[data-hero-feature-field],[data-hero-feature-number],[data-hero-feature-style],[data-hero-feature-button],#home-hero-feature-button-transparent').forEach(input=>{const evt=(input.type==='checkbox'||input.tagName==='SELECT'||input.type==='color')?'change':'input';input.addEventListener(evt,()=>{updateHeroFeatureFromControls();renderHeroFeatureAdminPreview()})});
  $('#home-hero-feature-image-upload')?.addEventListener('click',uploadHeroFeatureImage);
  $$('[data-feature-field],[data-feature-number],[data-feature-style],[data-feature-button],#home-feature-button-transparent').forEach(input=>{const evt=(input.type==='checkbox'||input.tagName==='SELECT'||input.type==='color')?'change':'input';input.addEventListener(evt,()=>{updateHomeFeatureFromControls();renderHomeFeatureAdminPreview()})});
  $('#home-feature-image-upload')?.addEventListener('click',uploadHomeFeatureImage);
  $$('[data-benefits-bg],[data-benefit-field],[data-benefit-style],[data-benefit-offset]').forEach(input=>{const evt=(input.type==='checkbox'||input.tagName==='SELECT'||input.type==='color')?'change':'input';input.addEventListener(evt,()=>{updateBenefitsBandFromControls();renderBenefitsAdminPreview()})});
  $$('[data-benefit-move]').forEach(btn=>btn.onclick=()=>moveBenefitText(Number(btn.dataset.benefitMove),btn.dataset.benefitDevice,btn.dataset.benefitAxis,Number(btn.dataset.benefitDelta)));
  $$('[data-benefit-move-reset]').forEach(btn=>btn.onclick=()=>resetBenefitTextPosition(Number(btn.dataset.benefitMoveReset),btn.dataset.benefitDevice));
  $$('[data-benefit-subtitle-move]').forEach(btn=>btn.onclick=()=>moveBenefitSubtitle(Number(btn.dataset.benefitSubtitleMove),btn.dataset.benefitDevice,btn.dataset.benefitAxis,Number(btn.dataset.benefitDelta)));
  $$('[data-benefit-subtitle-reset]').forEach(btn=>btn.onclick=()=>resetBenefitSubtitlePosition(Number(btn.dataset.benefitSubtitleReset),btn.dataset.benefitDevice));
  $$('[data-benefit-icon-upload]').forEach(btn=>btn.onclick=()=>uploadBenefitIcon(Number(btn.dataset.benefitIconUpload)));
  $$('[data-benefit-icon-reset]').forEach(btn=>btn.onclick=()=>{updateBenefitsBandFromControls();const i=Number(btn.dataset.benefitIconReset);ensureBenefitsBand().items[i].icon=BENEFIT_DEFAULTS[i].icon;renderHomepageEditor();toast('Icono original restaurado. Guarda la portada para publicar el cambio.');});
  $$('[data-home-global],[data-home-global-scale],[data-home-global-percent],[data-home-global-bool],[data-home-global-string],[data-home-ribbon-page],[data-footer-setting],[data-home-slide-field],[data-home-slide-string],[data-home-block],[data-block-transparent]').forEach(input=>{
    const evt=(input.type==='checkbox'||input.tagName==='SELECT'||input.type==='color')?'change':'input';
    input.addEventListener(evt,()=>{updateHomepageFromControls();renderHomeAdminPreview()});
  });
  $$('[data-remove-home-block]').forEach(btn=>btn.onclick=()=>{updateHomepageFromControls();currentHomeSlide().blocks.splice(Number(btn.dataset.removeHomeBlock),1);renderHomepageEditor()});
  $('#home-add-text')?.addEventListener('click',()=>{updateHomepageFromControls();const blocks=currentHomeSlide().blocks;if(blocks.length>=10)return alert('Máximo 10 textos por diapositiva.');blocks.push({id:`text-${Date.now()}`,text:'NUEVO TEXTO',x:50,y:50,mobileX:50,mobileY:50,fontFamily:'Montserrat',fontSize:34,mobileFontSize:16,fontWeight:700,italic:false,color:'#050505',backgroundColor:'transparent',paddingX:0,paddingY:0,letterSpacing:0,visible:true});renderHomepageEditor()});
  $('#home-add-slide')?.addEventListener('click',()=>{updateHomepageFromControls();if(adminState.homepage.slides.length>=6)return alert('Máximo 6 diapositivas.');const base=JSON.parse(JSON.stringify(currentHomeSlide()));base.id=`slide-${Date.now()}`;adminState.homepage.slides.push(base);adminState.homepageSlide=adminState.homepage.slides.length-1;renderHomepageEditor()});
  $('#home-remove-slide')?.addEventListener('click',()=>{if(!confirm('¿Eliminar esta diapositiva?'))return;adminState.homepage.slides.splice(adminState.homepageSlide,1);adminState.homepageSlide=Math.max(0,adminState.homepageSlide-1);renderHomepageEditor()});
  $('#home-upload-image')?.addEventListener('click',uploadHomepageImage);
  $('#home-upload-video')?.addEventListener('click',uploadHomepageVideo);
  $('#home-ribbon-icon-upload')?.addEventListener('click',uploadPromoRibbonIcon);
  $('#home-ribbon-icon-remove')?.addEventListener('click',()=>{updateHomepageFromControls();adminState.homepage.promoRibbonSeparatorIcon='';renderHomepageEditor();toast('Icono SVG retirado. Guarda la portada para publicar el cambio.');});
  $('#home-save')?.addEventListener('click',saveHomepageSettings);
}
function renderHomeAdminPreview(){
  const slide=currentHomeSlide(),preview=$('#home-preview'),hp=adminState.homepage;if(!slide||!preview||!hp)return;
  const mobile=adminState.homepagePreviewMode==='mobile';
  preview.classList.toggle('mobile-preview',mobile);
  if(mobile)preview.style.aspectRatio=`375 / ${Number(hp.mobileHeight)||560}`;
  else preview.style.aspectRatio='1680 / 635';
  const media=$('.home-preview-media',preview),overlay=$('.home-preview-overlay',preview),texts=$('.home-preview-texts',preview);
  if(media){
    media.style.objectPosition=`${slide.imagePositionX}% ${slide.imagePositionY}%`;
    if(media.tagName==='VIDEO'){
      media.src=slide.video||'';
      media.muted=true;media.loop=true;media.playsInline=true;
      media.play().catch(()=>{});
    }else media.src=slide.image||'';
  }
  if(overlay)overlay.style.background=`rgba(0,0,0,${Number(slide.overlayOpacity)||0})`;
  texts.innerHTML=homePreviewHtml(slide,mobile?'mobile':'desktop');
  const canvasScale=mobile?(preview.clientWidth/375):(preview.clientWidth/1680);
  const globalScale=mobile?(Number(hp.mobileTextScale)||1):(Number(hp.desktopTextScale)||.65);
  $$('.home-preview-text',texts).forEach(el=>{
    const b=slide.blocks[Number(el.dataset.previewBlock)];if(!b)return;
    const desktopSize=Number(b.fontSize)||32;
    const size=mobile?(Number(b.mobileFontSize)||Math.min(32,Math.max(10,Math.round(desktopSize*.42)))):desktopSize;
    const ratio=mobile?(size/desktopSize):1;
    const letter=(Number(b.letterSpacing)||0)*(mobile?ratio:1);
    const px=(Number(b.paddingX)||0)*(mobile?ratio:1),py=(Number(b.paddingY)||0)*(mobile?ratio:1);
    const scale=canvasScale*globalScale;
    el.style.fontSize=`${Math.max(4,size*scale)}px`;
    el.style.letterSpacing=`${letter*scale}px`;
    el.style.padding=`${py*scale}px ${px*scale}px`;
    el.style.whiteSpace=mobile?'pre-line':'pre-line';
    el.style.maxWidth=mobile?'92%':'94%';
  });
}
async function uploadPromoRibbonIcon(){
  updateHomepageFromControls();
  const input=$('#home-ribbon-icon-file'),file=input?.files?.[0],msg=$('#home-ribbon-icon-message');
  if(!file){if(msg)msg.textContent='Selecciona un archivo SVG.';return}
  const body=new FormData();body.append('icon',file);if(msg)msg.textContent='Subiendo SVG…';
  try{
    const res=await fetch('/api/admin/homepage/ribbon-icon',{method:'POST',credentials:'same-origin',body});
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||'No fue posible subir el SVG.');
    adminState.homepage.promoRibbonSeparatorIcon=data.path;
    renderHomepageEditor();
    const nextMsg=$('#home-ribbon-icon-message');if(nextMsg)nextMsg.textContent='SVG cargado. Guarda la portada para publicar el cambio.';
  }catch(e){if(msg)msg.textContent=e.message}
}
async function uploadHomepageImage(){
  updateHomepageFromControls();const input=$('#home-image-file'),file=input?.files?.[0],msg=$('#home-message');if(!file){msg.textContent='Selecciona una imagen.';return}const body=new FormData();body.append('image',file);msg.textContent='Subiendo imagen…';
  try{const res=await fetch('/api/admin/homepage/image',{method:'POST',credentials:'same-origin',body});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'No fue posible subir la imagen.');currentHomeSlide().image=data.path;currentHomeSlide().mediaType='image';msg.textContent='Imagen cargada. Guarda la portada para publicar el cambio.';renderHomepageEditor()}catch(e){msg.textContent=e.message}
}
async function uploadHomepageVideo(){
  updateHomepageFromControls();const input=$('#home-video-file'),file=input?.files?.[0],msg=$('#home-message');if(!file){msg.textContent='Selecciona un video MP4 o WEBM.';return}const body=new FormData();body.append('video',file);msg.textContent='Subiendo video…';
  try{const res=await fetch('/api/admin/homepage/video',{method:'POST',credentials:'same-origin',body});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'No fue posible subir el video.');const slide=currentHomeSlide();slide.video=data.path;slide.mediaType='video';msg.textContent='Video cargado. Guarda la portada para publicar el cambio.';renderHomepageEditor()}catch(e){msg.textContent=e.message}
}
async function saveHomepageSettings(){
  updateHomepageFromControls();const btn=$('#home-save'),msg=$('#home-message');btn.disabled=true;msg.textContent='Guardando portada…';try{const data=await api('/api/admin/homepage',{method:'PATCH',body:JSON.stringify(adminState.homepage)});adminState.homepage=data.homepage;msg.textContent='Portada guardada y publicada.';toast('Portada actualizada');renderHomepageEditor()}catch(e){msg.textContent=e.message}finally{btn.disabled=false}
}


const EMAIL_TEMPLATE_SAMPLE={pedido:'NR-48273195',total:'MX$329.00',metodo_pago:'Mercado Pago',entrega:'Envío nacional',estado:'Enviado',nombre:'Cliente de prueba',correo:'cliente@ejemplo.com',asunto:'Disponibilidad de una playera',nuevo_correo:'nuevo@ejemplo.com',correo_anterior:'anterior@ejemplo.com',action_url:'https://niñosrancios.com/accion-de-prueba',account_url:'https://niñosrancios.com/account.html',contact_url:'https://niñosrancios.com/contact.html',year:new Date().getFullYear(),store_url:'https://niñosrancios.com'};
function emailTemplateApply(text,vars=EMAIL_TEMPLATE_SAMPLE){return String(text??'').replace(/\{\{([a-z0-9_]+)\}\}/gi,(_,key)=>vars[key]??'')}
function emailSettings(){return adminState.emailTemplates?.settings||{}}

async function loadSizeGuideAdmin(){
  const root=$('#view-sizeguide');
  root.innerHTML='<div class="empty-state">Cargando guía de tallas…</div>';
  try{
    const data=await api('/api/admin/size-guide');
    adminState.sizeGuide=data.guide;
    renderSizeGuideAdmin();
  }catch(e){root.innerHTML=`<div class="empty-state">${esc(e.message)}</div>`}
}
function sizeGuideRowsHtml(rows=[]){
  return rows.map((row,index)=>`<div class="size-guide-admin-row" data-size-row>
    <input type="text" maxlength="20" value="${esc(row.size)}" aria-label="Talla ${index+1}" data-size-name>
    <input type="number" min="0.1" max="250" step="0.1" value="${Number(row.length||0)}" aria-label="Largo ${index+1}" data-size-length>
    <input type="number" min="0.1" max="250" step="0.1" value="${Number(row.width||0)}" aria-label="Ancho ${index+1}" data-size-width>
    <button type="button" class="size-guide-remove" data-size-remove aria-label="Eliminar talla">×</button>
  </div>`).join('');
}
function renderSizeGuideAdmin(){
  const root=$('#view-sizeguide'),g=adminState.sizeGuide||{};
  root.innerHTML=`<div class="admin-note">Esta guía se muestra en las páginas de producto al pulsar <strong>Guía de tallas</strong>. Las medidas iniciales corresponden a las playeras del proveedor que usas actualmente.</div>
  <div class="size-guide-admin-grid">
    <form id="size-guide-form" class="panel size-guide-admin-panel">
      <div class="panel-head"><h2>Guía global de playeras</h2><p>Edita el texto y las medidas sin tocar código.</p></div>
      <div class="size-guide-admin-body">
        <label class="home-check"><input id="size-guide-enabled" type="checkbox" ${g.enabled!==false?'checked':''}> Mostrar “Guía de tallas” en productos</label>
        <label>Título<input id="size-guide-title" type="text" maxlength="100" value="${esc(g.title||'Guía de tallas')}"></label>
        <label>Subtítulo<input id="size-guide-subtitle" type="text" maxlength="180" value="${esc(g.subtitle||'')}"></label>
        <div class="editor-two"><label>Unidad<input id="size-guide-units" type="text" maxlength="40" value="${esc(g.units||'Centímetros')}"></label><label>Tolerancia<input id="size-guide-tolerance" type="text" maxlength="100" value="${esc(g.tolerance||'Tolerancia: ±2 cm')}"></label></div>
        <label>Cómo medir<textarea id="size-guide-note" rows="4" maxlength="800">${esc(g.note||'')}</textarea></label>
        <div class="size-guide-admin-table">
          <div class="size-guide-admin-row size-guide-admin-head"><strong>Talla</strong><strong>Largo</strong><strong>Ancho</strong><span></span></div>
          <div id="size-guide-rows">${sizeGuideRowsHtml(g.rows||[])}</div>
          <button type="button" id="size-guide-add-row" class="secondary-home-action">+ Añadir talla</button>
        </div>
        <div class="admin-modal-actions"><button type="submit" class="primary-admin-action">Guardar guía</button></div>
        <p id="size-guide-message" class="message"></p>
      </div>
    </form>
    <div class="panel size-guide-preview-panel"><div class="panel-head"><h2>Vista previa</h2><p>Así se interpreta ancho y largo.</p></div><div class="size-guide-admin-preview">${sizeGuideDiagramSvg()}</div></div>
  </div>`;
  const rowsRoot=$('#size-guide-rows',root);
  const bindRemove=()=>$$('[data-size-remove]',rowsRoot).forEach(btn=>btn.onclick=()=>btn.closest('[data-size-row]')?.remove());
  bindRemove();
  $('#size-guide-add-row',root).addEventListener('click',()=>{
    const wrap=document.createElement('div');wrap.innerHTML=sizeGuideRowsHtml([{size:'',length:'',width:''}]);rowsRoot.appendChild(wrap.firstElementChild);bindRemove();
  });
  $('#size-guide-form',root).addEventListener('submit',async e=>{
    e.preventDefault();const msg=$('#size-guide-message',root);msg.textContent='Guardando…';
    const rows=$$('[data-size-row]',rowsRoot).map(row=>({size:$('[data-size-name]',row).value,length:Number($('[data-size-length]',row).value),width:Number($('[data-size-width]',row).value)})).filter(row=>row.size&&row.length>0&&row.width>0);
    try{
      const data=await api('/api/admin/size-guide',{method:'PATCH',body:JSON.stringify({enabled:$('#size-guide-enabled',root).checked,title:$('#size-guide-title',root).value,subtitle:$('#size-guide-subtitle',root).value,units:$('#size-guide-units',root).value,tolerance:$('#size-guide-tolerance',root).value,note:$('#size-guide-note',root).value,rows})});
      adminState.sizeGuide=data.guide;msg.textContent='Guía guardada.';toast('Guía de tallas actualizada');
    }catch(err){msg.textContent=err.message}
  });
}
function sizeGuideDiagramSvg(){
  return `<img src="assets/size-guide/playera.svg" alt="Diagrama para medir ancho y largo de una playera">`;
}

async function loadEmailTemplatesAdmin(){
  const root=$('#view-emails');root.innerHTML='<div class="empty-state">Cargando correos…</div>';
  try{
    const [data,history,orders]=await Promise.all([
      api('/api/admin/email-templates'),
      api('/api/admin/email/history').catch(()=>({messages:[]})),
      api('/api/admin/orders').catch(()=>({orders:adminState.orders||[]}))
    ]);
    adminState.emailTemplates=data.config;adminState.emailTemplateDefaults=data.defaults;adminState.emailHistory=history.messages||[];
    if(Array.isArray(orders.orders)&&orders.orders.length)adminState.orders=orders.orders;
    if(!adminState.emailTemplates?.templates?.[adminState.emailTemplateKey])adminState.emailTemplateKey=Object.keys(adminState.emailTemplates?.templates||{})[0]||'order_paid';
    renderEmailAdmin();
  }catch(e){root.innerHTML=`<div class="empty-state">${esc(e.message)}</div>`}
}
function emailAdminTabs(){return `<div class="email-tabs"><button type="button" data-email-tab="templates" class="${adminState.emailMode==='templates'?'active':''}">Plantillas y diseño</button><button type="button" data-email-tab="compose" class="${adminState.emailMode==='compose'?'active':''}">Redactar correo</button></div>`}
function renderEmailAdmin(){const root=$('#view-emails');if(!root)return;root.innerHTML=`${emailAdminTabs()}<div id="email-workspace"></div>`;$$('[data-email-tab]',root).forEach(btn=>btn.addEventListener('click',()=>{adminState.emailMode=btn.dataset.emailTab;renderEmailAdmin()}));if(adminState.emailMode==='compose')renderEmailComposer();else renderEmailTemplatesAdmin()}
function updateEmailTemplateStateFromForm(){
  const cfg=adminState.emailTemplates;if(!cfg)return;const s=cfg.settings;
  s.brandName=$('#email-brand-name')?.value||s.brandName;
  s.showBrandName=!!$('#email-show-brand-name')?.checked;
  s.showLogo=!!$('#email-show-logo')?.checked;
  s.logoWidth=Number($('#email-logo-width')?.value||s.logoWidth||180);
  s.logoAlign=$('#email-logo-align')?.value||s.logoAlign;
  s.headerAlign=$('#email-header-align')?.value||s.headerAlign;
  s.emailWidth=Number($('#email-width')?.value||s.emailWidth||640);
  s.fontFamily=$('#email-font-family')?.value||s.fontFamily;
  s.headerBackgroundColor=$('#email-header-color')?.value||s.headerBackgroundColor;
  s.titleColor=$('#email-title-color')?.value||s.titleColor;
  s.primaryColor=$('#email-primary-color')?.value||s.primaryColor;
  s.buttonTextColor=$('#email-button-text-color')?.value||s.buttonTextColor;
  s.backgroundColor=$('#email-background-color')?.value||s.backgroundColor;
  s.contentBackgroundColor=$('#email-content-color')?.value||s.contentBackgroundColor;
  s.textColor=$('#email-text-color')?.value||s.textColor;
  s.showFooter=!!$('#email-show-footer')?.checked;
  s.footerText=$('#email-footer-text')?.value||s.footerText;
  s.storeUrl=$('#email-store-url')?.value||s.storeUrl;
  const t=cfg.templates[adminState.emailTemplateKey];if(!t)return;
  t.subject=$('#email-template-subject')?.value??t.subject;t.title=$('#email-template-title')?.value??t.title;t.lead=$('#email-template-lead')?.value??t.lead;t.buttonText=$('#email-template-button-text')?.value??t.buttonText;t.buttonUrl=$('#email-template-button-url')?.value??t.buttonUrl;
}
function previewLogoHtml(settings){if(!settings.showLogo||!settings.logoPath)return '';const align=settings.logoAlign||'center',width=Math.max(60,Math.min(360,Number(settings.logoWidth)||180)),src='/'+String(settings.logoPath).replace(/^\/+/, '');return `<div style="text-align:${esc(align)};margin-bottom:${settings.showBrandName?'12px':'4px'}"><img src="${esc(src)}" alt="${esc(settings.brandName||'Niños Rancios')}" style="width:${width}px;max-width:100%;height:auto"></div>`}
function emailPreviewShell({title='',lead='',body='',buttonText='',buttonUrl='',settings=emailSettings()}){const s=settings||{},width=Math.max(480,Math.min(760,Number(s.emailWidth)||640)),align=s.headerAlign||'left',brand=s.showBrandName?`<div style="font-size:11px;letter-spacing:4px">${esc(s.brandName||'NIÑOS RANCIOS')}</div>`:'',headTitle=title?`<h1 style="font-size:25px;margin:${(brand||s.showLogo)?'12px':'0'} 0 0;color:${esc(s.titleColor||'#ffffff')}">${esc(title)}</h1>`:'',footer=s.showFooter?`<div style="text-align:center;color:#777;font-size:12px;padding:18px">${esc(emailTemplateApply(s.footerText||''))}</div>`:'';return `<!doctype html><html><body style="margin:0;background:${esc(s.backgroundColor||'#f3f3f3')};font-family:${esc(s.fontFamily||'Arial,Helvetica,sans-serif')};color:${esc(s.textColor||'#171717')}"><div style="max-width:${width}px;margin:0 auto;padding:24px 14px"><div style="background:${esc(s.headerBackgroundColor||'#111111')};padding:22px 24px;text-align:${esc(align)}">${previewLogoHtml(s)}${brand}${headTitle}</div><div style="background:${esc(s.contentBackgroundColor||'#ffffff')};padding:24px;color:${esc(s.textColor||'#171717')}">${lead?`<p style="margin-top:0;line-height:1.55">${esc(lead)}</p>`:''}${body}${buttonText&&buttonUrl?`<a href="${esc(buttonUrl)}" style="display:inline-block;background:${esc(s.primaryColor||'#111111')};color:${esc(s.buttonTextColor||'#ffffff')};text-decoration:none;padding:11px 16px;font-weight:700">${esc(buttonText)}</a>`:''}</div>${footer}</div></body></html>`}
function emailPreviewHtml(){const cfg=adminState.emailTemplates||{},settings=cfg.settings||{},t=cfg.templates?.[adminState.emailTemplateKey]||{};const title=emailTemplateApply(t.title),lead=emailTemplateApply(t.lead),buttonText=emailTemplateApply(t.buttonText),buttonUrl=emailTemplateApply(t.buttonUrl);const sample=adminState.emailTemplateKey==='newsletter_welcome'?`<div style="border:1px solid #e5e5e5;padding:14px;margin:18px 0"><strong>Gracias por formar parte de nuestra comunidad.</strong><div style="color:#666;margin-top:8px">Recibirás novedades, lanzamientos y promociones de Niños Rancios.</div></div>`:`<div style="border:1px solid #e5e5e5;padding:14px;margin:18px 0"><strong>Pedido NR-48273195</strong><div style="color:#666;margin-top:6px">Make Us Worthy · Negro · CH</div><div style="margin-top:8px">Total: <strong>MX$329.00</strong></div></div>`;return emailPreviewShell({title,lead,body:sample,buttonText,buttonUrl,settings})}
function refreshEmailPreview(){const frame=$('#email-template-preview');if(frame)frame.srcdoc=emailPreviewHtml();const subj=$('#email-preview-subject');if(subj)subj.textContent=emailTemplateApply(adminState.emailTemplates?.templates?.[adminState.emailTemplateKey]?.subject||'')}
async function uploadEmailLogo(){const input=$('#email-logo-file'),file=input?.files?.[0],msg=$('#email-logo-message');if(!file){if(msg)msg.textContent='Selecciona una imagen.';return}const body=new FormData();body.append('logo',file);if(msg)msg.textContent='Subiendo logo…';try{const res=await fetch('/api/admin/email-logo',{method:'POST',credentials:'same-origin',body});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'No fue posible subir el logo.');adminState.emailTemplates.settings.logoPath=data.path;adminState.emailTemplates.settings.showLogo=true;renderEmailAdmin();toast('Logo de correo cargado')}catch(e){if(msg)msg.textContent=e.message}}
function renderEmailTemplatesAdmin(){
  const root=$('#email-workspace'),cfg=adminState.emailTemplates;if(!root||!cfg)return;const keys=Object.keys(cfg.templates||{}),t=cfg.templates[adminState.emailTemplateKey]||cfg.templates[keys[0]],s=cfg.settings;
  root.innerHTML=`<div class="admin-note"><strong>Editor de correos.</strong> Personaliza la identidad de todos los emails y decide si mostrar logo, nombre de marca y pie de página.</div><div class="email-admin-grid">
    <section class="panel email-editor-panel"><div class="panel-head"><h2>Identidad y diseño</h2><p>Configuración compartida por todas las plantillas.</p></div><div class="email-editor-body">
      <div class="email-toggle-grid"><label class="email-check"><input id="email-show-logo" type="checkbox" ${s.showLogo?'checked':''}> Mostrar logo</label><label class="email-check"><input id="email-show-brand-name" type="checkbox" ${s.showBrandName?'checked':''}> Mostrar nombre de marca</label><label class="email-check"><input id="email-show-footer" type="checkbox" ${s.showFooter?'checked':''}> Mostrar pie de página</label></div>
      <div class="email-logo-manager"><div class="email-logo-preview">${s.logoPath?`<img src="/${esc(s.logoPath)}" alt="Logo del correo">`:'<span>Sin logo cargado</span>'}</div><div><label>Subir logo <input id="email-logo-file" type="file" accept="image/jpeg,image/png,image/webp"></label><div class="email-admin-actions"><button id="email-logo-upload" type="button" class="secondary-home-action">Cargar logo</button>${s.logoPath?'<button id="email-logo-remove" type="button" class="secondary-home-action">Quitar logo</button>':''}</div><small>JPG, PNG o WEBP · máximo 4 MB. Para mejor resultado usa PNG con fondo transparente.</small><p id="email-logo-message" class="message"></p></div></div>
      <div class="editor-two"><label>Nombre de marca<input id="email-brand-name" type="text" maxlength="80" value="${esc(s.brandName)}"></label><label>URL de la tienda<input id="email-store-url" type="text" maxlength="500" value="${esc(s.storeUrl)}"></label></div>
      <div class="editor-three"><label>Ancho del logo (px)<input id="email-logo-width" type="number" min="60" max="360" value="${Number(s.logoWidth)||180}"></label><label>Alineación del logo<select id="email-logo-align"><option value="left" ${s.logoAlign==='left'?'selected':''}>Izquierda</option><option value="center" ${s.logoAlign==='center'?'selected':''}>Centro</option><option value="right" ${s.logoAlign==='right'?'selected':''}>Derecha</option></select></label><label>Alineación encabezado<select id="email-header-align"><option value="left" ${s.headerAlign==='left'?'selected':''}>Izquierda</option><option value="center" ${s.headerAlign==='center'?'selected':''}>Centro</option><option value="right" ${s.headerAlign==='right'?'selected':''}>Derecha</option></select></label></div>
      <div class="editor-two"><label>Ancho máximo del email (px)<input id="email-width" type="number" min="480" max="760" value="${Number(s.emailWidth)||640}"></label><label>Tipografía<select id="email-font-family"><option value="Arial,Helvetica,sans-serif" ${s.fontFamily==='Arial,Helvetica,sans-serif'?'selected':''}>Arial</option><option value="Helvetica,Arial,sans-serif" ${s.fontFamily==='Helvetica,Arial,sans-serif'?'selected':''}>Helvetica</option><option value="Verdana,Geneva,sans-serif" ${s.fontFamily==='Verdana,Geneva,sans-serif'?'selected':''}>Verdana</option><option value="Trebuchet MS,Arial,sans-serif" ${s.fontFamily==='Trebuchet MS,Arial,sans-serif'?'selected':''}>Trebuchet MS</option><option value="Georgia,Times New Roman,serif" ${s.fontFamily==='Georgia,Times New Roman,serif'?'selected':''}>Georgia</option></select></label></div>
      <div class="email-color-grid"><label>Encabezado<input id="email-header-color" type="color" value="${esc(s.headerBackgroundColor)}"></label><label>Título<input id="email-title-color" type="color" value="${esc(s.titleColor)}"></label><label>Botón<input id="email-primary-color" type="color" value="${esc(s.primaryColor)}"></label><label>Texto botón<input id="email-button-text-color" type="color" value="${esc(s.buttonTextColor)}"></label><label>Fondo exterior<input id="email-background-color" type="color" value="${esc(s.backgroundColor)}"></label><label>Contenido<input id="email-content-color" type="color" value="${esc(s.contentBackgroundColor)}"></label><label>Texto<input id="email-text-color" type="color" value="${esc(s.textColor)}"></label></div>
      <label>Pie de página<input id="email-footer-text" type="text" maxlength="240" value="${esc(s.footerText)}"><small>Puedes usar {{year}}.</small></label>
    </div></section>
    <section class="panel email-editor-panel"><div class="panel-head"><h2>Plantilla automática</h2><p>Edita el contenido sin tocar código.</p></div><div class="email-editor-body">
      <label>Tipo de correo<select id="email-template-select">${keys.map(k=>`<option value="${esc(k)}" ${k===adminState.emailTemplateKey?'selected':''}>${esc(cfg.templates[k].label)}</option>`).join('')}</select></label>
      <label>Asunto<input id="email-template-subject" type="text" maxlength="240" value="${esc(t.subject)}"></label><label>Título<input id="email-template-title" type="text" maxlength="180" value="${esc(t.title)}"></label><label>Mensaje<textarea id="email-template-lead" rows="5" maxlength="1400">${esc(t.lead)}</textarea></label>
      <div class="editor-two"><label>Texto del botón <small>Opcional</small><input id="email-template-button-text" type="text" maxlength="100" value="${esc(t.buttonText||'')}"></label><label>Enlace del botón <small>Opcional</small><input id="email-template-button-url" type="text" maxlength="700" value="${esc(t.buttonUrl||'')}"></label></div>
      <div class="email-placeholder-help"><strong>Variables disponibles</strong><span>{{pedido}}</span><span>{{nombre}}</span><span>{{total}}</span><span>{{metodo_pago}}</span><span>{{estado}}</span><span>{{asunto}}</span><span>{{nuevo_correo}}</span><span>{{correo_anterior}}</span><span>{{action_url}}</span><span>{{account_url}}</span><span>{{contact_url}}</span><span>{{store_url}}</span><span>{{year}}</span></div>
      <div class="email-admin-actions"><button id="email-save" type="button" class="primary-admin-action">Guardar cambios</button><button id="email-reset" type="button" class="secondary-home-action">Restaurar originales</button><p id="email-message" class="message"></p></div>
    </div></section>
    <section class="panel email-preview-panel"><div class="panel-head"><h2>Vista previa</h2><p><strong>Asunto:</strong> <span id="email-preview-subject"></span></p></div><div class="email-preview-wrap"><iframe id="email-template-preview" title="Vista previa del correo" sandbox="allow-same-origin"></iframe></div></section>
  </div>`;
  $('#email-template-select')?.addEventListener('change',e=>{updateEmailTemplateStateFromForm();adminState.emailTemplateKey=e.target.value;renderEmailAdmin()});
  $$('#email-workspace input:not([type=file]),#email-workspace textarea,#email-workspace select').forEach(el=>{const ev=el.type==='checkbox'||el.tagName==='SELECT'?'change':'input';el.addEventListener(ev,()=>{updateEmailTemplateStateFromForm();refreshEmailPreview()})});
  $('#email-logo-upload')?.addEventListener('click',uploadEmailLogo);$('#email-logo-remove')?.addEventListener('click',()=>{adminState.emailTemplates.settings.logoPath='';adminState.emailTemplates.settings.showLogo=false;renderEmailAdmin()});
  $('#email-save')?.addEventListener('click',async()=>{updateEmailTemplateStateFromForm();const btn=$('#email-save'),msg=$('#email-message');btn.disabled=true;msg.textContent='Guardando…';try{const data=await api('/api/admin/email-templates',{method:'PATCH',body:JSON.stringify(adminState.emailTemplates)});adminState.emailTemplates=data.config;msg.textContent='Cambios guardados.';toast('Plantillas de correo actualizadas');refreshEmailPreview()}catch(e){msg.textContent=e.message}finally{btn.disabled=false}});
  $('#email-reset')?.addEventListener('click',async()=>{if(!confirm('¿Restaurar todas las plantillas y el diseño de correo a sus valores originales?'))return;try{const data=await api('/api/admin/email-templates/reset',{method:'POST',body:'{}'});adminState.emailTemplates=data.config;adminState.emailTemplateKey='order_paid';renderEmailAdmin();toast('Plantillas restauradas')}catch(e){alert(e.message)}});refreshEmailPreview();
}
function selectedComposeOrder(){return adminState.orders.find(o=>o.orderNumber===($('#email-compose-order')?.value||adminState.composeOrderNumber))}
function composeVars(){const o=selectedComposeOrder(),c=o?.customer||{},s=emailSettings();return {pedido:o?.orderNumber||'',nombre:[c.nombre,c.apellidos].filter(Boolean).join(' '),total:o?money(o.totals?.total):'',metodo_pago:o?.paymentMethod||'',estado:o?.status||'',correo:c.email||'',store_url:s.storeUrl||'',year:new Date().getFullYear()}}
function composeApply(text){return emailTemplateApply(text,composeVars())}
function composePreviewHtml(){const body=$('#email-compose-body')?.innerHTML||'<p>Escribe tu mensaje…</p>',title=composeApply($('#email-compose-title')?.value||''),s=emailSettings();return emailPreviewShell({title,body:composeApply(body),settings:s})}
function refreshComposePreview(){const f=$('#email-compose-preview');if(f)f.srcdoc=composePreviewHtml()}
function composeOrderOptions(){return `<option value="">Sin vincular a pedido</option>${(adminState.orders||[]).map(o=>`<option value="${esc(o.orderNumber)}" ${o.orderNumber===adminState.composeOrderNumber?'selected':''}>${esc(o.orderNumber)} · ${esc([o.customer?.nombre,o.customer?.apellidos].filter(Boolean).join(' ')||o.customer?.email||'Cliente')}</option>`).join('')}`}
function fillComposeFromOrder(){const o=selectedComposeOrder();adminState.composeOrderNumber=$('#email-compose-order')?.value||'';if(!o){refreshComposePreview();return}const to=$('#email-compose-to'),sub=$('#email-compose-subject'),title=$('#email-compose-title');if(to)to.value=o.customer?.email||'';if(sub&&!sub.value)sub.value=`Información sobre tu pedido ${o.orderNumber}`;if(title&&!title.value)title.value=`Actualización de tu pedido ${o.orderNumber}`;refreshComposePreview()}
function richEmailCommand(command,value=null){const editor=$('#email-compose-body');if(!editor)return;editor.focus();if(command==='createLink'){const url=prompt('Pega el enlace (https://...)');if(!url)return;document.execCommand('createLink',false,url)}else document.execCommand(command,false,value);refreshComposePreview()}
function renderEmailHistory(){const root=$('#email-history-list');if(!root)return;const rows=adminState.emailHistory||[];root.innerHTML=rows.length?rows.map(row=>`<div class="email-history-row"><div><strong>${esc(row.subject)}</strong><span>Para: ${esc(row.to)}</span></div><div><span>${esc(row.fromKind||'')}</span><small>${esc(fmtDate(row.at))}</small></div></div>`).join(''):'<div class="empty-state">Aún no has enviado correos manuales desde el panel.</div>'}
async function sendManualEmail(){const btn=$('#email-compose-send'),msg=$('#email-compose-message'),order=selectedComposeOrder(),vars=composeVars();const payload={fromKind:$('#email-compose-from')?.value||'contact',to:$('#email-compose-to')?.value||'',subject:emailTemplateApply($('#email-compose-subject')?.value||'',vars),title:emailTemplateApply($('#email-compose-title')?.value||'',vars),html:emailTemplateApply($('#email-compose-body')?.innerHTML||'',vars),text:$('#email-compose-body')?.innerText||'',orderNumber:order?.orderNumber||''};btn.disabled=true;msg.textContent='Enviando…';try{await api('/api/admin/email/send',{method:'POST',body:JSON.stringify(payload)});msg.textContent='Correo enviado correctamente.';toast('Correo enviado');const h=await api('/api/admin/email/history');adminState.emailHistory=h.messages||[];renderEmailHistory()}catch(e){msg.textContent=e.message}finally{btn.disabled=false}}
function renderEmailComposer(){const root=$('#email-workspace'),s=emailSettings();if(!root)return;root.innerHTML=`<div class="admin-note"><strong>Centro de correo.</strong> Redacta mensajes manuales con la identidad de Niños Rancios. Los correos automáticos siguen funcionando por separado.</div><div class="email-compose-grid"><section class="panel"><div class="panel-head"><h2>Redactar correo</h2><p>Puedes vincularlo a un pedido para cargar al cliente automáticamente.</p></div><div class="email-editor-body">
    <div class="editor-two"><label>Remitente<select id="email-compose-from"><option value="contact">contacto@niñosrancios.com</option><option value="orders">pedidos@niñosrancios.com</option><option value="accounts">cuentas@niñosrancios.com</option></select></label><label>Pedido <small>Opcional</small><select id="email-compose-order">${composeOrderOptions()}</select></label></div>
    <label>Para<input id="email-compose-to" type="email" maxlength="254" placeholder="cliente@correo.com"></label><label>Asunto<input id="email-compose-subject" type="text" maxlength="240" placeholder="Asunto del mensaje"></label><label>Título del correo <small>Opcional</small><input id="email-compose-title" type="text" maxlength="180" placeholder="Ej. Tenemos una actualización"></label>
    <div class="rich-field"><div class="rich-field-label">Mensaje</div><div class="rich-toolbar email-rich-toolbar"><button type="button" data-email-rich="bold"><strong>B</strong></button><button type="button" data-email-rich="italic"><em>I</em></button><button type="button" data-email-rich="underline"><u>U</u></button><button type="button" data-email-rich="insertUnorderedList">• Lista</button><button type="button" data-email-rich="insertOrderedList">1. Lista</button><button type="button" data-email-rich="createLink">Enlace</button><button type="button" data-email-rich="removeFormat">Quitar formato</button></div><div id="email-compose-body" class="rich-editor email-compose-editor" contenteditable="true" role="textbox" aria-multiline="true"><p>Hola {{nombre}},</p><p>Escribe aquí tu mensaje.</p></div></div>
    <div class="email-placeholder-help"><strong>Variables si vinculas un pedido</strong><span>{{pedido}}</span><span>{{nombre}}</span><span>{{total}}</span><span>{{metodo_pago}}</span><span>{{estado}}</span><span>{{correo}}</span><span>{{store_url}}</span></div><div class="email-admin-actions"><button id="email-compose-send" type="button" class="primary-admin-action">Enviar correo</button><p id="email-compose-message" class="message"></p></div>
  </div></section><section class="panel email-compose-preview-panel"><div class="panel-head"><h2>Vista previa</h2><p>Usa el diseño general configurado en Plantillas y diseño.</p></div><div class="email-preview-wrap"><iframe id="email-compose-preview" title="Vista previa" sandbox="allow-same-origin"></iframe></div></section></div><section class="panel email-history-panel"><div class="panel-head"><h2>Historial de correos manuales</h2><p>Últimos envíos realizados desde este panel.</p></div><div id="email-history-list" class="email-history-list"></div></section>`;
  $('#email-compose-order')?.addEventListener('change',fillComposeFromOrder);$$('[data-email-rich]',root).forEach(btn=>btn.addEventListener('mousedown',e=>{e.preventDefault();richEmailCommand(btn.dataset.emailRich)}));['#email-compose-subject','#email-compose-title','#email-compose-to'].forEach(sel=>$(sel)?.addEventListener('input',refreshComposePreview));$('#email-compose-body')?.addEventListener('input',refreshComposePreview);$('#email-compose-body')?.addEventListener('paste',e=>{e.preventDefault();const text=(e.clipboardData||window.clipboardData).getData('text/plain');document.execCommand('insertText',false,text)});$('#email-compose-send')?.addEventListener('click',sendManualEmail);fillComposeFromOrder();renderEmailHistory();refreshComposePreview();
}

$$('[data-rich-command]').forEach(btn=>btn.addEventListener('mousedown',e=>{
  e.preventDefault();
  const editor=$(btn.dataset.richTarget||'#product-edit-description');
  if(!editor)return;
  editor.focus();
  document.execCommand(btn.dataset.richCommand,false,null);
}));
$$('.rich-editor').forEach(editor=>editor.addEventListener('paste',e=>{
  e.preventDefault();
  const text=(e.clipboardData||window.clipboardData).getData('text/plain');
  document.execCommand('insertText',false,text);
}));

boot();


// V127.28 — modo mantenimiento global + editor visual avanzado
async function loadMaintenanceAdmin(){
  const root=$('#view-maintenance');
  root.innerHTML='<div class="empty-state">Cargando modo mantenimiento…</div>';
  try{
    const data=await api('/api/admin/maintenance');
    adminState.maintenance=data.settings;
    renderMaintenanceAdmin();
  }catch(err){root.innerHTML=`<div class="empty-state">${esc(err.message)}</div>`}
}
function maintenanceFontOptions(selected){return MAINTENANCE_FONTS.map(f=>`<option value="${esc(f)}" ${f===selected?'selected':''}>${esc(f)}</option>`).join('')}
function maintenanceTextEditor(key,label,multiline=false){
  const s=adminState.maintenance||{},b=s.texts?.[key]||{};
  const textControl=multiline
    ? `<textarea data-maint-text="${key}" data-field="text" rows="4" maxlength="1200">${esc(b.text||'')}</textarea>`
    : `<input data-maint-text="${key}" data-field="text" type="text" maxlength="1200" value="${esc(b.text||'')}">`;
  return `<details class="maintenance-editor-section" ${key==='title'||key==='message'?'open':''}>
    <summary>${esc(label)}</summary>
    <div class="maintenance-section-body">
      <label class="maintenance-check"><input data-maint-text="${key}" data-field="visible" type="checkbox" ${b.visible!==false?'checked':''}> Mostrar este texto</label>
      <label>Contenido${textControl}</label>
      <div class="maintenance-control-grid three">
        <label>Posición X (%)<input data-maint-text="${key}" data-field="x" type="number" min="0" max="100" step="1" value="${Number(b.x??50)}"></label>
        <label>Posición Y (%)<input data-maint-text="${key}" data-field="y" type="number" min="0" max="100" step="1" value="${Number(b.y??50)}"></label>
        <label>Ancho máximo (px)<input data-maint-text="${key}" data-field="maxWidth" type="number" min="180" max="1400" step="10" value="${Number(b.maxWidth??700)}"></label>
      </div>
      <div class="maintenance-control-grid three">
        <label>Fuente<select data-maint-text="${key}" data-field="fontFamily">${maintenanceFontOptions(b.fontFamily||'Helvetica Neue')}</select></label>
        <label>Tamaño escritorio<input data-maint-text="${key}" data-field="fontSize" type="number" min="8" max="140" value="${Number(b.fontSize??16)}"></label>
        <label>Tamaño móvil<input data-maint-text="${key}" data-field="mobileFontSize" type="number" min="8" max="80" value="${Number(b.mobileFontSize??14)}"></label>
      </div>
      <div class="maintenance-control-grid four">
        <label>Peso<select data-maint-text="${key}" data-field="fontWeight">${[100,200,300,400,500,600,700,800,900].map(w=>`<option value="${w}" ${Number(b.fontWeight)===w?'selected':''}>${w}</option>`).join('')}</select></label>
        <label>Alineación<select data-maint-text="${key}" data-field="align"><option value="left" ${b.align==='left'?'selected':''}>Izquierda</option><option value="center" ${b.align!=='left'&&b.align!=='right'?'selected':''}>Centro</option><option value="right" ${b.align==='right'?'selected':''}>Derecha</option></select></label>
        <label>Interletrado<input data-maint-text="${key}" data-field="letterSpacing" type="number" min="-10" max="24" step=".5" value="${Number(b.letterSpacing??0)}"></label>
        <label>Interlineado<input data-maint-text="${key}" data-field="lineHeight" type="number" min=".8" max="3" step=".05" value="${Number(b.lineHeight??1.4)}"></label>
      </div>
      <div class="maintenance-control-grid four">
        <label>Color<input data-maint-text="${key}" data-field="color" type="color" value="${esc(b.color||'#242424')}"></label>
        <label>Fondo del texto<input data-maint-text="${key}" data-field="backgroundColor" type="color" value="${b.backgroundColor==='transparent'?'#ffffff':esc(b.backgroundColor||'#ffffff')}"><small>Usa “Sin fondo” para transparencia.</small></label>
        <label>Padding X<input data-maint-text="${key}" data-field="paddingX" type="number" min="0" max="80" value="${Number(b.paddingX??0)}"></label>
        <label>Padding Y<input data-maint-text="${key}" data-field="paddingY" type="number" min="0" max="50" value="${Number(b.paddingY??0)}"></label>
      </div>
      <div class="maintenance-inline-options">
        <label class="maintenance-check"><input data-maint-text="${key}" data-field="italic" type="checkbox" ${b.italic?'checked':''}> Cursiva</label>
        <label class="maintenance-check"><input data-maint-text="${key}" data-field="uppercase" type="checkbox" ${b.uppercase?'checked':''}> Mayúsculas</label>
        <label class="maintenance-check"><input data-maint-text="${key}" data-field="transparentBackground" type="checkbox" ${b.backgroundColor==='transparent'?'checked':''}> Sin fondo</label>
      </div>
    </div>
  </details>`;
}
function renderMaintenanceAdmin(){
  const root=$('#view-maintenance'),s=adminState.maintenance||{},bg=s.background||{},logo=s.logo||{},icon=s.icon||{};
  const enabled=!!s.enabled;
  root.innerHTML=`
    <div class="admin-note"><strong>Editor de la página de mantenimiento.</strong> Puedes diseñarla sin activar el mantenimiento. Guarda los cambios y usa la vista previa; cuando esté lista, actívala para ocultar la tienda al público.</div>
    <div class="panel maintenance-admin-panel advanced">
      <div class="panel-head">
        <div><h2>Página de mantenimiento</h2><p>Diseño, contenido y medios</p></div>
        <span class="maintenance-state ${enabled?'active':'inactive'}">${enabled?'MANTENIMIENTO ACTIVO':'SITIO PÚBLICO'}</span>
      </div>
      <div class="maintenance-editor-layout">
        <div class="maintenance-editor-controls">
          <details class="maintenance-editor-section" open>
            <summary>Estado y fondo</summary>
            <div class="maintenance-section-body">
              <div class="maintenance-status-card compact"><span>Estado actual</span><strong>${enabled?'Los clientes ven mantenimiento':'La tienda está visible'}</strong><p>${enabled?'Tu sesión administrativa puede seguir revisando la tienda completa.':'Puedes diseñar esta pantalla y activarla únicamente cuando la necesites.'}</p></div>
              <div class="maintenance-control-grid two">
                <label>Tipo de fondo<select id="maintenance-bg-mode"><option value="color" ${bg.mode==='color'?'selected':''}>Color sólido</option><option value="image" ${bg.mode==='image'?'selected':''}>Imagen</option><option value="video" ${bg.mode==='video'?'selected':''}>Video</option></select></label>
                <label>Color base<input id="maintenance-bg-color" type="color" value="${esc(bg.color||'#f7f7f5')}"></label>
              </div>
              <div class="maintenance-control-grid two">
                <label>Posición horizontal (%)<input id="maintenance-bg-x" type="number" min="0" max="100" value="${Number(bg.positionX??50)}"></label>
                <label>Posición vertical (%)<input id="maintenance-bg-y" type="number" min="0" max="100" value="${Number(bg.positionY??50)}"></label>
              </div>
              <div class="maintenance-control-grid two">
                <label>Color de capa<input id="maintenance-overlay-color" type="color" value="${esc(bg.overlayColor||'#000000')}"></label>
                <label>Opacidad de capa (0–0.9)<input id="maintenance-overlay-opacity" type="number" min="0" max="0.9" step="0.05" value="${Number(bg.overlayOpacity??0)}"></label>
              </div>
              <div class="maintenance-upload-row"><label>Imagen de fondo<input id="maintenance-bg-image-file" type="file" accept="image/jpeg,image/png,image/webp"><small>JPG, PNG o WEBP · máximo 12 MB.</small></label><button id="maintenance-upload-bg-image" type="button">Subir imagen</button></div>
              <div class="maintenance-current-file">Actual: ${bg.image?esc(bg.image):'Sin imagen cargada'} ${bg.image?'<button type="button" class="maintenance-link-button" id="maintenance-clear-bg-image">Quitar</button>':''}</div>
              <div class="maintenance-upload-row"><label>Video de fondo<input id="maintenance-bg-video-file" type="file" accept="video/mp4,video/webm"><small>MP4 o WEBM · máximo 120 MB · se reproduce sin sonido y en bucle.</small></label><button id="maintenance-upload-bg-video" type="button">Subir video</button></div>
              <div class="maintenance-current-file">Actual: ${bg.video?esc(bg.video):'Sin video cargado'} ${bg.video?'<button type="button" class="maintenance-link-button" id="maintenance-clear-bg-video">Quitar</button>':''}</div>
            </div>
          </details>

          <details class="maintenance-editor-section">
            <summary>Logotipo e icono</summary>
            <div class="maintenance-section-body">
              <h4>Logotipo</h4>
              <label class="maintenance-check"><input id="maintenance-logo-visible" type="checkbox" ${logo.visible!==false?'checked':''}> Mostrar logotipo</label>
              <div class="maintenance-control-grid four">
                <label>Ancho escritorio<input id="maintenance-logo-width" type="number" min="40" max="900" value="${Number(logo.width??310)}"></label>
                <label>Ancho móvil<input id="maintenance-logo-mobile-width" type="number" min="40" max="520" value="${Number(logo.mobileWidth??230)}"></label>
                <label>Posición X (%)<input id="maintenance-logo-x" type="number" min="0" max="100" value="${Number(logo.x??50)}"></label>
                <label>Posición Y (%)<input id="maintenance-logo-y" type="number" min="0" max="100" value="${Number(logo.y??20)}"></label>
              </div>
              <div class="maintenance-upload-row"><label>Subir otro logotipo<input id="maintenance-logo-file" type="file" accept="image/svg+xml,image/jpeg,image/png,image/webp"><small>SVG, PNG, JPG o WEBP · máximo 5 MB.</small></label><button id="maintenance-upload-logo" type="button">Subir logo</button></div>
              <div class="maintenance-current-file">Actual: ${esc(logo.src||'assets/logo-ninos-rancios.svg')} <button type="button" class="maintenance-link-button" id="maintenance-reset-logo">Usar logo oficial</button></div>
              <hr>
              <h4>Icono decorativo opcional</h4>
              <label class="maintenance-check"><input id="maintenance-icon-visible" type="checkbox" ${icon.visible?'checked':''}> Mostrar icono</label>
              <div class="maintenance-control-grid four">
                <label>Ancho escritorio<input id="maintenance-icon-width" type="number" min="20" max="500" value="${Number(icon.width??70)}"></label>
                <label>Ancho móvil<input id="maintenance-icon-mobile-width" type="number" min="20" max="300" value="${Number(icon.mobileWidth??58)}"></label>
                <label>Posición X (%)<input id="maintenance-icon-x" type="number" min="0" max="100" value="${Number(icon.x??50)}"></label>
                <label>Posición Y (%)<input id="maintenance-icon-y" type="number" min="0" max="100" value="${Number(icon.y??34)}"></label>
              </div>
              <div class="maintenance-upload-row"><label>Subir icono<input id="maintenance-icon-file" type="file" accept="image/svg+xml,image/jpeg,image/png,image/webp"><small>SVG, PNG, JPG o WEBP · máximo 5 MB.</small></label><button id="maintenance-upload-icon" type="button">Subir icono</button></div>
              <div class="maintenance-current-file">Actual: ${icon.src?esc(icon.src):'Sin icono'} ${icon.src?'<button type="button" class="maintenance-link-button" id="maintenance-clear-icon">Quitar</button>':''}</div>
            </div>
          </details>

          ${maintenanceTextEditor('eyebrow','Texto superior / etiqueta')}
          ${maintenanceTextEditor('title','Título principal')}
          ${maintenanceTextEditor('message','Mensaje',true)}
          ${maintenanceTextEditor('footer','Texto inferior')}
        </div>
        <aside class="maintenance-preview-column">
          <div class="maintenance-preview-head"><strong>Vista previa guardada</strong><a href="maintenance.html" target="_blank" rel="noopener">Abrir grande ↗</a></div>
          <iframe id="maintenance-preview-frame" class="maintenance-preview-frame" src="maintenance.html?preview=1" title="Vista previa de mantenimiento"></iframe>
          <p>La vista previa se actualiza después de guardar.</p>
        </aside>
      </div>
      <div class="maintenance-actions">
        <button type="button" id="maintenance-save" class="secondary-home-action">Guardar diseño</button>
        ${enabled?'<button type="button" id="maintenance-disable" class="primary-admin-action">Desactivar mantenimiento</button>':'<button type="button" id="maintenance-enable" class="primary-admin-action">Activar mantenimiento</button>'}
      </div>
      <p id="maintenance-admin-message" class="message maintenance-admin-message"></p>
    </div>`;

  $('#maintenance-save')?.addEventListener('click',()=>saveMaintenanceDesign());
  $('#maintenance-enable')?.addEventListener('click',async()=>{
    if(!confirm('¿Activar el modo mantenimiento? Los visitantes dejarán de ver la tienda y verán esta página.'))return;
    syncMaintenanceStateFromControls();adminState.maintenance.enabled=true;
    await updateMaintenance(adminState.maintenance,'Modo mantenimiento activado.');
  });
  $('#maintenance-disable')?.addEventListener('click',async()=>{
    if(!confirm('¿Desactivar el modo mantenimiento? La tienda volverá a ser visible públicamente.'))return;
    syncMaintenanceStateFromControls();adminState.maintenance.enabled=false;
    await updateMaintenance(adminState.maintenance,'Modo mantenimiento desactivado.');
  });
  $('#maintenance-upload-bg-image')?.addEventListener('click',()=>uploadMaintenanceMedia('background-image'));
  $('#maintenance-upload-bg-video')?.addEventListener('click',()=>uploadMaintenanceMedia('background-video'));
  $('#maintenance-upload-logo')?.addEventListener('click',()=>uploadMaintenanceMedia('logo'));
  $('#maintenance-upload-icon')?.addEventListener('click',()=>uploadMaintenanceMedia('icon'));
  $('#maintenance-clear-bg-image')?.addEventListener('click',()=>{syncMaintenanceStateFromControls();adminState.maintenance.background.image='';renderMaintenanceAdmin()});
  $('#maintenance-clear-bg-video')?.addEventListener('click',()=>{syncMaintenanceStateFromControls();adminState.maintenance.background.video='';if(adminState.maintenance.background.mode==='video')adminState.maintenance.background.mode='color';renderMaintenanceAdmin()});
  $('#maintenance-reset-logo')?.addEventListener('click',()=>{syncMaintenanceStateFromControls();adminState.maintenance.logo.src='assets/logo-ninos-rancios.svg';renderMaintenanceAdmin()});
  $('#maintenance-clear-icon')?.addEventListener('click',()=>{syncMaintenanceStateFromControls();adminState.maintenance.icon.src='';adminState.maintenance.icon.visible=false;renderMaintenanceAdmin()});
}
function maintenanceNum(selector,fallback){const n=Number($(selector)?.value);return Number.isFinite(n)?n:fallback}
function syncMaintenanceStateFromControls(){
  const s=adminState.maintenance;if(!s||!$('#maintenance-bg-mode'))return s;
  s.background={...(s.background||{}),mode:$('#maintenance-bg-mode').value,color:$('#maintenance-bg-color').value,positionX:maintenanceNum('#maintenance-bg-x',50),positionY:maintenanceNum('#maintenance-bg-y',50),overlayColor:$('#maintenance-overlay-color').value,overlayOpacity:maintenanceNum('#maintenance-overlay-opacity',0)};
  s.logo={...(s.logo||{}),visible:!!$('#maintenance-logo-visible')?.checked,width:maintenanceNum('#maintenance-logo-width',310),mobileWidth:maintenanceNum('#maintenance-logo-mobile-width',230),x:maintenanceNum('#maintenance-logo-x',50),y:maintenanceNum('#maintenance-logo-y',20)};
  s.icon={...(s.icon||{}),visible:!!$('#maintenance-icon-visible')?.checked,width:maintenanceNum('#maintenance-icon-width',70),mobileWidth:maintenanceNum('#maintenance-icon-mobile-width',58),x:maintenanceNum('#maintenance-icon-x',50),y:maintenanceNum('#maintenance-icon-y',34)};
  s.texts=s.texts||{};
  for(const key of ['eyebrow','title','message','footer']){
    const get=field=>$(`[data-maint-text="${key}"][data-field="${field}"]`);
    const transparent=!!get('transparentBackground')?.checked;
    s.texts[key]={...(s.texts[key]||{}),visible:!!get('visible')?.checked,text:get('text')?.value||'',x:Number(get('x')?.value||50),y:Number(get('y')?.value||50),maxWidth:Number(get('maxWidth')?.value||700),fontFamily:get('fontFamily')?.value||'Helvetica Neue',fontSize:Number(get('fontSize')?.value||16),mobileFontSize:Number(get('mobileFontSize')?.value||14),fontWeight:Number(get('fontWeight')?.value||400),italic:!!get('italic')?.checked,color:get('color')?.value||'#242424',backgroundColor:transparent?'transparent':(get('backgroundColor')?.value||'#ffffff'),paddingX:Number(get('paddingX')?.value||0),paddingY:Number(get('paddingY')?.value||0),letterSpacing:Number(get('letterSpacing')?.value||0),lineHeight:Number(get('lineHeight')?.value||1.4),align:get('align')?.value||'center',uppercase:!!get('uppercase')?.checked};
  }
  return s;
}
function setMaintenanceMessage(message,ok=false){
  const el=$('#maintenance-admin-message');if(!el)return;
  el.textContent=message||'';el.classList.toggle('ok',!!ok);
}
async function saveMaintenanceDesign(){syncMaintenanceStateFromControls();await updateMaintenance(adminState.maintenance,'Diseño de mantenimiento actualizado.')}
async function updateMaintenance(payload,successMessage){
  setMaintenanceMessage('Guardando…');
  const buttons=$$('#view-maintenance button');buttons.forEach(b=>b.disabled=true);
  try{
    const data=await api('/api/admin/maintenance',{method:'PATCH',body:JSON.stringify(payload)});
    adminState.maintenance=data.settings;
    renderMaintenanceAdmin();
    setMaintenanceMessage(successMessage,true);
    const frame=$('#maintenance-preview-frame');if(frame)frame.src=`maintenance.html?preview=${Date.now()}`;
    toast(successMessage);
  }catch(err){setMaintenanceMessage(err.message||'No fue posible actualizar el modo mantenimiento.');buttons.forEach(b=>b.disabled=false)}
}
async function uploadMaintenanceMedia(type){
  syncMaintenanceStateFromControls();
  const map={
    'background-image':{input:'#maintenance-bg-image-file',endpoint:'/api/admin/maintenance/background-image',field:'image'},
    'background-video':{input:'#maintenance-bg-video-file',endpoint:'/api/admin/maintenance/background-video',field:'video'},
    logo:{input:'#maintenance-logo-file',endpoint:'/api/admin/maintenance/asset/logo',field:'asset'},
    icon:{input:'#maintenance-icon-file',endpoint:'/api/admin/maintenance/asset/icon',field:'asset'}
  };
  const cfg=map[type],file=$(cfg?.input)?.files?.[0];if(!cfg||!file){setMaintenanceMessage('Selecciona un archivo primero.');return}
  const body=new FormData();body.append(cfg.field,file);setMaintenanceMessage('Subiendo archivo…');
  try{
    const res=await fetch(cfg.endpoint,{method:'POST',credentials:'same-origin',body});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'No fue posible subir el archivo.');
    if(type==='background-image'){adminState.maintenance.background.image=data.path;adminState.maintenance.background.mode='image'}
    if(type==='background-video'){adminState.maintenance.background.video=data.path;adminState.maintenance.background.mode='video'}
    if(type==='logo'){adminState.maintenance.logo.src=data.path;adminState.maintenance.logo.visible=true}
    if(type==='icon'){adminState.maintenance.icon.src=data.path;adminState.maintenance.icon.visible=true}
    renderMaintenanceAdmin();setMaintenanceMessage('Archivo cargado. Guarda el diseño para publicarlo.',true);
  }catch(err){setMaintenanceMessage(err.message||'No fue posible subir el archivo.')}
}

// V127.9 — acceso temporal de la página Colaboraciones
async function loadCollaborationsAdmin(){
  const root=$('#view-collaborations');
  root.innerHTML='<div class="empty-state">Cargando acceso de Colaboraciones…</div>';
  try{
    const data=await api('/api/admin/collaborations');
    adminState.collaborations=data.settings;
    renderCollaborationsAdmin();
  }catch(err){root.innerHTML=`<div class="empty-state">${esc(err.message)}</div>`}
}
function renderCollaborationsAdmin(){
  const root=$('#view-collaborations'),s=adminState.collaborations||{};
  const locked=!!s.enabled;
  root.innerHTML=`
    <div class="admin-note">Esta protección es temporal mientras preparas la página. <strong>Desbloquear</strong> hará que Colaboraciones sea visible públicamente de inmediato.</div>
    <div class="panel collaborations-access-panel">
      <div class="panel-head">
        <div><h2>Acceso a Colaboraciones</h2><p>partners.html</p></div>
        <span class="collab-state ${locked?'locked':'public'}">${locked?'PROTEGIDA':'PÚBLICA'}</span>
      </div>
      <div class="collab-access-body">
        <div class="collab-status-card">
          <span>Estado actual</span>
          <strong>${locked?'Se solicita contraseña':'La página está desbloqueada'}</strong>
          <p>${locked?'Los visitantes necesitan la contraseña temporal para entrar.':'Cualquier visitante puede abrir la página de Colaboraciones.'}</p>
        </div>
        <div class="collab-access-actions">
          ${locked?`
            <button type="button" id="collab-unlock-page" class="primary-admin-action">Desbloquear página</button>
            <a class="secondary-home-action collab-open-link" href="partners.html" target="_blank" rel="noopener">Abrir página ↗</a>
          `:`
            <label>Nueva contraseña temporal
              <input id="collab-new-password" type="password" minlength="6" autocomplete="new-password" placeholder="Mínimo 6 caracteres">
              <small>${s.passwordConfigured?'Puedes dejarla vacía para reutilizar la contraseña anterior.':'Necesitas crear una contraseña para volver a protegerla.'}</small>
            </label>
            <button type="button" id="collab-lock-page" class="primary-admin-action">Proteger página</button>
            <a class="secondary-home-action collab-open-link" href="partners.html" target="_blank" rel="noopener">Abrir página ↗</a>
          `}
        </div>
      </div>
      ${locked?`
      <div class="collab-password-row">
        <label>Cambiar contraseña temporal
          <input id="collab-change-password" type="password" minlength="6" autocomplete="new-password" placeholder="Nueva contraseña">
        </label>
        <button type="button" id="collab-save-password" class="secondary-home-action">Cambiar contraseña</button>
      </div>`:''}
      <p id="collab-admin-message" class="message collab-admin-message"></p>
    </div>`;

  $('#collab-unlock-page')?.addEventListener('click',async()=>{
    if(!confirm('¿Desbloquear Colaboraciones? La página quedará visible públicamente.'))return;
    await updateCollaborationsAccess({enabled:false},'Colaboraciones quedó desbloqueada y pública.');
  });
  $('#collab-lock-page')?.addEventListener('click',async()=>{
    const password=$('#collab-new-password')?.value||'';
    const payload={enabled:true};
    if(password)payload.password=password;
    await updateCollaborationsAccess(payload,'Colaboraciones quedó protegida con contraseña.');
  });
  $('#collab-save-password')?.addEventListener('click',async()=>{
    const password=$('#collab-change-password')?.value||'';
    if(!password)return setCollabMessage('Escribe la nueva contraseña.');
    await updateCollaborationsAccess({password},'Contraseña de Colaboraciones actualizada.');
  });
}
function setCollabMessage(message,ok=false){
  const el=$('#collab-admin-message');
  if(!el)return;
  el.textContent=message||'';
  el.classList.toggle('ok',!!ok);
}
async function updateCollaborationsAccess(payload,successMessage){
  setCollabMessage('Guardando…');
  const buttons=$$('#view-collaborations button');buttons.forEach(b=>b.disabled=true);
  try{
    const data=await api('/api/admin/collaborations',{method:'PATCH',body:JSON.stringify(payload)});
    adminState.collaborations=data.settings;
    renderCollaborationsAdmin();
    setCollabMessage(successMessage,true);
    toast(successMessage);
  }catch(err){
    setCollabMessage(err.message||'No fue posible actualizar Colaboraciones.');
    buttons.forEach(b=>b.disabled=false);
  }
}
