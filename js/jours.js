(() => {
  const S = J80Store, $ = (id) => document.getElementById(id);
  let d = S.load();
  const SESS = { 1: ['A', 'Séance A — Haut du corps'], 2: ['B', 'Séance B — Cardio endurance'], 3: ['·', 'Récupération : marche ou mobilité'], 4: ['C', 'Séance C — Bas du corps'], 5: ['·', 'Repos'], 6: ['D', 'Séance D — Cardio + circuit'], 0: ['·', 'Repos'] };
  const PHASES = [[14, 'Reprise structurée'], [35, 'Progression'], [60, 'Conditionnement'], [80, 'Consolidation']];
  const parse = (s) => { const [y, m, dd] = s.split('-').map(Number); return new Date(y, m - 1, dd); };
  const dayAt = (start, n) => { const x = parse(start); x.setDate(x.getDate() + n - 1); return x; };
  const todayN = () => {
    if (!d.startDate) return null;
    const a = parse(d.startDate), t = new Date();
    return Math.round((Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5) + 1;
  };
  const persist = () => { if (!S.save(d)) $('status').textContent = 'Impossible d’enregistrer dans ce navigateur.'; };

  function render() {
    const n = todayN(), done = Object.keys(d.days).length;
    const st = $('status');
    if (n === null) st.textContent = 'Choisis ta date de départ pour voir le jour en cours et la séance prévue.';
    else if (n < 1) st.textContent = `Le programme commence dans ${1 - n} jour${1 - n > 1 ? 's' : ''}.`;
    else if (n > 80) st.textContent = 'Les 80 jours sont écoulés. Fais ton bilan de forme !';
    else {
      const ph = PHASES.find(p => n <= p[0])[1], s = SESS[new Date().getDay()][1];
      st.textContent = `Jour ${n} / 80 · Phase : ${ph} · Aujourd’hui : ${s}`;
    }
    $('dayBar').style.width = `${done / 80 * 100}%`;
    $('dayCount').textContent = `${done} jour${done > 1 ? 's' : ''} validé${done > 1 ? 's' : ''} sur 80`;
    $('checkToday').hidden = !(n >= 1 && n <= 80) || !!d.days[n];
    const grid = $('dayGrid'); grid.textContent = '';
    for (let i = 1; i <= 80; i++) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'daycell' + (d.days[i] ? ' done' : '') + (i === n ? ' today' : '');
      b.setAttribute('aria-pressed', d.days[i] ? 'true' : 'false');
      const num = document.createElement('b'); num.textContent = i; b.append(num);
      if (d.startDate) {
        const dt = dayAt(d.startDate, i), small = document.createElement('small');
        small.textContent = SESS[dt.getDay()][0]; b.append(small);
        b.title = `J${i} · ${dt.toLocaleDateString('fr-FR')} · ${SESS[dt.getDay()][1]}`;
      } else b.title = `J${i}`;
      b.addEventListener('click', () => { if (d.days[i]) delete d.days[i]; else d.days[i] = true; persist(); render(); });
      grid.append(b);
    }
  }
  $('start').value = d.startDate;
  $('start').addEventListener('change', (e) => { d.startDate = e.target.value; persist(); render(); });
  $('checkToday').addEventListener('click', () => { const n = todayN(); if (n >= 1 && n <= 80) { d.days[n] = true; persist(); render(); } });
  $('resetDays').addEventListener('click', () => { if (confirm('Décocher tous les jours ?')) { d.days = {}; persist(); render(); } });
  render();
})();
