// Images des exercices (data/exercise-images.json : nom -> dossier dans img/exercices/).
// Source : free-exercise-db (domaine public), https://github.com/yuhonas/free-exercise-db
window.J80Exo = (() => {
  let map = {};
  const ready = fetch('data/exercise-images.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((m) => { map = m; });

  // « Tour 1, effort 2/6 : Squats » -> « Squats »
  const blockName = (title) => { const m = String(title).match(/ : (.+)$/); return m ? m[1] : ''; };

  // img (facultatif) : dossier de la base d'images, ou image importée (data URL), prioritaire sur le nom.
  function figure(name, img) {
    const id = img || map[name];
    if (!id) return null;
    const f = document.createElement('div');
    f.className = 'exo';
    const pics = String(id).startsWith('data:') ? [[id, name]] : ['départ', 'arrivée'].map((pos, i) => [`img/exercices/${id}/${i}.jpg`, `${name} : position de ${pos}`]);
    pics.forEach(([src, alt]) => {
      const im = document.createElement('img');
      im.src = src; im.alt = alt; im.loading = 'lazy';
      f.append(im);
    });
    return f;
  }
  // Étape du mode séance : série d'un exercice, ou bloc chronométré nommé.
  const forStep = (s) => (s ? figure(s.k === 'set' ? s.ex : blockName(s.title), s.img) : null);

  // Clic sur une image : agrandissement dans une popin, fermée par clic (ou Échap).
  document.addEventListener('click', (e) => {
    const im = e.target.closest && e.target.closest('.exo img');
    if (!im) return;
    const o = document.createElement('div');
    o.className = 'exo-zoom'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', im.alt);
    const big = document.createElement('img'); big.src = im.src; big.alt = im.alt;
    const close = () => { o.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (k) => { if (k.key === 'Escape') close(); };
    o.addEventListener('click', close); document.addEventListener('keydown', onKey);
    o.append(big); document.body.append(o);
  });

  // Images de la base : [{ id, name }] (un nom par dossier), pour le choix dans l'éditeur.
  const library = () => { const seen = new Map(); Object.entries(map).forEach(([n, id]) => { if (!seen.has(id)) seen.set(id, n); }); return [...seen].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'fr')); };

  return { ready, library, figure, forStep, blockName };
})();
