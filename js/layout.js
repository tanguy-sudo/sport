// Gabarit commun : en-tête, navigation, pied de page et pager. Les métadonnées des pages sont générées dans PAGES.
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
  "charges": {
    "label": "Charges",
    "title": "Journal et évolution",
    "lead": "Retrouve tes séances, ajoute-en à la main et regarde ta progression exercice par exercice."
  },
  "suivi": {
    "label": "Bilan hebdo",
    "title": "Bilan de la semaine",
    "lead": "Tes séances de la semaine sont reprises automatiquement. Note ta récupération et garde un historique."
  },
  "nutrition": {
    "label": "Nutrition",
    "title": "Nutrition : des habitudes simples",
    "lead": "Manger suffisamment pour soutenir les entraînements et la récupération, avec une alimentation variée et flexible. Pas besoin de supprimer des groupes d’aliments ni de compter chaque calorie."
  },
  "recuperation": {
    "label": "Récupération",
    "title": "Récupération et sécurité",
    "lead": "La récupération fait partie intégrante de l’entraînement, au même titre que les séances."
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
    (main || document.body).insertAdjacentHTML(main ? 'afterend' : 'beforeend', '<footer><p>Suivi sportif personnel. Les conseils sont un guide général à adapter à ton état de forme, à ton matériel et à tes éventuelles contraintes médicales. Tes données restent dans le navigateur utilisé.</p></footer>');
  });
})();