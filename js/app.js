(() => {
  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3001' : '';

  function formatBRL(value) {
    return (Number(value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  async function fetchProducts(params = {}) {
    const url = new URL(`${API_BASE}/api/products`);
    Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
    const res = await fetch(url);
    return res.json();
  }

  function renderProductCard(p) {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
      <img src="${p.image_url || 'images/logo.png'}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p class="product-price">${formatBRL(p.price)}</p>
      <div class="purchase-actions">
        <button class="btn-secondary js-add" data-p='${JSON.stringify({ id: p.id, name: p.name, price: p.price, image_url: p.image_url })}'>Adicionar</button>
        <a href="produto.html?id=${p.id}" class="btn-primary">Ver Detalhes</a>
      </div>
    `;
    div.querySelector('.js-add').addEventListener('click', (e) => {
      const data = JSON.parse(e.currentTarget.getAttribute('data-p'));
      addToCart({ productId: data.id, name: data.name, unitPrice: data.price, quantity: 1, imageUrl: data.image_url });
      alert('Adicionado ao carrinho');
    });
    return div;
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch { return []; }
  }
  function setCart(items) { localStorage.setItem('cart', JSON.stringify(items)); }
  function addToCart(item) {
    const items = getCart();
    const idx = items.findIndex((it) => it.productId === item.productId);
    if (idx >= 0) items[idx].quantity += item.quantity; else items.push(item);
    setCart(items);
    window.dispatchEvent(new CustomEvent('cart:changed'));
  }

  function bindGlobalSearch() {
    const input = document.getElementById('global-search');
    const btn = document.getElementById('global-search-btn');
    if (!input || !btn) return;
    const go = () => {
      const q = input.value.trim();
      if (q) {
        const url = new URL(window.location.origin + '/catalogoBicicletas.html');
        url.searchParams.set('q', q);
        window.location.href = url.toString();
      }
    };
    btn.addEventListener('click', go);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  }

  async function hydrateHomeGrids() {
    const gridA = document.getElementById('home-grid-mais-vendidos');
    const gridB = document.getElementById('home-grid-novidades');
    if (!gridA && !gridB) return;
    const products = await fetchProducts({});
    const pick = (arr, start, count) => arr.slice(start, start + count);
    const a = pick(products, 0, 4);
    const b = pick(products, 4, 4);
    if (gridA) a.forEach((p) => gridA.appendChild(renderProductCard(p)));
    if (gridB) b.forEach((p) => gridB.appendChild(renderProductCard(p)));
  }

  window.Shop = { API_BASE, fetchProducts, formatBRL, getCart, setCart, addToCart };

  bindGlobalSearch();
  hydrateHomeGrids();
})();

