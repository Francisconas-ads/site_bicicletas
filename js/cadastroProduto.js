(() => {
  const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:3001' : '';

  function getToken() { return ''; }

  function collect() {
    return {
      sku: document.getElementById('sku').value.trim(),
      name: document.getElementById('name').value.trim(),
      price: Number(document.getElementById('price').value || 0),
      category: document.getElementById('category').value.trim(),
      brand: document.getElementById('brand').value.trim(),
      image_url: document.getElementById('image_url').value.trim(),
      description: document.getElementById('description').value.trim(),
      active: document.getElementById('active').checked
    };
  }

  function clearForm() {
    ['sku','name','price','category','brand','image_url','description'].forEach(id => document.getElementById(id).value='');
    document.getElementById('active').checked = true;
  }

  async function save() {
    const body = collect();
    const res = await fetch(`${API_BASE}/api/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) { alert(json.error || 'Erro'); return; }
    alert('Produto cadastrado com sucesso! ID: ' + json.id);
    clearForm();
  }

  document.getElementById('btn-salvar').addEventListener('click', save);
  document.getElementById('btn-limpar').addEventListener('click', clearForm);
})();

