// Rendu des pages de contenu (nutrition, récupération) à partir de data/content.json.
(() => {
  const el = (tag, text, cls, kids) => {
    const e = document.createElement(tag);
    if (text !== undefined && text !== null) e.textContent = text;
    if (cls) e.className = cls;
    (kids || []).forEach((k) => e.append(k));
    return e;
  };
  const card = (kids, cls) => el('div', null, 'card' + (cls ? ' ' + cls : ''), kids);

  const R = {
    nutrition(c) {
      const icon = (i) => { const d = el('div', i); d.style.fontSize = '1.7rem'; d.setAttribute('aria-hidden', 'true'); return d; };
      const grid = el('div', null, 'grid', c.groups.map((g) => el('article', null, 'card', [icon(g.icon), el('h3', g.title), el('p', g.text)])));
      grid.style.gridTemplateColumns = 'repeat(2,minmax(0,1fr))';
      const mt = el('h3', c.mealsTitle); mt.style.marginTop = '22px';
      const meals = el('div', null, 'meal-grid', c.meals.map((m) => {
        const ic = el('div', m.icon, 'meal-icon'); ic.setAttribute('aria-hidden', 'true');
        return card([ic, el('div', null, null, [el('h3', m.title), el('p', m.text)])], 'meal');
      }));
      const habits = card([el('h3', c.habitsTitle), el('ul', null, null, c.habits.map((x) => el('li', x))), el('p', c.note, 'muted small')]);
      habits.style.marginTop = '14px';
      return [el('section', null, null, [grid, mt, meals, habits])];
    },
    recuperation(c) {
      return [el('section', null, null, [el('div', null, 'phase-grid', c.cards.map((x) => card([el('h3', x.title), el('p', x.text)])))])];
    },
  };

  const page = document.body.dataset.page;
  J80Data.get('content').then((all) => {
    $('content').append(...R[page](all[page]));
  }).catch(() => { $('content').textContent = 'Contenu indisponible hors connexion.'; });
  function $(id) { return document.getElementById(id); }
})();