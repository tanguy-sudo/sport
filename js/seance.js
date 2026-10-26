(() => {
  const $ = (id) => document.getElementById(id);
  const id = (new URLSearchParams(location.search).get('s') || 'a').toLowerCase();
  const link = (href, text) => `<a href="${href}">${text}</a>`;
  fetch('data/sessions.json').then((r) => r.json()).then((all) => {
    const i = all.findIndex((s) => s.id === id), s = all[i];
    if (!s) { location.replace('seances.html'); return; }
    const label = `Séance ${s.letter} · ${s.duration}`;
    document.title = `Séance ${s.letter} — J80 · Programme sportif`;
    $('sEyebrow').textContent = label; $('sEyebrow2').textContent = label;
    $('sTitle').textContent = s.title; $('sTitle2').textContent = s.title;
    $('sTags').textContent = s.tags.join(' · ');
    $('sLead').textContent = s.lead;
    $('sTagList').innerHTML = s.tags.map((t) => `<span class="tag">${t}</span>`).join('');
    $('sBody').innerHTML = s.body;
    const p = all[i - 1], n = all[i + 1];
    $('sPager').innerHTML = (p ? link(`seance.html?s=${p.id}`, `← Séance ${p.letter}`) : '<span></span>')
      + link('seances.html', 'Toutes les séances')
      + (n ? link(`seance.html?s=${n.id}`, `Séance ${n.letter} →`) : '<span></span>');
    window.J80Session = s;
    document.head.append(Object.assign(document.createElement('script'), { src: 'js/live.js' }));
  }).catch(() => { $('sTitle').textContent = 'Séance introuvable'; });
})();
