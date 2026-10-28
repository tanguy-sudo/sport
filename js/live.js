(() => {
  const $ = (id) => document.getElementById(id), S = J80Store, C = J80LiveCore, L = J80Loads;
  const D = window.J80Session;
  const KEY = 'j80-live-' + D.id, SND = 'j80-sound';
  const { first, fmt } = C;
  const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
  const soundOn = () => { try { return localStorage.getItem(SND) !== '0'; } catch (_) { return true; } };

  const steps = C.buildSteps(D);
  let st = null, finished = false, act = {}, lastBeep = -1, wl = null, ac = null, opener = null;

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (_) {} };
  const clear = () => { try { localStorage.removeItem(KEY); } catch (_) {} };
  // Annonce vocale (lecteurs d'écran) : région aria-live masquée visuellement.
  const announce = (msg) => { $('liveAnnounce').textContent = ''; setTimeout(() => { $('liveAnnounce').textContent = msg; }, 50); };

  function beep(freq, ms) {
    if (!soundOn()) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = freq; g.gain.value = 0.18; o.connect(g); g.connect(ac.destination);
      o.start(); o.stop(ac.currentTime + ms / 1000);
    } catch (_) {}
  }
  const alarm = () => { beep(880, 350); if (soundOn() && navigator.vibrate) navigator.vibrate([200, 100, 200]); };
  async function lock() { try { if ('wakeLock' in navigator) wl = await navigator.wakeLock.request('screen'); } catch (_) {} }
  function unlock() { try { if (wl) wl.release(); } catch (_) {} wl = null; }

  const sk = (s) => s.ex + '#' + s.i;
  // Séance enregistrée au fil des séries : créée au premier enregistrement, retrouvée ensuite grâce à st.wid.
  function workout(d) {
    let w = d.workouts.find((x) => x.id === st.wid);
    if (!w) d.workouts.push(w = { id: st.wid, date: S.iso(new Date(st.started)), sessionId: D.id, title: D.title, exercises: [] });
    return w;
  }
  // Idempotent : refaire une série (bouton Précédent) écrase la valeur précédente.
  function logSet(s) {
    if (!s.log) return;
    const v = st.vals[sk(s)] || {}, kg = C.parseKg(v.kg);
    if (!C.validKg(kg)) return;
    const reps = parseInt(v.reps, 10) || first(s.reps) || 1, d = S.load(), w = workout(d);
    let e = w.exercises.find((x) => x.ex === s.ex);
    if (!e) w.exercises.push(e = { ex: s.ex, sets: [] });
    e.sets[s.i - 1] = { kg, reps };
    S.save(d);
  }

  // Applique le résultat d'une transition de live-core.
  function apply(r) {
    if (r.log) logSet(r.log);
    if (r.finish) return finish(r.finish.natural);
    st = r.st || r; lastBeep = -1; save(); render();
  }
  const go = (r) => apply(r);

  function tick() {
    if (finished || $('live').hidden) return;
    const r = C.catchUp(steps, st, Date.now());
    if (r.fired) {
      alarm(); st = r.st;
      r.logs.forEach(logSet);
      if (r.finish) return finish(r.finish.natural);
      lastBeep = -1; save(); render();
    }
    $('liveElapsed').textContent = `Durée ${fmt(Math.floor((Date.now() - st.started) / 1000))}`;
    const c = $('liveClock');
    if (c && st.end) {
      const rem = Math.ceil((st.end - Date.now()) / 1000);
      c.textContent = fmt(rem);
      if (rem <= 3 && rem > 0 && rem !== lastBeep) { lastBeep = rem; beep(660, 120); }
    }
  }

  const label = (s) => s.k === 'set' ? s.ex + (s.i ? ` · série ${s.i}/${s.n}` : ` · ${s.sub.toLowerCase()}`) : s.title;
  // « 8–10 » -> « 8–10 reps » ; « 30 s » et « 10 / côté » restent lisibles.
  const target = (r) => 'Objectif : ' + String(r).replace(/^(\d+(?:[–-]\d+)?)(?=\s*(?:\/|$))/, '$1 reps');
  let shown = '';
  const pic = (s) => { const f = window.J80Exo && J80Exo.forStep(s); if (f) $('liveMain').append(f); };

  function render() {
    const s = steps[st.idx], main = $('liveMain'), P = $('livePrimary'), A = $('liveAlt');
    main.textContent = ''; $('liveBack').hidden = false; $('liveBack').parentElement.hidden = false;
    $('liveStep').textContent = `Étape ${st.idx + 1} / ${steps.length}`;
    $('liveProg').style.width = `${st.idx / steps.length * 100}%`;
    const finishAlt = () => { if (confirm('Terminer la séance maintenant ?')) go({ finish: { natural: false } }); };
    $('liveBack').disabled = st.idx === 0 && st.phase === 'work';
    if (st.phase === 'rest') {
      const n = steps[st.idx + 1];
      main.append(el('div', 'Repos', 'live-label'), el('div', fmt(s.rest), 'live-clock rest'), el('div', n ? 'À suivre : ' + label(n) : '', 'live-next'));
      pic(n);
      main.querySelector('.live-clock').id = 'liveClock';
      P.textContent = 'Passer le repos'; act.primary = () => go(C.next(steps, st, Date.now()));
      A.textContent = '+15 s'; act.alt = () => { st.end += 15000; save(); tick(); };
    } else if (s.k === 'timer') {
      main.append(el('div', 'Bloc chronométré', 'live-label'), el('h2', s.title, 'live-title'), el('div', fmt(s.sec), 'live-clock'), el('div', s.detail, 'live-target'));
      pic(s);
      main.querySelector('.live-clock').id = 'liveClock';
      const n = steps[st.idx + 1]; if (n) main.append(el('div', 'À suivre : ' + label(n), 'live-next'));
      P.textContent = 'Bloc suivant →'; act.primary = () => go(C.advance(steps, st, Date.now()));
      A.textContent = '+30 s'; act.alt = () => { st.end += 30000; save(); tick(); };
    } else if (s.k === 'info') {
      main.append(el('div', 'Avant de commencer', 'live-label'), el('h2', s.title, 'live-title'), el('p', s.text, 'live-target'));
      P.textContent = 'C’est parti →'; act.primary = () => go(C.advance(steps, st, Date.now()));
      A.textContent = 'Terminer'; act.alt = finishAlt;
    } else {
      const last = st.idx === steps.length - 1;
      main.append(el('div', s.i ? `Série ${s.i} / ${s.n}` : s.sub, 'live-label'), el('h2', s.ex, 'live-title'), el('div', target(s.reps), 'live-target'));
      pic(s);
      if (s.log) {
        const prev = L.lastSets(S.load().workouts, s.ex, st.wid), pv = st.vals[s.ex + '#' + (s.i - 1)], ref = prev[s.i - 1];
        const v = st.vals[sk(s)] || (st.vals[sk(s)] = { kg: '', reps: '' });
        if (v.kg === '') v.kg = pv ? pv.kg : (ref || prev[prev.length - 1] || { kg: '' }).kg;
        if (v.reps === '') v.reps = pv ? pv.reps : (ref ? ref.reps : first(s.reps));
        if (prev.length) main.append(el('div', 'Dernière fois : ' + L.fmtSets(prev), 'live-next'));
        const grid = el('div', undefined, 'live-inputs');
        [['kg', 'Charge (kg)', '0.5', 'decimal'], ['reps', 'Reps faites', '1', 'numeric']].forEach(([key, lab, step, mode]) => {
          const f = el('div', undefined, 'field'), l = el('label', lab, 'field-label'), i = el('input');
          i.type = 'number'; i.min = 0; i.step = step; i.inputMode = mode; i.value = v[key]; i.id = 'live-' + key; l.htmlFor = i.id;
          i.addEventListener('input', () => { v[key] = i.value; save(); });
          f.append(l, i); grid.append(f);
        });
        main.append(grid);
      }
      P.textContent = last ? 'Terminer la séance ✓' : 'Série faite ✓'; act.primary = () => go(C.advance(steps, st, Date.now()));
      A.textContent = 'Terminer'; act.alt = finishAlt;
    }
    // Accessibilité : annonce et focus uniquement lors d'un vrai changement d'étape.
    const key = `${st.idx}:${st.phase}`;
    if (key !== shown) {
      shown = key;
      announce(st.phase === 'rest' ? `Repos ${s.rest} secondes. ${n_(steps[st.idx + 1])}` : `Étape ${st.idx + 1} sur ${steps.length} : ${label(s)}`);
      main.focus({ preventScroll: true });
    }
  }
  const n_ = (n) => (n ? 'À suivre : ' + label(n) : '');

  function finish(natural) {
    finished = true; clear(); unlock();
    const sets = C.countSets(steps, st, natural);
    const mins = Math.max(1, Math.round((Date.now() - st.started) / 60000));
    const d = S.load(), w = d.workouts.find((x) => x.id === st.wid);
    if (w) { w.minutes = mins; S.save(d); } else if (natural || sets) { workout(d).minutes = mins; S.save(d); }
    const main = $('liveMain'); main.textContent = '';
    main.append(el('div', 'Bien joué', 'live-label'), el('h2', `${C.sessionName(D)} terminée 🎉`, 'live-title'),
      el('div', `${mins} min` + (sets ? ` · ${sets} série${sets > 1 ? 's' : ''} faite${sets > 1 ? 's' : ''}` : ''), 'live-target'));
    const lk = el('a', 'Voir mon évolution →', 'live-next'); lk.href = 'charges.html'; main.append(lk);
    $('liveProg').style.width = '100%'; $('liveStep').textContent = 'Terminée';
    $('livePrimary').textContent = 'Fermer'; act.primary = () => location.reload();
    $('liveBack').parentElement.hidden = true;
    announce(`Séance terminée en ${mins} minutes.`);
    main.focus({ preventScroll: true });
    if (soundOn()) { beep(660, 150); setTimeout(() => beep(880, 300), 200); }
  }

  // Le reste de la page est rendu inerte (clavier et lecteurs d'écran) tant que la séance est ouverte.
  const background = () => {
    const out = []; let n = $('live');
    while (n && n !== document.body) { [...n.parentElement.children].forEach((c) => { if (c !== n && c.tagName !== 'SCRIPT') out.push(c); }); n = n.parentElement; }
    return out;
  };
  function open(state) {
    opener = document.activeElement; shown = '';
    st = state; finished = false; if (!st.wid) st.wid = C.fresh(Date.now()).wid;
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.resume) ac.resume(); } catch (_) {}
    $('live').hidden = false; document.body.classList.add('live-open'); lock();
    background().forEach((e) => { e.inert = true; });
    if (!st.end && steps[st.idx].k === 'timer' && st.phase === 'work') st.end = Date.now() + steps[st.idx].sec * 1000;
    save(); render(); tick();
  }
  function close() {
    $('live').hidden = true; document.body.classList.remove('live-open'); unlock();
    background().forEach((e) => { e.inert = false; });
    if (opener && opener.isConnected) opener.focus();
  }

  const main = $('liveMain'); main.tabIndex = -1;
  $('liveStep').setAttribute('aria-hidden', 'true');
  const ann = el('div', undefined, 'sr-only'); ann.id = 'liveAnnounce'; ann.setAttribute('aria-live', 'polite'); ann.setAttribute('role', 'status');
  $('live').append(ann);

  $('startLive').addEventListener('click', () => {
    if (localStorage.getItem(KEY) && !confirm('Une séance est en cours. La recommencer à zéro ?')) return;
    open(C.fresh(Date.now()));
  });
  $('resumeLive').addEventListener('click', () => { try { open(JSON.parse(localStorage.getItem(KEY))); } catch (_) { open(C.fresh(Date.now())); } });
  $('livePrimary').addEventListener('click', () => act.primary && act.primary());
  $('liveAlt').addEventListener('click', () => act.alt && act.alt());
  $('liveBack').addEventListener('click', () => go(C.back(steps, st, Date.now())));
  $('liveQuit').addEventListener('click', () => {
    if (finished) return location.reload();
    if (confirm('Quitter la séance ? Ta progression est conservée : tu pourras la reprendre.')) { close(); $('resumeLive').hidden = false; }
  });
  $('liveQuit').setAttribute('aria-label', 'Quitter la séance');
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('live').hidden) $('liveQuit').click(); });
  const paintSound = () => { $('liveSound').textContent = soundOn() ? '🔔' : '🔕'; $('liveSound').setAttribute('aria-pressed', soundOn() ? 'true' : 'false'); };
  $('liveSound').addEventListener('click', () => { try { localStorage.setItem(SND, soundOn() ? '0' : '1'); } catch (_) {} paintSound(); });
  paintSound();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !$('live').hidden) { lock(); tick(); } });
  setInterval(tick, 250);
  try { const sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (C.isResumable(sv, steps, Date.now())) $('resumeLive').hidden = false; else clear(); } catch (_) {}
})();