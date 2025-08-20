(() => {
  const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:3001' : '';
  const state = { token: localStorage.getItem('admin_token') || '', selectedId: null };

  function authHeaders() {
    return state.token ? { Authorization: 'Bearer ' + state.token } : {};
  }

  async function listProducts() {
    const res = await fetch(`${API_BASE}/api/products`);
    const items = await res.json();
    const tbody = document.querySelector('#grid tbody');
    tbody.innerHTML = '';
    items.forEach((p) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${p.id}</td><td>${p.sku}</td><td>${p.name}</td><td>${Number(p.price).toFixed(2)}</td><td>${p.category||''}</td><td>${p.brand||''}</td><td>sim</td><td class="right"><button data-edit="${p.id}">Editar</button></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => loadForEdit(btn.getAttribute('data-edit'))));
  }

  async function loadForEdit(id) {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    const p = await res.json();
    state.selectedId = p.id;
    document.getElementById('sku').value = p.sku || '';
    document.getElementById('name').value = p.name || '';
    document.getElementById('price').value = Number(p.price || 0);
    document.getElementById('category').value = p.category || '';
    document.getElementById('brand').value = p.brand || '';
    document.getElementById('image_url').value = p.image_url || '';
    document.getElementById('description').value = p.description || '';
    document.getElementById('btn-update').disabled = false;
  }

  function collectForm() {
    return {
      sku: document.getElementById('sku').value.trim(),
      name: document.getElementById('name').value.trim(),
      price: Number(document.getElementById('price').value || 0),
      category: document.getElementById('category').value.trim(),
      brand: document.getElementById('brand').value.trim(),
      image_url: document.getElementById('image_url').value.trim(),
      description: document.getElementById('description').value.trim()
    };
  }

  async function createProduct() {
    const body = collectForm();
    const res = await fetch(`${API_BASE}/api/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) });
    if (!res.ok) { const e = await res.json(); alert(e.error || 'Erro'); return; }
    await listProducts();
    alert('Produto criado');
  }

  async function updateProduct() {
    if (!state.selectedId) { alert('Selecione um item'); return; }
    const body = collectForm();
    const res = await fetch(`${API_BASE}/api/products/${state.selectedId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) });
    if (!res.ok) { const e = await res.json(); alert(e.error || 'Erro'); return; }
    await listProducts();
    alert('Produto atualizado');
  }

  function bindLogin() {
    const login = document.getElementById('login');
    const admin = document.getElementById('admin');
    function openAdmin() { login.style.display = 'none'; admin.style.display = 'block'; listProducts(); }
    if (state.token) { openAdmin(); }
    document.getElementById('btn-login').addEventListener('click', () => {
      const token = document.getElementById('adm-token').value.trim();
      if (!token) { alert('Informe o token'); return; }
      state.token = token; localStorage.setItem('admin_token', token); openAdmin();
    });
  }

  document.getElementById('btn-create').addEventListener('click', createProduct);
  document.getElementById('btn-update').addEventListener('click', updateProduct);
  bindLogin();
})();

