(() => {
  const { API_BASE, fetchProducts, formatBRL, addToCart } = window.Shop || {};

  function renderProductCard(p) {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
      <img src="${p.image_url || 'images/logo.png'}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p class="product-price">${formatBRL(p.price)}</p>
      <a href="produto.html?id=${p.id}" class="btn-secondary">Ver Detalhes</a>
      <button class="btn-primary js-add" data-p='${JSON.stringify({ id: p.id, name: p.name, price: p.price, image_url: p.image_url })}'>Adicionar ao carrinho</button>
    `;
    div.querySelector('.js-add').addEventListener('click', (e) => {
      const data = JSON.parse(e.currentTarget.getAttribute('data-p'));
      addToCart({ productId: data.id, name: data.name, unitPrice: data.price, quantity: 1, imageUrl: data.image_url });
      alert('Adicionado ao carrinho');
    });
    return div;
  }

  async function loadCatalog() {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;
    const url = new URL(window.location.href);
    const params = {};
    const q = url.searchParams.get('q');
    if (q) params.q = q;
    const res = await fetchProducts(params);
    grid.innerHTML = '';
    res.forEach((p) => grid.appendChild(renderProductCard(p)));
  }

  loadCatalog();
})();

