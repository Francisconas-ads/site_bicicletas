(() => {
  function onlyDigits(value) { return (value || '').replace(/\D+/g, ''); }

  function maskCpfCnpj(value) {
    const digits = onlyDigits(value);
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }

  function maskPhone(value) {
    const d = onlyDigits(value);
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  }

  document.addEventListener('input', (e) => {
    const id = e.target.id;
    if (id === 'cli-doc') e.target.value = maskCpfCnpj(e.target.value);
    if (id === 'cli-phone') e.target.value = maskPhone(e.target.value);
  });
})();

