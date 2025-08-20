(() => {
  const { API_BASE, formatBRL, getCart, setCart } = window.Shop || {};

  function renderItems() {
    const container = document.getElementById('cart-items');
    const items = getCart();
    container.innerHTML = '';
    if (!items.length) {
      container.innerHTML = '<p>Seu carrinho está vazio.</p>';
      updateSummary(0, 0, 0);
      return;
    }
    items.forEach((it, idx) => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${it.imageUrl || 'images/logo.png'}" alt="${it.name}">
        <div>
          <div style="font-weight:bold">${it.name}</div>
          <div>${formatBRL(it.unitPrice)}</div>
        </div>
        <input class="qty-input" type="number" min="1" value="${it.quantity}" data-idx="${idx}">
        <button class="btn-secondary" data-remove="${idx}">Remover</button>
      `;
      container.appendChild(row);
    });
    container.querySelectorAll('.qty-input').forEach((inp) => {
      inp.addEventListener('change', (e) => {
        const i = Number(e.target.getAttribute('data-idx'));
        const items = getCart();
        items[i].quantity = Math.max(1, Number(e.target.value || 1));
        setCart(items);
        calculate();
      });
    });
    container.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const i = Number(e.currentTarget.getAttribute('data-remove'));
        const items = getCart();
        items.splice(i, 1);
        setCart(items);
        renderItems();
        calculate();
      });
    });
  }

  async function calculate() {
    const items = getCart();
    const discount = Number(document.getElementById('discount').value || 0);
    if (!items.length) {
      updateSummary(0, 0, 0);
      return;
    }
    const res = await fetch(`${API_BASE}/api/cart/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, discount })
    });
    const json = await res.json();
    updateSummary(json.subtotal, json.discount, json.total);
  }

  function updateSummary(subtotal, discount, total) {
    document.getElementById('sum-subtotal').textContent = formatBRL(subtotal);
    document.getElementById('sum-discount').textContent = formatBRL(discount);
    document.getElementById('sum-total').textContent = formatBRL(total);
  }

  async function submitOrder(type) {
    const items = getCart();
    if (!items.length) { alert('Carrinho vazio'); return; }
    const customer = {
      name: document.getElementById('cli-name').value.trim(),
      email: document.getElementById('cli-email').value.trim(),
      document: document.getElementById('cli-doc').value.trim(),
      phone: document.getElementById('cli-phone').value.trim(),
      address: document.getElementById('cli-addr').value.trim()
    };
    if (!customer.name) { alert('Informe o nome do cliente'); return; }
    const discount = Number(document.getElementById('discount').value || 0);
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, customer, items, discount })
    });
    const json = await res.json();
    if (!res.ok) { alert(json.error || 'Erro'); return; }
    window.open(`${API_BASE}/api/orders/${json.orderId}/pdf`, '_blank');
  }

  document.getElementById('btn-recalcular').addEventListener('click', calculate);
  document.getElementById('btn-orcamento').addEventListener('click', () => submitOrder('quote'));
  document.getElementById('btn-pedido').addEventListener('click', () => submitOrder('order'));

  renderItems();
  calculate();
})();

