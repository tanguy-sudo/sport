// Liste des séances (de base, perso et bibliothèque) avec filtres, à partir de data/sessions.json.
(() => {
  const $ = (id) => document.getElementById(id);
  const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
  const FILTERS = [['all', 'Toutes'], ['force', 'Force'], ['cardio', 'Cardio'], ['mobilite', 'Mobilité'], ['maison', 'À la maison']];
  const matches = (s, f) => f === 'all' || s.category === f || (f === 'maison' && s.home);
  let current = 'all', all = [];

  function card(s) {
    const a = el('article', undefined, 'card session');
    const top = el('div', undefined, 'session-top');
    const eyebrow = el('span', `${s.letter ? 'Séance ' + s.letter : s.custom ? 'Ma séance' : 'Bibliothèque'} · ${s.duration}`, 'eyebrow');
    eyebrow.style.color = 'var(--accent)';
    top.append(eyebrow, el('h3', s.title), ...s.tags.map((t) => el('span', t, 'tag')));
    const body = el('div', undefined, 'session-body');
    const link = el('a', 'Voir la séance →', 'btn'); link.href = `seance.html?s=${s.id}`;
    link.setAttribute('aria-label', `Voir la séance : ${s.title}`);
    const actions = el('div', undefined, 'actions'); actions.append(link);
    body.append(el('p', s.lead), actions);
    a.append(top, body);
    return a;
  }

  function render() {
    let n = 0;
    [['custom', 'gridMine'], ['plan', 'gridPlan'], ['library', 'gridLib']].forEach(([group, gridId]) => {
      const list = all.filter((s) => s.group === group && matches(s, current));
      n += list.length;
      const grid = $(gridId); grid.textContent = ''; grid.append(...list.map(card));
      grid.parentElement.hidden = !list.length && group !== 'custom';
      if (group === 'custom') $('mineEmpty').hidden = !!list.length || current !== 'all';
    });
    $('count').textContent = `${n} séance${n > 1 ? 's' : ''}`;
    [...$('filters').children].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === current)));
  }

  FILTERS.forEach(([f, label]) => {
    const b = el('button', label, 'chip'); b.type = 'button'; b.dataset.f = f;
    b.addEventListener('click', () => { current = f; render(); });
    $('filters').append(b);
  });
  J80Data.get('sessions').then((s) => { all = J80Store.load().sessions.map(J80LiveCore.fromCustom).concat(s); render(); })
    .catch(() => { $('count').textContent = 'Séances indisponibles hors connexion.'; });
})();