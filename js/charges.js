// Journal des séances : saisie manuelle, historique, courbes d'évolution.
(() => {
  const S = J80Store, L = J80Loads, $ = (id) => document.getElementById(id);
  let d = S.load(), edit = null, undo = null, known = [];
  const fmt = (s) => `${s.slice(8)}/${s.slice(5, 7)}`;
  const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
  const say = (msg) => { $('loadFeedback').textContent = msg; };
  const btn = (text, label, fn) => { const b = el('button', text, 'btn secondary'); b.type = 'button'; b.setAttribute('aria-label', label); b.addEventListener('click', fn); return b; };

  Object.entries(L.METRICS).forEach(([k, m]) => $('metric').append(new Option(m.label, k)));

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

  // --- Courbe ------------------------------------------------------------
  function chart(ex) {
    const box = $('chart'), metric = $('metric').value, m = L.METRICS[metric];
    box.textContent = '';
    const pts = L.series(d.workouts, ex, metric);
    if (pts.length < 2) { box.append(el('p', 'Il faut au moins deux dates pour tracer une courbe.', 'muted small')); return; }
    const sm = L.summary(pts);
    const W = 600, H = 200, P = 36, vals = pts.map((p) => p.value), rmin = Math.min(...vals), rmax = Math.max(...vals);
    const min = rmin === rmax ? rmin - 1 : rmin, max = rmin === rmax ? rmax + 1 : rmax;
    const x = (i) => P + i * (W - 2 * P) / (pts.length - 1), y = (v) => H - P - (v - min) * (H - 2 * P) / (max - min);
    const line = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const dots = pts.map((p, i) => {
      const best = p.value === sm.best;
      return `<circle cx="${x(i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="${best ? 6 : 4}" fill="${best ? 'var(--gold)' : 'var(--accent)'}"><title>${fmt(p.date)} : ${p.value} ${m.unit}${best ? ' (record)' : ''}</title></circle>`;
    }).join('');
    const t = (px, py, anchor, txt) => `<text x="${px}" y="${py}" font-size="12" text-anchor="${anchor}" fill="var(--muted)">${txt}</text>`;
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${m.label} pour ${ex.replace(/"/g, '')}, de ${sm.first} à ${sm.last}" style="width:100%;height:auto"><line x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}" stroke="var(--line)"/><polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round"/>${dots}${t(P, H - 10, 'start', fmt(pts[0].date))}${t(W - P, H - 10, 'end', fmt(pts[pts.length - 1].date))}${t(4, y(rmax) + 4, 'start', rmax)}${rmin !== rmax ? t(4, y(rmin) + 4, 'start', rmin) : ''}</svg>`;
    const sign = sm.delta > 0 ? '+' : '';
    box.append(el('p', `Départ ${sm.first} · dernier ${sm.last} · record ${sm.best} (${sign}${sm.delta} depuis le début)`, 'muted small'));
  }

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
    const f = $('filter'), prev = f.value; f.textContent = '';
    names.forEach((n) => f.append(new Option(n, n)));
    f.value = names.includes(prev) ? prev : (names[names.length - 1] || '');
    $('progress').hidden = !names.length;
    $('undoDelete').hidden = !undo;
    if (names.length) chart(f.value);

    const tb = $('summary'); tb.textContent = '';
    names.forEach((n) => {
      const pts = L.series(d.workouts, n, 'max'), sm = L.summary(pts), last = L.lastSets(d.workouts, n);
      const tr = el('tr'); tr.append(el('td', n), el('td', `${L.fmtSets(last)} (${fmt(pts[pts.length - 1].date)})`), el('td', `${sm.best} kg`), el('td', String(pts.length)));
      tb.append(tr);
    });
    renderHistory();
    const titles = [...new Set(d.workouts.map((w) => w.title).concat(d.sessions.map((s) => s.title)))];
    $('titleList').textContent = ''; $('titleList').append(...titles.map((x) => { const o = el('option'); o.value = x; return o; }));
    const all = new Set(known.concat(names));
    $('exList').textContent = ''; $('exList').append(...[...all].sort().map((x) => { const o = el('option'); o.value = x; return o; }));
  }
  $('filter').addEventListener('change', () => chart($('filter').value));
  $('metric').addEventListener('change', () => chart($('filter').value));
  resetForm();
  render();
  fetch('data/sessions.json').then((r) => r.json()).then((base) => {
    known = base.flatMap((s) => (s.exercises || []).filter((e) => e.log !== false).map((e) => e.name));
    render();
  }).catch(() => {});
})();
