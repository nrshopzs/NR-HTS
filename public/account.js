let accountCustomer=null;
let accountOrders=[];
let accountFavorites=[];

const aq=(s,r=document)=>r.querySelector(s);
const aqa=(s,r=document)=>[...r.querySelectorAll(s)];
const escAccount=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const accountMoney=value=>'MX$'+Number(value||0).toFixed(2);

function accountDate(value){
  if(!value)return '—';
  const d=new Date(value);
  return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(d);
}
async function accountApi(url,options={}){
  const res=await fetch(url,{
    credentials:'same-origin',
    ...options,
    headers:{'Content-Type':'application/json',...(options.headers||{})}
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||'No fue posible completar la operación.');
  return data;
}
function accountFullName(customer){
  return [customer?.nombre,customer?.apellidos].filter(Boolean).join(' ').trim()||'Mi cuenta';
}
function formatAddress(address={}){
  const parts=[
    address.calle,
    address.colonia,
    [address.cp,address.ciudad].filter(Boolean).join(', '),
    address.estado,
    address.pais
  ].filter(Boolean);
  return parts.length?parts.join('\n'):'';
}
function normalizeOrders(orders){
  return [...(Array.isArray(orders)?orders:[])].sort((a,b)=>{
    const da=new Date(a?.createdAt||0).getTime();
    const db=new Date(b?.createdAt||0).getTime();
    return db-da;
  });
}
function showLoggedOut(){
  accountCustomer=null;
  accountOrders=[];
  accountFavorites=[];
  const dashboard=aq('#account-dashboard');
  if(dashboard)dashboard.hidden=true;

  // Mi cuenta es exclusiva para usuarios autenticados.
  // Si alguien llega aquí sin sesión, se abre el mismo popup
  // de inicio de sesión / creación de cuenta del menú principal.
  if(typeof openCustomerAuthOverlay==='function'){
    openCustomerAuthOverlay('login');
  }
}
function showLoggedIn(customer){
  accountCustomer=customer;
  const dashboard=aq('#account-dashboard');
  if(dashboard)dashboard.hidden=false;
  aq('#account-sidebar-name').textContent=accountFullName(customer);
  aq('#account-sidebar-email').textContent=customer.email||'';
  aq('#account-avatar').textContent=((customer.nombre?.[0]||'N')+(customer.apellidos?.[0]||'R')).toUpperCase();
  aq('#account-summary-title').textContent=accountFullName(customer);
  fillProfile(customer);
  fillAddress(customer.address||{});
  renderAccountSummary();
}
function fillProfile(c){
  const f=aq('#account-profile-form');
  f.elements.nombre.value=c.nombre||'';
  f.elements.apellidos.value=c.apellidos||'';
  f.elements.email.value=c.email||'';
  f.elements.telefono.value=c.telefono||'';
  const badge=aq('#account-email-status');
  if(badge){badge.textContent='Correo de la cuenta';badge.classList.remove('pending')}
}
function fillAddress(a){
  const f=aq('#account-address-form');
  ['calle','colonia','cp','ciudad','estado','pais'].forEach(k=>f.elements[k].value=a[k]||(k==='pais'?'México':''));
}
function renderAccountSummary(){
  if(!accountCustomer)return;
  const fullName=accountFullName(accountCustomer);
  aq('#account-detail-name').textContent=fullName;
  aq('#account-detail-email').textContent=accountCustomer.email||'—';
  aq('#account-detail-phone').textContent=accountCustomer.telefono||'No registrado';

  const formattedAddress=formatAddress(accountCustomer.address||{});
  aq('#account-summary-shipping').textContent=formattedAddress||'No tienes una dirección de envío registrada.';
  aq('#account-summary-billing').textContent=formattedAddress||'No tienes una dirección de facturación registrada.';

  const latest=accountOrders[0];
  const root=aq('#account-summary-last-order');
  if(!latest){
    root.innerHTML=`<div class="account-summary-order-empty">
      <p>No tienes ningún pedido en tu historial.</p>
      <div class="account-summary-order-actions">
        <a href="shop-all.html" class="account-summary-button">Comenzar a comprar</a>
        <button type="button" class="account-summary-button primary" data-go-tab="orders">Ver mis pedidos</button>
      </div>
    </div>`;
    bindTabShortcuts(root);
    return;
  }

  root.innerHTML=`<div class="account-summary-order-card">
    <div class="account-summary-order-head">
      <div><span>Pedido</span><strong>${escAccount(latest.orderNumber||'—')}</strong></div>
      <div><span>Estado</span><strong>${escAccount(latest.status||'—')}</strong></div>
      <div><span>Fecha</span><strong>${escAccount(accountDate(latest.createdAt))}</strong></div>
      <div><span>Total</span><strong>${accountMoney(latest.totals?.total)}</strong></div>
    </div>
    <div class="account-summary-order-items">
      ${(latest.items||[]).map(item=>`<div class="account-summary-order-item">
        <div>
          <strong>${escAccount(item.name)}</strong>
          <small>${escAccount(item.color||'')} · Talla ${escAccount(item.size||'')} · Cant. ${Number(item.qty)||1}</small>
        </div>
        <b>${accountMoney(item.lineTotal)}</b>
      </div>`).join('')}
    </div>
    <div class="account-summary-order-foot">
      <strong>Total pagado: ${accountMoney(latest.totals?.total)}</strong>
      <a href="account.html#orders">Ver todos mis pedidos</a>
    </div>
  </div>`;
}
function renderAccountOrders(){
  const root=aq('#account-orders');
  if(!accountOrders.length){
    root.innerHTML=`<div class="account-empty-orders"><strong>Todavía no tienes pedidos vinculados a esta cuenta.</strong><p>Cuando compres con tu sesión iniciada, tus pedidos aparecerán automáticamente aquí.</p><a href="shop-all.html">Ir a la tienda</a></div>`;
    return;
  }
  root.innerHTML=accountOrders.map(order=>{
    const shipment=order.shipment||{};
    const tracking=/^https?:\/\//i.test(shipment.trackingUrl||'')?shipment.trackingUrl:'';
    return `<article class="account-order-card">
      <div class="account-order-head">
        <div><span>PEDIDO</span><strong>${escAccount(order.orderNumber)}</strong><small>${escAccount(accountDate(order.createdAt))}</small></div>
        <div><span>ESTADO</span><strong class="account-order-status">${escAccount(order.status)}</strong></div>
        <div><span>TOTAL</span><strong>${accountMoney(order.totals?.total)}</strong></div>
      </div>
      <div class="account-order-items">
        ${(order.items||[]).map(item=>`<div><span><strong>${escAccount(item.name)}</strong><small>${escAccount(item.color)} · Talla ${escAccount(item.size)} · Cant. ${Number(item.qty)||1}</small></span><b>${accountMoney(item.lineTotal)}</b></div>`).join('')}
      </div>
      ${shipment.trackingNumber||shipment.carrier?`<div class="account-order-shipping">
        <div><span>Paquetería</span><strong>${escAccount(shipment.carrier||'Por confirmar')}</strong></div>
        <div><span>Guía</span><strong>${escAccount(shipment.trackingNumber||'Por confirmar')}</strong></div>
        ${tracking?`<a href="${escAccount(tracking)}" target="_blank" rel="noopener noreferrer">Rastrear envío ↗</a>`:''}
      </div>`:''}
    </article>`;
  }).join('');
}
async function loadAccountOrders(){
  try{
    const data=await accountApi('/api/account/orders',{method:'GET'});
    accountOrders=normalizeOrders(data.orders);
    renderAccountOrders();
    renderAccountSummary();
  }catch(err){
    aq('#account-orders').innerHTML=`<div class="account-empty-orders">${escAccount(err.message)}</div>`;
    renderAccountSummary();
  }
}
function renderAccountFavorites(){
  const root=aq('#account-favorites');
  if(!root)return;
  if(!accountFavorites.length){
    root.innerHTML=`<div class="account-empty-favorites"><strong>Todavía no tienes productos favoritos.</strong><p>Guarda las playeras que más te gusten con el botón del corazón y aparecerán aquí.</p><a href="shop-all.html">Explorar la tienda</a></div>`;
    return;
  }
  root.innerHTML=accountFavorites.map(product=>{
    const soldOut=product.soldOut===true;
    const href=`product.html?id=${encodeURIComponent(product.id||'')}`;
    return `<article class="account-favorite-card" data-favorite-card="${escAccount(product.id)}">
      <a class="account-favorite-image" href="${href}"><img src="${escAccount(product.img||'')}" alt="${escAccount(product.name||'Producto')}" loading="lazy"></a>
      <div class="account-favorite-copy">
        <a href="${href}" class="account-favorite-name">${escAccount(product.name||'Producto')}</a>
        <strong class="account-favorite-price">${accountMoney(product.price)}</strong>
        ${soldOut?'<span class="account-favorite-stock">AGOTADO</span>':''}
        <div class="account-favorite-actions"><a href="${href}">Ver producto</a><button type="button" data-favorite-remove="${escAccount(product.id)}">Quitar</button></div>
      </div>
    </article>`;
  }).join('');
}
async function loadAccountFavorites(){
  const root=aq('#account-favorites');
  try{
    const data=await accountApi('/api/account/favorites',{method:'GET'});
    accountFavorites=Array.isArray(data.products)?data.products:[];
    renderAccountFavorites();
  }catch(err){
    accountFavorites=[];
    if(root)root.innerHTML=`<div class="account-empty-favorites">${escAccount(err.message)}</div>`;
  }
}
async function loadAccount(){
  mountShell('');
  try{
    const res=await fetch('/api/account/session',{cache:'no-store',credentials:'same-origin'});
    const data=await res.json();
    if(data.authenticated&&data.customer){
      showLoggedIn(data.customer);
      await Promise.all([loadAccountOrders(),loadAccountFavorites()]);
    }else showLoggedOut();
  }catch{showLoggedOut()}
}

aq('#account-favorites')?.addEventListener('click',async e=>{
  const button=e.target.closest('[data-favorite-remove]');
  if(!button)return;
  const productId=String(button.dataset.favoriteRemove||'').trim();
  if(!productId)return;
  button.disabled=true;button.textContent='Quitando…';
  try{
    const data=await accountApi(`/api/account/favorites/${encodeURIComponent(productId)}`,{method:'DELETE'});
    accountFavorites=Array.isArray(data.products)?data.products:[];
    renderAccountFavorites();
  }catch(err){button.disabled=false;button.textContent='Quitar';alert(err.message||'No fue posible quitar el producto de favoritos.')}
});

aq('#account-profile-form')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const msg=aq('#account-profile-message'),button=e.currentTarget.querySelector('button[type="submit"]');
  button.disabled=true;msg.textContent='Guardando…';
  try{
    const raw=Object.fromEntries(new FormData(e.currentTarget).entries());
    const data=await accountApi('/api/account/profile',{method:'PATCH',body:JSON.stringify({nombre:raw.nombre,apellidos:raw.apellidos,telefono:raw.telefono})});
    accountCustomer=data.customer;showLoggedIn(data.customer);hydrateCustomerHeader();msg.textContent='Cambios guardados.';
  }catch(err){msg.textContent=err.message}
  finally{button.disabled=false}
});

