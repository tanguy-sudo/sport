// Éditeur de séances perso : création, modification (?s=<id>) et duplication d'une séance existante (?from=<id>).
(() => {
  const $ = (id) => document.getElementById(id), S = J80Store;
  const ready = window.J80Exo ? J80Exo.ready : Promise.resolve();
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
    row.append(grid, logLabel, imagePicker(row, name, e.img));
    $('rows').append(row); return name;
  }
  // Image : automatique (d'après le nom), une image de la base, ou une photo importée (réduite en JPEG).
  function imagePicker(row, name, img) {
    const wrap = el('div', undefined, 'imgpick'), sel = el('select'), file = el('input'), prev = el('div', undefined, 'imgpick-prev');
    sel.dataset.k = 'img'; file.type = 'file'; file.accept = 'image/*';
    const opt = (v, t) => { const o = el('option', t); o.value = v; sel.append(o); };
    opt('', 'Image automatique (selon le nom)');
    if (img && img.startsWith('data:')) opt(img, 'Image importée');
    (window.J80Exo ? J80Exo.library() : []).forEach((x) => opt(x.id, x.name));
    sel.value = img || '';
    if (sel.value !== (img || '')) sel.value = '';
    const show = () => {
      prev.textContent = '';
      const f = window.J80Exo && J80Exo.figure(name.value.trim(), sel.value || undefined);
      if (f) prev.append(f);
    };
    sel.addEventListener('change', show); name.addEventListener('change', show);
    file.addEventListener('change', async () => {
      const f = file.files[0]; if (!f) return;
      try {
        const bmp = await createImageBitmap(f), k = Math.min(1, 480 / Math.max(bmp.width, bmp.height)), c = el('canvas');
        c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
        c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
        const url = c.toDataURL('image/jpeg', 0.75);
        [...sel.options].filter((o) => o.value.startsWith('data:')).forEach((o) => o.remove());
        opt(url, 'Image importée'); sel.value = url; show();
      } catch (_) { $('feedback').textContent = 'Image illisible : essaie un autre fichier.'; }
      file.value = '';
    });
    const src = el('p', 'Images de la base : ', 'muted small'), a = el('a', 'free-exercise-db');
    a.href = 'https://yuhonas.github.io/free-exercise-db/'; a.rel = 'noopener'; a.target = '_blank'; src.append(a);
    wrap.append(field('Image', sel), field('Importer une photo', file), src, prev);
    show(); return wrap;
  }
  const read = () => [...$('rows').children].map((r) => {
    const v = (k) => r.querySelector(`[data-k="${k}"]`);
    return { name: v('name').value, sets: v('sets').value, reps: v('reps').value, rest: v('rest').value, log: v('log').checked, img: v('img').value };
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

  Promise.all([fetch('data/sessions.json').then((r) => r.json()).catch(() => []), ready]).then(([base]) => base).then((base) => {
    const names = new Set(base.flatMap((s) => (s.exercises || []).map((e) => e.name)));
    S.load().workouts.forEach((w) => w.exercises.forEach((e) => names.add(e.ex)));
    $('exList').append(...[...names].sort().map((x) => { const o = el('option'); o.value = x; return o; }));
    const mine = editId && S.load().sessions.find((x) => x.id === editId), src = base.find((s) => s.id === from);
    if (mine) { $('eTitle').textContent = 'Modifier la séance'; fill(mine); }
    else if (src && src.exercises) { fill({ title: src.title + ' (copie)', category: src.category, exercises: src.exercises }); }
    else addRow();
  });
})();
