// Gabarit commun : en-tête, navigation et pager. Les métadonnées des pages sont générées dans PAGES.
(() => {
  const PAGES = {
  "index": {
    "label": "Accueil"
  },
  "seances": {
    "label": "Séances",
    "title": "Les séances",
    "lead": "Tes séances et une bibliothèque d’exemples. Lance une séance pour noter tes poids série par série, ou crée la tienne."
  },
  "journal": {
    "label": "Journal",
    "title": "Journal des séances",
    "lead": "Retrouve tes séances, ajoute-en à la main, modifie-les et sauvegarde tes données."
  },
  "charges": {
    "label": "Charges",
    "title": "Évolution des charges",
    "lead": "Regarde ta progression exercice par exercice."
  },
  "suivi": {
    "label": "Bilan hebdo",
    "title": "Bilan de la semaine",
    "lead": "Tes séances de la semaine sont reprises automatiquement. Note ta récupération et garde un historique."
  }
};  const ORDER = Object.keys(PAGES), id = document.body.dataset.page, me = PAGES[id] || {};
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const href = (k) => `${k}.html`;

  const hero = document.querySelector('header.hero') ? '' :
    `<header class="hero compact"><div class="wrap"><div class="eyebrow">Carnet de séances</div><h1>${esc(me.title || '')}</h1><p>${esc(me.lead || '')}</p></div></header>`;
  const links = ORDER.map((k) => `<a href="${href(k)}"${k === id ? ' class="active" aria-current="page"' : ''}>${esc(PAGES[k].label)}</a>`).join('');
  const nav = `<nav aria-label="Navigation principale"><div class="navinner"><div class="navlinks">${links}</div><button class="theme-toggle" id="themeToggle" type="button" aria-label="Changer de thème">🌙</button></div></nav>`;

  document.body.insertAdjacentHTML('afterbegin', '<a class="skip" href="#main">Aller au contenu</a>');
  document.currentScript.insertAdjacentHTML('beforebegin', hero + nav);

  document.addEventListener('DOMContentLoaded', () => {
    const main = document.getElementById('main');
    if (main && document.body.dataset.pager !== 'off') {
      const i = ORDER.indexOf(id), p = PAGES[ORDER[i - 1]], n = PAGES[ORDER[i + 1]];
      const a = (k, txt) => `<a href="${href(k)}">${txt}</a>`;
      main.insertAdjacentHTML('beforeend', `<div class="pager">${p ? a(ORDER[i - 1], '← ' + esc(p.label)) : '<span></span>'}${n ? a(ORDER[i + 1], esc(n.label) + ' →') : '<span></span>'}</div>`);
    }
  });
})();