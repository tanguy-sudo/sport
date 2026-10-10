(() => {
  const KEY = 'j80-data-v2', WK = 'j80-program-tracker-v1';
  const def = () => ({ startDate: '', days: {}, loads: [] });
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const num = (v, a, b) => Number.isFinite(v) && v >= a && v <= b;
  function load() {
    try { return Object.assign(def(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); }
    catch (_) { return def(); }
  }
  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (_) { return false; }
  }
  function exportAll() {
    let weekly = [];
    try { weekly = JSON.parse(localStorage.getItem(WK) || '[]'); } catch (_) {}
    const blob = new Blob([JSON.stringify({ version: 2, ...load(), weekly }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'j80-sauvegarde.json'; a.click(); URL.revokeObjectURL(url);
  }
  function clean(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('format');
    const d = def();
    if (DATE.test(raw.startDate || '')) d.startDate = raw.startDate;
    Object.keys(raw.days || {}).forEach(k => { const n = +k; if (Number.isInteger(n) && n >= 1 && n <= 80 && raw.days[k]) d.days[n] = true; });
    (Array.isArray(raw.loads) ? raw.loads : []).forEach(l => {
      if (l && typeof l.ex === 'string' && DATE.test(l.date) && num(+l.kg, 0, 1000) && num(+l.sets, 1, 50) && num(+l.reps, 1, 500))
        d.loads.push({ id: String(l.id || Math.random().toString(36).slice(2)), ex: l.ex.slice(0, 80), date: l.date, kg: +l.kg, sets: +l.sets, reps: +l.reps, note: String(l.note || '').slice(0, 120) });
    });
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
  window.J80Store = { load, save, iso };
  document.addEventListener('DOMContentLoaded', () => {
    const $ = (id) => document.getElementById(id), fb = $('backupFeedback');
    if (!$('exportAll')) return;
    $('exportAll').addEventListener('click', exportAll);
    $('importAll').addEventListener('click', () => $('importFile').click());
    $('importFile').addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      if (!confirm('Importer remplace tes données actuelles par celles du fichier. Continuer ?')) { e.target.value = ''; return; }
      importFile(f, (ok) => { if (ok) location.reload(); else fb.textContent = 'Fichier invalide : rien n’a été modifié.'; });
    });
  });
})();
