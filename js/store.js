(() => {
  const KEY = 'j80-data-v2', WK = 'j80-program-tracker-v1', EXP = 'j80-last-export', REMIND_DAYS = 30;
  // workouts : [{ id, date, sessionId, title, minutes, exercises: [{ ex, sets: [{ kg, reps }] }] }]
  // sessions : séances créées par l'utilisateur (voir cleanSession).
  const def = () => ({ workouts: [], sessions: [] });
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const num = (v, a, b) => Number.isFinite(v) && v >= a && v <= b;
  const str = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const CATS = ['force', 'cardio', 'mobilite'];

  function load() {
    try {
      const raw = localStorage.getItem(KEY) || 'null', parsed = JSON.parse(raw) || {}, d = clean(parsed).d;
      // Ancien format (une charge par exercice) : converti une fois, l'original est gardé en copie.
      if (Array.isArray(parsed.loads)) {
        try { if (!localStorage.getItem(KEY + '-legacy')) localStorage.setItem(KEY + '-legacy', raw); } catch (_) {}
        save(d);
      }
      return d;
    } catch (_) { return def(); }
  }
  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (_) { return false; }
  }
  async function exportAll() {
    let weekly = [];
    try { weekly = JSON.parse(localStorage.getItem(WK) || '[]'); } catch (_) {}
    const json = JSON.stringify({ version: 3, ...load(), weekly }, null, 2);
    try { localStorage.setItem(EXP, String(Date.now())); } catch (_) {}
    // iPhone / iPad : la feuille de partage permet « Enregistrer dans Fichiers » (le téléchargement direct est peu fiable en mode app).
    try {
      const file = new File([json], 'j80-sauvegarde.json', { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Sauvegarde Carnet de séances' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' })), a = document.createElement('a');
    a.href = url; a.download = 'j80-sauvegarde.json'; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  const cleanSets = (a) => (Array.isArray(a) ? a : [])
    .filter((s) => s && num(+s.kg, 0, 1000) && num(+s.reps, 1, 500)).slice(0, 50).map((s) => ({ kg: +s.kg, reps: +s.reps }));

  function cleanWorkout(w) {
    if (!w || !DATE.test(w.date || '')) return null;
    const exercises = (Array.isArray(w.exercises) ? w.exercises : [])
      .map((e) => ({ ex: str(e && e.ex, 80), sets: cleanSets(e && e.sets) })).filter((e) => e.ex && e.sets.length).slice(0, 60);
    const out = { id: str(w.id, 40) || uid(), date: w.date, sessionId: str(w.sessionId, 40), title: str(w.title, 80) || 'Séance libre', exercises };
    if (num(+w.minutes, 1, 1000)) out.minutes = Math.round(+w.minutes);
    return out;
  }

  function cleanSession(s) {
    if (!s || !/^[a-z0-9-]{1,40}$/.test(s.id || '') || !str(s.title, 60)) return null;
    const exercises = (Array.isArray(s.exercises) ? s.exercises : []).map((e) => {
      e = e || {};
      return {
        name: str(e.name, 80), sets: num(+e.sets, 1, 20) ? Math.round(+e.sets) : 3, reps: str(e.reps, 20) || '10',
        rest: num(+e.rest, 0, 600) ? Math.round(+e.rest) : 90, log: e.log !== false,
      };
    }).filter((e) => e.name).slice(0, 30);
    if (!exercises.length) return null;
    return { id: s.id, title: str(s.title, 60), category: CATS.includes(s.category) ? s.category : 'force', exercises };
  }

  // Ancien format : une entrée { ex, date, kg, sets, reps, note } devient des séries dans une séance (même date et même note).
  function migrate(loads) {
    const by = new Map();
    loads.forEach((l) => {
      if (!(l && typeof l.ex === 'string' && DATE.test(l.date) && num(+l.kg, 0, 1000) && num(+l.sets, 1, 50) && num(+l.reps, 1, 500))) return;
      const title = str(l.note, 80) || 'Séance', k = l.date + '|' + title;
      if (!by.has(k)) by.set(k, { id: 'm' + str(l.id, 20), date: l.date, sessionId: '', title, exercises: [] });
      const w = by.get(k);
      let e = w.exercises.find((x) => x.ex === l.ex.slice(0, 80));
      if (!e) w.exercises.push(e = { ex: l.ex.slice(0, 80), sets: [] });
      for (let i = 0; i < +l.sets; i++) e.sets.push({ kg: +l.kg, reps: +l.reps });
    });
    return [...by.values()];
  }

  function clean(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('format');
    const d = def();
    const all = (Array.isArray(raw.workouts) ? raw.workouts : []).concat(Array.isArray(raw.loads) ? migrate(raw.loads) : []);
    const seen = new Set();
    all.forEach((w) => { const c = cleanWorkout(w); if (c && !seen.has(c.id)) { seen.add(c.id); d.workouts.push(c); } });
    const ids = new Set();
    (Array.isArray(raw.sessions) ? raw.sessions : []).forEach((s) => { const c = cleanSession(s); if (c && !ids.has(c.id)) { ids.add(c.id); d.sessions.push(c); } });
    return { d, weekly: Array.isArray(raw.weekly) ? raw.weekly : [] };
  }
  function importFile(file, done) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const { d, weekly } = clean(JSON.parse(r.result));
        save(d); localStorage.setItem(WK, JSON.stringify(weekly)); done(true);
      } catch (_) { done(false); }
    };
    r.onerror = () => done(false);
    r.readAsText(file);
  }
  const iso = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  window.J80Store = { load, save, iso, uid, clean, CATS };
  function backupDue() {
    const d = load();
    if (!d.workouts.length && !d.sessions.length) return false;
    let last = 0; try { last = +localStorage.getItem(EXP) || 0; } catch (_) {}
    return Date.now() - last > REMIND_DAYS * 864e5;
  }
  document.addEventListener('DOMContentLoaded', () => {
    const $ = (id) => document.getElementById(id), fb = $('backupFeedback');
    if (!$('exportAll')) return;
    if (backupDue()) fb.textContent = 'Pense à exporter une sauvegarde : aucune depuis plus de 30 jours.';
    $('exportAll').addEventListener('click', exportAll);
    $('importAll').addEventListener('click', () => $('importFile').click());
    $('importFile').addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      if (!confirm('Importer remplace tes données actuelles par celles du fichier. Continuer ?')) { e.target.value = ''; return; }
      importFile(f, (ok) => { if (ok) location.reload(); else fb.textContent = 'Fichier invalide : rien n’a été modifié.'; });
    });
  });
})();
