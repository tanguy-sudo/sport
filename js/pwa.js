if ('serviceWorker' in navigator) {
  const banner = (worker) => {
    if (document.getElementById('updateBanner')) return;
    const b = document.createElement('div'); b.id = 'updateBanner'; b.className = 'update-banner';
    const t = document.createElement('span'); t.textContent = 'Une nouvelle version est disponible.';
    const btn = document.createElement('button'); btn.className = 'btn'; btn.type = 'button'; btn.textContent = 'Mettre à jour';
    btn.addEventListener('click', () => worker.postMessage('SKIP_WAITING'));
    b.append(t, btn); document.body.append(b);
  };
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) banner(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        if (w) w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) banner(w); });
      });
    }).catch(() => {});
  });
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloading) { reloading = true; location.reload(); } });
}
