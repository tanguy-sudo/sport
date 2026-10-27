// Éditeur de séances perso : création, modification (?s=<id>) et duplication d'une séance existante (?from=<id>).
(() => {
  const $ = (id) => document.getElementById(id), S = J80Store;
  const params = new URLSearchParams(location.search), editId = params.get('s'), from = params.get('from');
  const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
  let n = 0;

  function field(label, input) {
    const f = el('div', undefined, 'field'), l = el('label', label, 'field-label');
    input.id = 'f' + (++n); l.htmlFor = input.id; f.append(l, input); return f;
  }
  function addRow(e) {
    e = { name: '', sets: 3, reps: '8-10', rest: 90, log: true, ...e };
    const row = el('div', undefined, 'card'), grid = el('div', undefined, 'formgrid');
    row.style.marginBottom = '12px';
    const name = el('input'); name.type = 'text'; name.maxLength = 80; name.value = e.name; name.setAttribute('list', 'exList'); name.dataset.k = 'name';
    const sets = el('input'); sets.type = 'number'; sets.min = 1; sets.max = 20; sets.value = e.sets; sets.inputMode = 'numeric'; sets.dataset.k = 'sets';
    const reps = el('input'); reps.type = 'text'; reps.maxLength = 20; reps.value = e.reps; reps.dataset.k = 'reps';
    const rest = el('input'); rest.type = 'number'; rest.min = 0; rest.max = 600; rest.step = 15; rest.value = e.rest; rest.inputMode = 'numeric'; rest.dataset.k = 'rest';
    const del = el('button', 'Retirer', 'btn secondary'); del.type = 'button';
    del.addEventListener('click', () => { row.remove(); $('addRow').focus(); });
    const log = el('input'); log.type = 'checkbox'; log.checked = e.log !== false; log.dataset.k = 'log';
    const logLabel = el('label', undefined, 'checkitem'); logLabel.append(log, el('span', 'Noter la charge (décocher pour le poids du corps)'));
    const last = el('div', undefined, 'field'); last.style.alignSelf = 'end'; last.append(del);
    grid.append(field('Exercice', name), field('Séries', sets), field('Reps', reps), field('Repos (s)', rest), last);
    row.append(grid, logLabel);
    $('rows').append(row); return name;
  }
  const read = () => [...$('rows').children].map((r) => {
    const v = (k) => r.querySelector(`[data-k="${k}"]`);
    return { name: v('name').value, sets: v('sets').value, reps: v('reps').value, rest: v('rest').value, log: v('log').checked };
  });

  function fill(s) {
    $('title').value = s.title; $('category').value = s.category;
    s.exercises.forEach(addRow);
  }

  $('addRow').addEventListener('click', () => addRow().focus());
  $('save').addEventListener('click', () => {
    const title = $('title').value.trim(), exercises = read().filter((e) => e.name.trim());
    if (!title || !exercises.length) { $('feedback').textContent = 'Donne un nom à la séance et ajoute au moins un exercice.'; return; }
    const d = S.load(), id = editId && d.sessions.some((x) => x.id === editId) ? editId : 'u-' + S.uid();
    const clean = S.clean({ sessions: [{ id, title, category: $('category').value, exercises }] }).d.sessions[0];
    if (!clean) { $('feedback').textContent = 'Séance invalide : vérifie les champs.'; return; }
    d.sessions = d.sessions.filter((x) => x.id !== id).concat(clean);
    if (!S.save(d)) { $('feedback').textContent = 'Impossible d’enregistrer dans ce navigateur.'; return; }
    location.href = 'seance.html?s=' + id;
  });

  fetch('data/sessions.json').then((r) => r.json()).catch(() => []).then((base) => {
    const names = new Set(base.flatMap((s) => (s.exercises || []).map((e) => e.name)));
    S.load().workouts.forEach((w) => w.exercises.forEach((e) => names.add(e.ex)));
    $('exList').append(...[...names].sort().map((x) => { const o = el('option'); o.value = x; return o; }));
    const mine = editId && S.load().sessions.find((x) => x.id === editId), src = base.find((s) => s.id === from);
    if (mine) { $('eTitle').textContent = 'Modifier la séance'; fill(mine); }
    else if (src && src.exercises) { fill({ title: src.title + ' (copie)', category: src.category, exercises: src.exercises }); }
    else addRow();
  });
})();
