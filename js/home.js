// Accueil : stats de la semaine et dernières séances.
(() => {
  const $ = (id) => document.getElementById(id), S = J80Store, L = J80Loads;
  const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
  const { workouts } = S.load(), st = L.weekStats(workouts, L.mondayOf(S.iso(new Date())));
  [[st.count, st.count > 1 ? 'séances' : 'séance'], [st.sets, st.sets > 1 ? 'séries' : 'série'], [st.volume, 'kg de volume']].forEach(([n, label]) => {
    const c = el('div', undefined, 'card'); c.append(el('div', String(n), 'stat'), el('div', label, 'stat-label')); $('weekStats').append(c);
  });
  const recent = [...workouts].reverse().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  if (!recent.length) return;
  const box = $('recent'); box.textContent = '';
  recent.forEach((w) => {
    const row = el('div', undefined, 'loadrow'), info = el('div');
    const detail = w.exercises.length ? `${w.exercises.length} exercice${w.exercises.length > 1 ? 's' : ''}` : 'sans détail';
    info.append(el('strong', w.title), el('p', `${new Date(w.date + 'T00:00').toLocaleDateString('fr-FR')} · ${detail}${w.minutes ? ' · ' + w.minutes + ' min' : ''}`, 'muted small'));
    row.append(info); box.append(row);
  });
})();
