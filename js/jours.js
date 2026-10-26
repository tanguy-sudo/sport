(() => {
  const S = J80Store, P = J80Plan, $ = (id) => document.getElementById(id);
  let d = S.load(), content = null, undo = null;
  const persist = () => { if (!S.save(d)) $('status').textContent = 'Impossible d’enregistrer dans ce navigateur.'; };
  const plan = (date) => P.planFor(content.planning.week, date);
  const letter = (p) => (p.session ? p.session.toUpperCase() : '·');

  function render() {
    const n = S.todayNum(d), done = Object.keys(d.days).length;
    const st = $('status');
    if (n === null) st.textContent = 'Choisis ta date de départ pour voir le jour en cours et la séance prévue.';
    else if (n < 1) st.textContent = `Le programme commence dans ${1 - n} jour${1 - n > 1 ? 's' : ''}.`;
    else if (n > 80) st.textContent = 'Les 80 jours sont écoulés. Fais ton bilan de forme !';
    else {
      const ph = P.phaseOf(content.phases, n), p = plan(new Date());
      st.textContent = `Jour ${n} / 80 · Phase : ${ph ? ph.title : '—'} · Aujourd’hui : ${p.label} — ${p.detail}`;
    }
    $('dayBar').style.width = `${done / 80 * 100}%`;
    $('dayCount').textContent = `${done} jour${done > 1 ? 's' : ''} validé${done > 1 ? 's' : ''} sur 80`;
    $('checkToday').hidden = !(n >= 1 && n <= 80) || !!d.days[n];
    $('undoReset').hidden = !undo;
    const grid = $('dayGrid'); grid.textContent = '';
    for (let i = 1; i <= 80; i++) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'daycell' + (d.days[i] ? ' done' : '') + (i === n ? ' today' : '');
      b.setAttribute('aria-pressed', d.days[i] ? 'true' : 'false');
      const num = document.createElement('b'); num.textContent = i; b.append(num);
      let label = `Jour ${i}`;
      if (d.startDate) {
        const dt = P.dateOfDay(d.startDate, i), p = plan(dt), small = document.createElement('small');
        small.textContent = letter(p); b.append(small);
        label = `Jour ${i}, ${dt.toLocaleDateString('fr-FR')}, ${p.label}`;
        b.title = `J${i} · ${dt.toLocaleDateString('fr-FR')} · ${p.label} — ${p.detail}`;
      } else b.title = `J${i}`;
      b.setAttribute('aria-label', label + (d.days[i] ? ', validé' : ', non validé'));
      b.addEventListener('click', () => { if (d.days[i]) delete d.days[i]; else d.days[i] = true; undo = null; persist(); render(); $('dayGrid').children[i - 1].focus(); });
      grid.append(b);
    }
  }

  J80Data.get('content').then((c) => {
    content = c;
    $('start').value = d.startDate;
    $('start').addEventListener('change', (e) => { d.startDate = e.target.value; persist(); render(); });
    $('checkToday').addEventListener('click', () => { const n = S.todayNum(d); if (n >= 1 && n <= 80) { d.days[n] = true; persist(); render(); } });
    $('resetDays').addEventListener('click', () => {
      if (!confirm('Décocher tous les jours ?')) return;
      undo = d.days; d.days = {}; persist(); render();
    });
    $('undoReset').addEventListener('click', () => { if (undo) { d.days = undo; undo = null; persist(); render(); } });
    render();
  }).catch(() => { $('status').textContent = 'Planning indisponible hors connexion.'; });
})();