aq('#account-email-change-toggle')?.addEventListener('click',()=>{
  const form=aq('#account-email-change-form');
  if(!form)return;
  form.hidden=!form.hidden;
  if(!form.hidden){form.elements.newEmail.value='';form.elements.password.value='';aq('#account-email-change-message').textContent='';form.elements.newEmail.focus()}
});
aq('#account-email-change-cancel')?.addEventListener('click',()=>{const form=aq('#account-email-change-form');if(form){form.hidden=true;form.reset()}const msg=aq('#account-email-change-message');if(msg)msg.textContent=''});
aq('#account-email-change-form')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.currentTarget;
  const msg=aq('#account-email-change-message'),button=form.querySelector('button[type="submit"]');
  button.disabled=true;msg.textContent='Enviando verificación…';
  try{
    const body=Object.fromEntries(new FormData(form).entries());
    const data=await accountApi('/api/account/email/change-request',{method:'POST',body:JSON.stringify(body)});
    msg.textContent=data.message||'Revisa tu nuevo correo para confirmar el cambio.';
    if(form.elements.password)form.elements.password.value='';
  }catch(err){msg.textContent=err.message}
  finally{button.disabled=false}
});

aqa('[data-account-password-toggle]').forEach(btn=>btn.addEventListener('click',()=>{
  const wrap=btn.closest('.account-password-input-wrap');
  const input=wrap?.querySelector('input');
  if(!input)return;
  const showing=input.type==='text';
  input.type=showing?'password':'text';
  btn.classList.toggle('is-visible',!showing);
  btn.setAttribute('aria-pressed',!showing?'true':'false');
  btn.setAttribute('aria-label',showing?'Mostrar contraseña':'Ocultar contraseña');
}));
aq('#account-password-form')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.currentTarget;
  const msg=aq('#account-password-message'),button=form.querySelector('button[type="submit"]'),body=Object.fromEntries(new FormData(form).entries());
  if(body.newPassword!==body.confirmPassword){msg.textContent='Las nuevas contraseñas no coinciden.';return}
  button.disabled=true;msg.textContent='Actualizando contraseña…';
  try{
    const data=await accountApi('/api/account/password/change',{method:'POST',body:JSON.stringify({currentPassword:body.currentPassword,newPassword:body.newPassword})});
    accountCustomer=data.customer||accountCustomer;
    form.reset();
    form.querySelectorAll('.account-password-input-wrap input').forEach(input=>{input.type='password'});
    form.querySelectorAll('[data-account-password-toggle]').forEach(toggle=>{
      toggle.classList.remove('is-visible');
      toggle.setAttribute('aria-pressed','false');
      toggle.setAttribute('aria-label','Mostrar contraseña');
    });
    msg.textContent=data.message||'Contraseña actualizada.';
  }catch(err){msg.textContent=err.message}
  finally{button.disabled=false}
});
aq('#account-address-form')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const msg=aq('#account-address-message'),button=e.currentTarget.querySelector('button[type="submit"]');
  button.disabled=true;msg.textContent='Guardando…';
  try{
    const body=Object.fromEntries(new FormData(e.currentTarget).entries());
    const data=await accountApi('/api/account/address',{method:'PATCH',body:JSON.stringify(body)});
    accountCustomer=data.customer;fillAddress(data.customer.address||{});renderAccountSummary();msg.textContent='Dirección guardada.';
  }catch(err){msg.textContent=err.message}
  finally{button.disabled=false}
});
aq('#account-logout')?.addEventListener('click',async()=>{
  try{await accountApi('/api/account/logout',{method:'POST',body:'{}'})}catch{}
  accountCustomer=null;
  accountOrders=[];
  accountFavorites=[];
  await hydrateCustomerHeader();
  showLoggedOut();
});

