// e-Bike Store - Frontend interactions
(function(){
  const API_BASE = './backend';

  function brl(cents){
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((cents||0)/100);
  }

  function qs(sel, el){ return (el||document).querySelector(sel); }
  function qsa(sel, el){ return Array.from((el||document).querySelectorAll(sel)); }

  async function fetchJSON(url, options){
    const res = await fetch(url, Object.assign({ headers: { 'Content-Type': 'application/json' } }, options||{}));
    if(!res.ok) throw new Error('HTTP '+res.status);
    return res.json();
  }

  function hookupSearch(){
    const form = qs('.search-box');
    if(!form) return;
    const input = qs('input[type="search"]', form);
    const btn = qs('button', form);
    const go = ()=>{
      const q = (input.value||'').trim();
      if(q) window.location.href = 'catalogoBicicletas.html?q='+encodeURIComponent(q);
    };
    btn && btn.addEventListener('click', (e)=>{ e.preventDefault(); go(); });
    input && input.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); go(); } });
  }

  async function loadCatalog(categorySlug){
    const grid = qs('.catalog-product-grid');
    if(!grid) return;
    const url = new URL(window.location.href);
    const q = url.searchParams.get('q') || '';
    const sortSelect = qs('#sort');
    const sort = sortSelect ? sortSelect.value : '';
    const data = await fetchJSON(`${API_BASE}/products.php?category=${encodeURIComponent(categorySlug||'')}&q=${encodeURIComponent(q)}&sort=${encodeURIComponent(sort)}`);
    const items = data.items || [];
    grid.innerHTML = items.map(p => `
      <div class="product-card">
        <img src="${p.image_url}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p class="product-price">${p.price_brl}</p>
        <a href="produto.html?id=${p.id}" class="btn-secondary">Ver Detalhes</a>
      </div>
    `).join('');
    sortSelect && sortSelect.addEventListener('change', ()=>loadCatalog(categorySlug));
  }

  async function loadProduct(){
    const url = new URL(window.location.href);
    const id = url.searchParams.get('id');
    if(!id) return;
    const data = await fetchJSON(`${API_BASE}/products.php?id=${encodeURIComponent(id)}`);
    const title = qs('.product-info h1'); if(title) title.textContent = data.name;
    const price = qs('.product-page-price'); if(price) price.textContent = data.price_brl;
    const mainImg = qs('.product-gallery .main-image img'); if(mainImg) mainImg.src = data.image_url;
    const addBtn = qs('.add-to-cart-btn');
    if(addBtn){
      addBtn.addEventListener('click', async ()=>{
        const qtyEl = qs('#qty');
        const qty = qtyEl ? Math.max(1, parseInt(qtyEl.value||'1',10)) : 1;
        await fetchJSON(`${API_BASE}/cart.php`, { method: 'POST', body: JSON.stringify({ action: 'add', product_id: data.id, qty })});
        window.location.href = 'carrinho.html';
      });
    }
  }

  async function renderCart(){
    const container = qs('#cart-container');
    if(!container) return;
    const data = await fetchJSON(`${API_BASE}/cart.php`);
    const items = data.items || [];
    if(items.length === 0){
      container.innerHTML = '<p>Seu carrinho está vazio.</p>';
      return;
    }
    container.innerHTML = `
      <table class="cart-table">
        <thead><tr><th>Produto</th><th>Qtd</th><th>Preço</th><th>Total</th><th></th></tr></thead>
        <tbody>
          ${items.map(it => `
            <tr data-id="${it.product_id}">
              <td><img src="${it.image_url}" alt="" style="width:60px;height:40px;object-fit:cover;margin-right:8px;vertical-align:middle;"> ${it.name}</td>
              <td><input type="number" min="1" value="${it.qty}" class="qty-input" style="width:70px"></td>
              <td>${it.price_brl}</td>
              <td>${it.total_brl}</td>
              <td><button class="remove-btn">Remover</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="cart-totals">Total: <strong>${data.totals.total_brl}</strong></div>
      <div class="cart-actions" style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;">
        <a href="checkout.html?type=ORCAMENTO" class="btn-primary">Gerar Orçamento</a>
        <a href="checkout.html?type=PEDIDO" class="btn-secondary">Finalizar Pedido</a>
      </div>
    `;
    qsa('.qty-input', container).forEach(input => {
      input.addEventListener('change', async (e)=>{
        const tr = e.target.closest('tr');
        const id = tr.getAttribute('data-id');
        const qty = Math.max(1, parseInt(e.target.value||'1',10));
        await fetchJSON(`${API_BASE}/cart.php`, { method: 'POST', body: JSON.stringify({ action: 'update', product_id: parseInt(id,10), qty })});
        renderCart();
      });
    });
    qsa('.remove-btn', container).forEach(btn => {
      btn.addEventListener('click', async (e)=>{
        const tr = e.target.closest('tr');
        const id = tr.getAttribute('data-id');
        await fetchJSON(`${API_BASE}/cart.php`, { method: 'POST', body: JSON.stringify({ action: 'update', product_id: parseInt(id,10), qty: 0 })});
        renderCart();
      });
    });
  }

  function applyBrMasks(){
    const cpfCnpj = qs('#cpf_cnpj');
    if(cpfCnpj){
      cpfCnpj.addEventListener('input', ()=>{
        let v = cpfCnpj.value.replace(/\D/g, '');
        if(v.length <= 11){ // CPF: 000.000.000-00
          v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else { // CNPJ: 00.000.000/0000-00
          v = v.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
        }
        cpfCnpj.value = v;
      });
    }
    const cep = qs('#cep');
    if(cep){
      cep.addEventListener('input', ()=>{
        let v = cep.value.replace(/\D/g, '').slice(0,8);
        if(v.length > 5) v = v.slice(0,5) + '-' + v.slice(5);
        cep.value = v;
      });
    }
    const tel = qs('#telefone');
    if(tel){
      tel.addEventListener('input', ()=>{
        let v = tel.value.replace(/\D/g, '').slice(0,11);
        if(v.length > 10){ // (00) 00000-0000
          v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if(v.length > 6){ // (00) 0000-0000
          v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else if(v.length > 2){
          v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        } else if(v.length > 0){
          v = v.replace(/(\d{0,2})/, '($1');
        }
        tel.value = v;
      });
    }
  }

  function hookupCheckout(){
    const form = qs('#checkout-form');
    if(!form) return;
    applyBrMasks();
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      const url = new URL(window.location.href);
      const type = url.searchParams.get('type') || 'ORCAMENTO';
      payload.type = type;
      const res = await fetchJSON(`${API_BASE}/order.php`, { method: 'POST', body: JSON.stringify(payload) });
      alert(`${res.type === 'PEDIDO' ? 'Pedido' : 'Orçamento'} criado: ${res.order_number}`);
      window.location.href = `pdf.html?number=${encodeURIComponent(res.order_number)}`;
    });
  }

  async function showPdf(){
    const iframe = qs('#pdf-frame');
    if(!iframe) return;
    const url = new URL(window.location.href);
    const number = url.searchParams.get('number');
    if(!number){
      iframe.outerHTML = '<p>Número não informado.</p>';
      return;
    }
    iframe.src = `${API_BASE}/pdf.php?number=${encodeURIComponent(number)}`;
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    hookupSearch();
    if(document.body.classList.contains('page-catalog-bicicletas')) loadCatalog('bicicletas');
    if(document.body.classList.contains('page-catalog-pecas')) loadCatalog('pecas');
    if(document.body.classList.contains('page-catalog-acessorios')) loadCatalog('acessorios');
    if(document.body.classList.contains('page-product')) loadProduct();
    if(document.body.classList.contains('page-cart')) renderCart();
    if(document.body.classList.contains('page-checkout')) hookupCheckout();
    if(document.body.classList.contains('page-pdf')) showPdf();
  });
})();

