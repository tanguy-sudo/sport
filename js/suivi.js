(() => {
  const $ = (id) => document.getElementById(id);
  const checks = [...document.querySelectorAll('[data-workout]')];
  const week = $('week');
  const storageKey = 'j80-program-tracker-v1';
  let history = [];
  try { history = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch (_) { history = []; }

  function currentRecord() {
    return {
      week: week.value,
      workouts: checks.map(c => ({ id: c.dataset.workout, done: c.checked })),
      sleep: $('sleep').value,
      energy: $('energy').value,
      progression: $('progression').value,
      notes: $('notes').value.trim(),
      date: new Date().toLocaleDateString('fr-FR')
    };
  }
  function updateChecks() {
    const count = checks.filter(c => c.checked).length;
    $('workoutCount').textContent = `${count} séance${count > 1 ? 's' : ''} sur 4 cochée${count > 1 ? 's' : ''}`;
    $('progressBar').style.width = `${count / 4 * 100}%`;
  }
  function renderHistory() {
    const el = $('history');
    if (!history.length) { el.textContent = 'Aucun bilan enregistré pour le moment.'; return; }
    el.innerHTML = '';
    [...history].reverse().forEach((r) => {
      const item = document.createElement('div');
      item.style.cssText = 'padding:12px 0;border-bottom:1px solid var(--line)';
      const done = (r.workouts || []).filter(w => w.done).length;
      const title = document.createElement('strong');
      title.textContent = `Semaine ${r.week} · ${r.date} · ${done}/4 séances`;
      const detail = document.createElement('p');
      detail.className = 'muted small';
      detail.textContent = `Sommeil : ${r.sleep} · Énergie : ${r.energy} · Progression : ${r.progression}${r.notes ? ' · Notes : ' + r.notes : ''}`;
      item.append(title, detail);
      el.appendChild(item);
    });
  }
  checks.forEach(c => c.addEventListener('change', updateChecks));
  $('resetChecks').addEventListener('click', () => { checks.forEach(c => c.checked = false); updateChecks(); });
  $('copyReport').addEventListener('click', async () => {
    const r = currentRecord();
    const workoutNames = {a:'Haut du corps',b:'Cardio endurance',c:'Bas du corps',d:'Cardio et circuit'};
    const text = `BILAN J80 — Semaine ${r.week}\nDate : ${r.date}\nSéances : ${r.workouts.map(w => `${workoutNames[w.id]} : ${w.done ? 'faite' : 'non cochée'}`).join('; ')}\nSommeil : ${r.sleep}\nÉnergie : ${r.energy}\nProgression : ${r.progression}\nNotes : ${r.notes || '—'}`;
    try { await navigator.clipboard.writeText(text); $('feedback').textContent = 'Bilan copié dans le presse-papiers.'; }
    catch (_) { $('feedback').textContent = text; }
  });
  $('saveReport').addEventListener('click', () => {
    const r = currentRecord();
    history = history.filter(old => !(old.week === r.week));
    history.push(r);
    try { localStorage.setItem(storageKey, JSON.stringify(history)); $('feedback').textContent = 'Bilan enregistré dans ce navigateur.'; }
    catch (_) { $('feedback').textContent = 'Impossible d’enregistrer le bilan dans ce navigateur.'; }
    renderHistory();
  });
  $('exportHistory').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'j80-historique.json'; a.click();
    URL.revokeObjectURL(url);
  });
  $('clearHistory').addEventListener('click', () => {
    if (confirm('Effacer tous les bilans enregistrés ?')) {
      history = []; localStorage.removeItem(storageKey); renderHistory(); $('feedback').textContent = 'Historique effacé.';
    }
  });
  updateChecks(); renderHistory();
})();
