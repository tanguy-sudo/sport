(() => {
  const KEY = 'j80-theme', root = document.documentElement;
  try { const t = localStorage.getItem(KEY); if (t === 'dark' || t === 'light') root.dataset.theme = t; } catch (_) {}
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const paint = () => { btn.textContent = isDark() ? '\u2600\uFE0F' : '\uD83C\uDF19'; btn.title = isDark() ? 'Passer en mode clair' : 'Passer en mode sombre'; };
    btn.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem(KEY, next); } catch (_) {}
      paint();
    });
    paint();
  });
})();
