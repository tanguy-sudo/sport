// Images des exercices (data/exercise-images.json : nom -> dossier dans img/exercices/).
// Source : free-exercise-db (domaine public), https://github.com/yuhonas/free-exercise-db
window.J80Exo = (() => {
  let map = {};
  const ready = fetch('data/exercise-images.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((m) => { map = m; });

  // « Tour 1, effort 2/6 : Squats » -> « Squats »
  const blockName = (title) => { const m = String(title).match(/ : (.+)$/); return m ? m[1] : ''; };

  function figure(name) {
    const id = map[name];
    if (!id) return null;
    const f = document.createElement('div');
    f.className = 'exo';
    ['départ', 'arrivée'].forEach((pos, i) => {
      const im = document.createElement('img');
      im.src = `img/exercices/${id}/${i}.jpg`;
      im.alt = `${name} : position de ${pos}`;
      im.loading = 'lazy';
      f.append(im);
    });
    return f;
  }
  // Étape du mode séance : série d'un exercice, ou bloc chronométré nommé.
  const forStep = (s) => (s ? figure(s.k === 'set' ? s.ex : blockName(s.title)) : null);

  return { ready, figure, forStep, blockName };
})();
