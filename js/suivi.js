(() => {
  const $ = (id) => document.getElementById(id), S = J80Store, L = J80Loads;
  const week = $('week');
  const storageKey = 'j80-program-tracker-v1';
  let history = [];
  try { history = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch (_) { history = []; }
  const { workouts } = S.load();
  const monday = () => L.mondayOf(week.value || S.iso(new Date()));
  const dfr = (iso) => new Date(iso + 'T00:00').toLocaleDateString('fr-FR');
  const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;
  const summaryText = (st) => `${plural(st.count, 'séance')} · ${plural(st.sets, 'série')} · ${st.volume} kg de volume`;

  function currentRecord() {
    const st = L.weekStats(workouts, monday());
    return {
      week: monday(), sessions: st.count, sets: st.sets, volume: st.volume,
      sleep: $('sleep').value,
      energy: $('energy').value,
      progression: $('progression').value,
      notes: $('notes').value.trim(),
      date: new Date().toLocaleDateString('fr-FR')
    };
  }
  function renderWeek() {
    const m = monday(), st = L.weekStats(workouts, m), end = new Date(m + 'T00:00');
    end.setDate(end.getDate() + 6);
    $('weekRange').textContent = `Du ${dfr(m)} au ${end.toLocaleDateString('fr-FR')}.`;
    $('workoutCount').textContent = summaryText(st);
    const box = $('weekWorkouts'); box.textContent = '';
    st.workouts.sort((a, b) => a.date.localeCompare(b.date)).forEach((w) => {
      const row = document.createElement('div'), t = document.createElement('strong'), p = document.createElement('p');
      row.className = 'loadrow'; p.className = 'muted small';
      t.textContent = w.title;
      p.textContent = `${dfr(w.date)}${w.exercises.length ? ' · ' + plural(w.exercises.length, 'exercice') : ''}${w.minutes ? ' · ' + w.minutes + ' min' : ''}`;
      const info = document.createElement('div'); info.append(t, p); row.append(info); box.append(row);
    });
  }
  function renderHistory() {
    const el = $('history');
    if (!history.length) { el.textContent = 'Aucun bilan enregistré pour le moment.'; return; }
    el.innerHTML = '';
    [...history].reverse().forEach((r) => {
      const item = document.createElement('div');
      item.style.cssText = 'padding:12px 0;border-bottom:1px solid var(--line)';
      const title = document.createElement('strong');
      // Anciens bilans (programme sur 80 jours) : semaine « 1 », « 3-5 », cases cochées.
      if (/^\d{4}-\d{2}-\d{2}$/.test(r.week)) title.textContent = `Semaine du ${dfr(r.week)} · ${plural(r.sessions || 0, 'séance')}${r.volume ? ' · ' + r.volume + ' kg de volume' : ''}`;
      else title.textContent = `Semaine ${r.week} · ${r.date} · ${(r.workouts || []).filter((w) => w.done).length} séances`;
      const detail = document.createElement('p');
      detail.className = 'muted small';
      detail.textContent = `Sommeil : ${r.sleep} · Énergie : ${r.energy} · Progression : ${r.progression}${r.notes ? ' · Notes : ' + r.notes : ''}`;
      item.append(title, detail);
      el.appendChild(item);
    });
  }
  week.value = S.iso(new Date());
  week.addEventListener('change', renderWeek);
  $('copyReport').addEventListener('click', async () => {
    const r = currentRecord();
    const text = `BILAN - Semaine du ${dfr(r.week)}\nSéances : ${plural(r.sessions, 'séance')}, ${plural(r.sets, 'série')}, ${r.volume} kg de volume\nSommeil : ${r.sleep}\nÉnergie : ${r.energy}\nProgression : ${r.progression}\nNotes : ${r.notes || '-'}`;
    try { await navigator.clipboard.writeText(text); $('feedback').textContent = 'Bilan copié dans le presse-papiers.'; }
    catch (_) { $('feedback').textContent = text; }
  });
  $('saveReport').addEventListener('click', () => {
    const r = currentRecord();
    history = history.filter(old => old.week !== r.week);
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
  renderWeek(); renderHistory();
})();
