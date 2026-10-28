(() => {
  const $ = (id) => document.getElementById(id);
  const id = (new URLSearchParams(location.search).get('s') || 'a').toLowerCase();
  // Galerie repliable : une paire d'images par exercice connu de la base d'images.
  function gallery(s) {
    if (!window.J80Exo) return;
    const names = [...(s.exercises || []), ...((s.circuit && s.circuit.exercises) || [])].map((e) => e.name)
      .concat((s.blocks || []).map((b) => J80Exo.blockName(b.title)).filter(Boolean));
    J80Exo.ready.then(() => {
      const figs = [...new Set(names)].map((n) => [n, J80Exo.figure(n)]).filter((x) => x[1]);
      if (!figs.length) return;
      const d = document.createElement('details'); d.className = 'exo-gallery';
      const sm = document.createElement('summary'); sm.textContent = 'Voir les exercices'; d.append(sm);
      figs.forEach(([n, f]) => { const h = document.createElement('h4'); h.textContent = n; d.append(h, f); });
      $('sBody').after(d);
    });
  }
  const link = (href, text) => `<a href="${href}">${text}</a>`;
  fetch('data/sessions.json').then((r) => r.json()).then((base) => {
    const all = J80Store.load().sessions.map(J80LiveCore.fromCustom).concat(base);
    const s = all.find((x) => x.id === id);
    if (!s) { location.replace('seances.html'); return; }
    const label = `${s.letter ? 'Séance ' + s.letter : s.custom ? 'Ma séance' : 'Bibliothèque'} · ${s.duration}`;
    if (s.custom) {
      $('sManage').innerHTML = `${link('editeur.html?s=' + s.id, 'Modifier')} <button class="btn secondary" id="delSession" type="button">Supprimer</button>`;
      $('delSession').addEventListener('click', () => {
        if (!confirm('Supprimer cette séance ? Les séances déjà enregistrées dans ton journal sont conservées.')) return;
        const d = J80Store.load(); d.sessions = d.sessions.filter((x) => x.id !== s.id); J80Store.save(d); location.replace('seances.html');
      });
    } else if (s.exercises && !s.circuit && !s.blocks) {
      $('sManage').innerHTML = link('editeur.html?from=' + s.id, 'Dupliquer et modifier');
    }
    $('sManage').querySelectorAll('a').forEach((a) => a.classList.add('btn', 'secondary'));
    document.title = `${J80LiveCore.sessionName(s)} — J80 · Programme sportif`;
    $('sEyebrow').textContent = label; $('sEyebrow2').textContent = label;
    $('sTitle').textContent = s.title; $('sTitle2').textContent = s.title;
    $('sTags').textContent = s.tags.join(' · ');
    $('sLead').textContent = s.lead;
    $('sTagList').innerHTML = s.tags.map((t) => `<span class="tag">${t}</span>`).join('');
    $('sBody').innerHTML = s.body;
    gallery(s);
    const group = all.filter((x) => x.group === s.group), gi = group.indexOf(s), p = group[gi - 1], n = group[gi + 1];
    $('sPager').innerHTML = (p ? link(`seance.html?s=${p.id}`, `← ${J80LiveCore.sessionName(p)}`) : '<span></span>')
      + link('seances.html', 'Toutes les séances')
      + (n ? link(`seance.html?s=${n.id}`, `${J80LiveCore.sessionName(n)} →`) : '<span></span>');
    window.J80Session = s;
    document.head.append(Object.assign(document.createElement('script'), { src: 'js/live.js' }));
  }).catch(() => { $('sTitle').textContent = 'Séance introuvable'; });
})();
