(() => {
  const { API_BASE, formatBRL, addToCart } = window.Shop || {};

  function getId() {
    const url = new URL(window.location.href);
    return url.searchParams.get('id');
  }

  async function loadProduct() {
    const id = getId();
    if (!id) return;
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    const p = await res.json();
    document.getElementById('prod-name').textContent = p.name;
    document.getElementById('prod-price').textContent = formatBRL(p.price);
    document.getElementById('prod-desc').textContent = p.description || '';
    const img = document.getElementById('prod-image');
    img.src = p.image_url || 'images/logo.png';
    img.alt = p.name;

    document.getElementById('btn-add').addEventListener('click', () => {
      const qty = Math.max(1, Number(document.getElementById('qty').value || 1));
      addToCart({ productId: p.id, name: p.name, unitPrice: p.price, quantity: qty, imageUrl: p.image_url });
      alert('Adicionado ao carrinho');
    });
  }

  loadProduct();
})();

