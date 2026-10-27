// Gabarit commun : en-tête, navigation, pied de page et pager. Les métadonnées des pages sont générées dans PAGES.
(() => {
  const PAGES = {
  "index": {
    "label": "Accueil"
  },
  "planning": {
    "label": "Planning",
    "title": "Planning hebdomadaire",
    "lead": "Tu peux déplacer les jours selon ton emploi du temps, en gardant idéalement un jour facile entre les séances exigeantes."
  },
  "seances": {
    "label": "Séances",
    "title": "Les séances",
    "lead": "Les séances du programme et une bibliothèque d’exemples, à piocher selon ton temps, ton matériel et ton énergie."
  },
  "progression": {
    "label": "Progression",
    "title": "Progression sur 80 jours",
    "lead": "Ne cherche pas à augmenter toutes les variables en même temps. La qualité d’exécution passe avant la charge."
  },
  "nutrition": {
    "label": "Nutrition",
    "title": "Nutrition : des habitudes simples",
    "lead": "Manger suffisamment pour soutenir les entraînements et la récupération, avec une alimentation variée et flexible. Pas besoin de supprimer des groupes d’aliments ni de compter chaque calorie."
  },
  "recuperation": {
    "label": "Récupération",
    "title": "Récupération et sécurité",
    "lead": "La récupération fait partie intégrante du programme, au même titre que les séances."
  },
  "suivi": {
    "label": "Bilan hebdo",
    "title": "Suivi hebdomadaire",
    "lead": "Coche les séances et note ta récupération. Les données sont enregistrées localement dans ce navigateur."
  },
  "jours": {
    "label": "80 jours",
    "title": "Suivi jour par jour",
    "lead": "Valide chaque jour du défi et garde le cap, de J1 à J80."
  },
  "charges": {
    "label": "Charges",
    "title": "Suivi des charges",
    "lead": "Note le poids soulevé à chaque séance et regarde ta progression."
  }
};
  const ORDER = Object.keys(PAGES), id = document.body.dataset.page, me = PAGES[id] || {};
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const href = (k) => `${k}.html`;

  const hero = document.querySelector('header.hero') ? '' :
    `<header class="hero compact"><div class="wrap"><div class="eyebrow">J80 · Programme sportif · 80 jours</div><h1>${esc(me.title || '')}</h1><p>${esc(me.lead || '')}</p></div></header>`;
  const links = ORDER.map((k) => `<a href="${href(k)}"${k === id ? ' class="active" aria-current="page"' : ''}>${esc(PAGES[k].label)}</a>`).join('');
  const nav = `<nav aria-label="Navigation principale"><div class="navinner">${links}<button class="theme-toggle" id="themeToggle" type="button" aria-label="Changer de thème">🌙</button></div></nav>`;

  document.body.insertAdjacentHTML('afterbegin', '<a class="skip" href="#main">Aller au contenu</a>');
  document.currentScript.insertAdjacentHTML('beforebegin', hero + nav);

  document.addEventListener('DOMContentLoaded', () => {
    const main = document.getElementById('main');
    if (main && document.body.dataset.pager !== 'off') {
      const i = ORDER.indexOf(id), p = PAGES[ORDER[i - 1]], n = PAGES[ORDER[i + 1]];
      const a = (k, txt) => `<a href="${href(k)}">${txt}</a>`;
      main.insertAdjacentHTML('beforeend', `<div class="pager">${p ? a(ORDER[i - 1], '← ' + esc(p.label)) : '<span></span>'}${n ? a(ORDER[i + 1], esc(n.label) + ' →') : '<span></span>'}</div>`);
    }
    (main || document.body).insertAdjacentHTML(main ? 'afterend' : 'beforeend', '<footer><p>Programme personnel inspiré d’une approche de défi sur 80 jours. Il s’agit d’un guide général à adapter à ton état de forme, à ton matériel et à tes éventuelles contraintes médicales. Les données du suivi restent dans le navigateur utilisé pour cette page.</p></footer>');
  });
})();