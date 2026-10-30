// Journal des séances : saisie manuelle, historique, modification et suppression.
(() => {
  const S = J80Store, L = J80Loads, $ = (id) => document.getElementById(id);
  let d = S.load(), edit = null, undo = null, known = [];
  const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
  const say = (msg) => { $('loadFeedback').textContent = msg; };
  const btn = (text, label, fn) => { const b = el('button', text, 'btn secondary'); b.type = 'button'; b.setAttribute('aria-label', label); b.addEventListener('click', fn); return b; };

  // --- Saisie des séries -------------------------------------------------
  function addSetRow(kg, reps) {
    const rows = $('setRows'), i = rows.children.length + 1, row = el('div', undefined, 'setrow');
    const mk = (label, v, step, mode, max) => {
      const f = el('div', undefined, 'field'), l = el('label', label, 'field-label'), inp = el('input');
      inp.type = 'number'; inp.min = 0; inp.max = max; inp.step = step; inp.inputMode = mode; inp.value = v;
      inp.id = `set${i}-${label}`; l.htmlFor = inp.id; l.className = 'field-label sr-only'; l.textContent = `Série ${i} : ${label}`;
      f.append(l, inp); return f;
    };
    row.append(el('strong', `Série ${i}`, 'setnum'), mk('kg', kg, '0.5', 'decimal', 1000), mk('reps', reps, '1', 'numeric', 500));
    const del = btn('Retirer', `Retirer la série ${i}`, () => { row.remove(); renumber(); });
    row.append(del); rows.append(row);
  }
  function renumber() {
    [...$('setRows').children].forEach((row, i) => {
      row.querySelector('.setnum').textContent = `Série ${i + 1}`;
      row.querySelector('button').setAttribute('aria-label', `Retirer la série ${i + 1}`);
    });
  }
  const readSets = () => [...$('setRows').children].map((r) => {
    const [kg, reps] = r.querySelectorAll('input');
    return { kg: parseFloat(kg.value.replace(',', '.')), reps: parseInt(reps.value, 10) };
  });
  function fillSets(sets) {
    $('setRows').textContent = '';
    (sets.length ? sets : [{ kg: '', reps: '' }, { kg: '', reps: '' }, { kg: '', reps: '' }]).forEach((s) => addSetRow(s.kg, s.reps));
  }
  $('addSet').addEventListener('click', () => {
    const rows = [...$('setRows').children], last = rows.length ? rows[rows.length - 1].querySelectorAll('input') : [];
    addSetRow(last[0] ? last[0].value : '', last[1] ? last[1].value : '');
    $('setRows').lastElementChild.querySelector('input').focus();
  });
  // Préremplit avec la dernière séance de cet exercice, tant que rien n'a été saisi.
  $('ex').addEventListener('change', () => {
    if (edit || readSets().some((s) => s.kg >= 0)) return;
    fillSets(L.lastSets(d.workouts, $('ex').value.trim()));
  });

  function resetForm() {
    edit = null; $('formTitle').textContent = 'Ajouter un exercice à une séance';
    $('date').value = S.iso(new Date()); $('ex').value = ''; $('title').value = '';
    fillSets([]); $('addLoad').textContent = 'Enregistrer'; $('cancelEdit').hidden = true;
  }
  function startEdit(w, e) {
    edit = { wid: w.id, ex: e.ex };
    $('formTitle').textContent = 'Modifier un exercice';
    $('ex').value = e.ex; $('date').value = w.date; $('title').value = w.title; fillSets(e.sets);
    $('addLoad').textContent = 'Mettre à jour'; $('cancelEdit').hidden = false;
    say('Modification en cours.'); $('ex').scrollIntoView({ block: 'center' }); $('ex').focus();
  }
  // Retire un exercice d'une séance ; la séance disparaît si elle devient vide (hors cardio avec durée).
  function removeExercise(wid, ex) {
    const w = d.workouts.find((x) => x.id === wid); if (!w) return;
    w.exercises = w.exercises.filter((e) => e.ex !== ex);
    if (!w.exercises.length && !w.minutes) d.workouts = d.workouts.filter((x) => x.id !== wid);
  }
  function addExercise(date, title, ex, sets) {
    let w = d.workouts.find((x) => x.date === date && x.title === title);
    if (!w) d.workouts.push(w = { id: S.uid(), date, sessionId: '', title, exercises: [] });
    const e = w.exercises.find((x) => x.ex === ex);
    if (e) e.sets.push(...sets); else w.exercises.push({ ex, sets });
  }

  $('addLoad').addEventListener('click', () => {
    const ex = $('ex').value.trim().slice(0, 80), date = $('date').value, title = $('title').value.trim().slice(0, 80) || 'Séance libre';
    const sets = readSets().filter((s) => s.kg >= 0 || s.reps >= 1);
    if (!ex || !date || !sets.length || sets.some((s) => !(s.kg >= 0 && s.kg <= 1000) || !(s.reps >= 1 && s.reps <= 500))) {
      say('Vérifie l’exercice, la date, et la charge (kg) et les répétitions de chaque série.'); return;
    }
    if (edit) removeExercise(edit.wid, edit.ex);
    const wasEdit = !!edit;
    addExercise(date, title, ex, sets);
    const ok = S.save(d);
    resetForm(); undo = null; say(ok ? (wasEdit ? 'Modifié.' : 'Enregistré.') : 'Impossible d’enregistrer dans ce navigateur.'); render();
  });
  $('cancelEdit').addEventListener('click', () => { resetForm(); say(''); });
  $('undoDelete').addEventListener('click', () => {
    if (!undo) return;
    d.workouts = d.workouts.filter((x) => x.id !== undo.id).concat(undo); undo = null; S.save(d); say('Séance restaurée.'); render();
  });
  const afterDelete = (w) => { undo = JSON.parse(JSON.stringify(w)); S.save(d); if (edit) resetForm(); say('Supprimé.'); render(); $('undoDelete').focus(); };

  function renderHistory() {
    const h = $('history'); h.textContent = '';
    const list = [...d.workouts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
    if (!list.length) { h.textContent = 'Aucune séance enregistrée pour le moment.'; return; }
    list.forEach((w) => {
      const date = new Date(w.date + 'T00:00').toLocaleDateString('fr-FR');
      const head = el('div', undefined, 'loadrow'), info = el('div');
      info.append(el('strong', w.title), el('p', date + (w.minutes ? ` · ${w.minutes} min` : ''), 'muted small'));
      head.append(info, btn('Supprimer la séance', `Supprimer la séance ${w.title} du ${date}`, () => { d.workouts = d.workouts.filter((x) => x.id !== w.id); afterDelete(w); }));
      h.append(head);
      w.exercises.forEach((e) => {
        const row = el('div', undefined, 'loadrow'), txt = el('div'), btns = el('div', undefined, 'actions');
        row.style.paddingLeft = '16px'; btns.style.marginTop = '0';
        txt.append(el('span', e.ex), el('p', L.fmtSets(e.sets), 'muted small'));
        btns.append(
          btn('Modifier', `Modifier ${e.ex} du ${date}`, () => startEdit(w, e)),
          btn('Supprimer', `Supprimer ${e.ex} du ${date}`, () => { const snap = JSON.parse(JSON.stringify(w)); removeExercise(w.id, e.ex); afterDelete(snap); }));
        row.append(txt, btns); h.append(row);
      });
    });
  }

  function render() {
    const names = L.exercises([...d.workouts].sort((a, b) => a.date.localeCompare(b.date)));
    $('undoDelete').hidden = !undo;
    renderHistory();
    const titles = [...new Set(d.workouts.map((w) => w.title).concat(d.sessions.map((s) => s.title)))];
    $('titleList').textContent = ''; $('titleList').append(...titles.map((x) => { const o = el('option'); o.value = x; return o; }));
    const all = new Set(known.concat(names));
    $('exList').textContent = ''; $('exList').append(...[...all].sort().map((x) => { const o = el('option'); o.value = x; return o; }));
  }
  resetForm();
  render();
  fetch('data/sessions.json').then((r) => r.json()).then((base) => {
    known = base.flatMap((s) => (s.exercises || []).filter((e) => e.log !== false).map((e) => e.name));
    render();
  }).catch(() => {});
})();