function setAccountTab(tab='summary'){
  const tabs=aqa('[data-account-tab]');
  const panels=aqa('[data-account-panel]');
  const valid=tabs.some(btn=>btn.dataset.accountTab===tab)?tab:'summary';
  tabs.forEach(btn=>btn.classList.toggle('selected',btn.dataset.accountTab===valid));
  panels.forEach(panel=>panel.classList.toggle('selected',panel.dataset.accountPanel===valid));
}
function goToTab(tab){
  setAccountTab(tab);
  history.replaceState(null,'',`#${tab}`);
}
function bindTabShortcuts(scope=document){
  aqa('[data-go-tab]',scope).forEach(btn=>{
    if(btn.dataset.boundTabShortcut==='1')return;
    btn.dataset.boundTabShortcut='1';
    btn.addEventListener('click',()=>goToTab(btn.dataset.goTab||'summary'));
  });
}
aqa('[data-account-tab]').forEach(btn=>btn.addEventListener('click',()=>{
  goToTab(btn.dataset.accountTab||'summary');
}));
window.addEventListener('hashchange',()=>setAccountTab((location.hash||'#summary').replace('#','')||'summary'));

document.addEventListener('DOMContentLoaded',()=>{
  setAccountTab((location.hash||'#summary').replace('#','')||'summary');
  bindTabShortcuts();
  loadAccount();
});
