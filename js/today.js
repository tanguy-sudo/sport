// Accueil : phases du programme et carte « aujourd’hui ».
(() => {
  const $ = (id) => document.getElementById(id);
  const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
  const S = J80Store, P = J80Plan;

  function renderToday(content) {
    const box = $('today'), d = S.load(), info = P.todayInfo(content, d, S.todayNum(d), new Date());
    const card = el('div', undefined, 'card');
    const link = (href, text, cls) => { const a = el('a', text, 'btn' + (cls ? ' ' + cls : '')); a.href = href; return a; };
    const actions = el('div', undefined, 'actions');
    if (info.state === 'nostart') {
      card.append(el('h3', 'Commence ton défi'), el('p', 'Choisis ta date de départ pour voir ici la séance du jour.', 'muted'));
      actions.append(link('jours.html', 'Choisir ma date de départ'));
    } else if (info.state === 'before') {
      card.append(el('h3', 'Bientôt !'), el('p', `Le programme commence dans ${info.days} jour${info.days > 1 ? 's' : ''}.`, 'muted'));
    } else if (info.state === 'after') {
      card.append(el('h3', 'Défi terminé'), el('p', 'Les 80 jours sont écoulés. Fais ton bilan de forme !', 'muted'));
    } else {
      const { plan, phase, n } = info;
      card.append(el('div', `Jour ${n} / 80${phase ? ' · ' + phase.title : ''}`, 'eyebrow'), el('h3', `${plan.label} — ${plan.detail}`));
      if (info.done) card.append(el('p', 'Jour validé ✓', 'muted'));
      if (plan.session) actions.append(link(`seance.html?s=${plan.session}`, `▶ Ouvrir la séance ${plan.session.toUpperCase()}`));
      if (!info.done) {
        const b = el('button', 'Valider le jour', 'btn secondary'); b.type = 'button';
        b.addEventListener('click', () => { d.days[n] = true; S.save(d); renderToday(content); });
        actions.append(b);
      }
    }
    card.append(actions);
    box.textContent = ''; box.append(el('div', undefined, 'section-head'), card);
    box.firstChild.append(el('h2', 'Aujourd’hui'));
    box.hidden = false;
  }

  J80Data.get('content').then((c) => {
    $('phaseGrid').append(...c.phases.map((p) => {
      const a = el('article', undefined, 'card phase');
      a.append(el('small', `Jours ${p.from}–${p.to}`), el('h3', `${c.phases.indexOf(p) + 1}. ${p.title}`), el('p', p.text));
      return a;
    }));
    renderToday(c);
  }).catch(() => {});
})();