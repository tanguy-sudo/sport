(() => {
  const $ = (id) => document.getElementById(id), S = J80Store;
  const D = JSON.parse($('sessionData').textContent);
  const KEY = 'j80-live-' + D.id, SND = 'j80-sound';
  const first = (s) => { const m = String(s).match(/\d+/); return m ? +m[0] : ''; };
  const fmt = (sec) => { sec = Math.max(0, sec); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
  const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
  const soundOn = () => { try { return localStorage.getItem(SND) !== '0'; } catch (_) { return true; } };

  function build() {
    const st = [];
    if (D.warmup) st.push({ k: 'info', title: 'Échauffement', text: D.warmup });
    (D.blocks || []).forEach(b => st.push({ k: 'timer', title: b.title, sec: b.sec, detail: b.detail || '' }));
    (D.exercises || []).forEach(e => { for (let i = 1; i <= e.sets; i++) st.push({ k: 'set', ex: e.name, i, n: e.sets, reps: e.reps, rest: e.rest, log: true }); });
    if (D.circuit) for (let t = 1; t <= D.circuit.rounds; t++) D.circuit.exercises.forEach((e, j, a) => st.push({ k: 'set', ex: e.name, sub: `Tour ${t} / ${D.circuit.rounds}`, reps: e.reps, rest: j === a.length - 1 ? 60 : 30, log: false }));
    return st;
  }
  const steps = build();
  let st = null, finished = false, act = {}, lastBeep = -1, wl = null, ac = null;

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (_) {} };
  const clear = () => { try { localStorage.removeItem(KEY); } catch (_) {} };
  const fresh = () => ({ idx: 0, phase: 'work', end: 0, started: Date.now(), vals: {}, logged: {} });

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

  const lastLoad = (ex) => {
    const l = S.load().loads.filter(x => x.ex === ex).sort((a, b) => a.date.localeCompare(b.date));
    return l.length ? l[l.length - 1] : null;
  };
  function logExercise(s) {
    if (!s.log || s.i !== s.n || st.logged[s.ex]) return;
    const v = st.vals[s.ex] || {}, kg = parseFloat(String(v.kg == null ? '' : v.kg).replace(',', '.'));
    if (!(kg >= 0 && kg <= 1000)) return;
    const reps = parseInt(v.reps, 10) || first(s.reps) || 1, d = S.load();
    d.loads.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ex: s.ex, date: S.iso(new Date()), kg, sets: s.n, reps, note: 'Séance ' + D.letter });
    S.save(d); st.logged[s.ex] = 1;
  }

  function go(idx, phase, end) { st.idx = idx; st.phase = phase; st.end = end || 0; lastBeep = -1; save(); render(); }
  function next(base) {
    const i = st.idx + 1;
    if (i >= steps.length) return finish(false);
    const n = steps[i];
    go(i, 'work', n.k === 'timer' ? (base || Date.now()) + n.sec * 1000 : 0);
  }
  function advance(base) {
    const s = steps[st.idx];
    if (st.phase === 'work' && s.k === 'set') {
      logExercise(s);
      if (st.idx === steps.length - 1) return finish(true);
      return go(st.idx, 'rest', Date.now() + s.rest * 1000);
    }
    next(base);
  }
  function back() {
    if (st.phase === 'rest') return go(st.idx, 'work', 0);
    if (st.idx === 0) return;
    const p = steps[st.idx - 1];
    go(st.idx - 1, 'work', p.k === 'timer' ? Date.now() + p.sec * 1000 : 0);
  }

  function tick() {
    if (finished || $('live').hidden) return;
    let guard = 0;
    while (!finished && st.end && Date.now() >= st.end && guard++ < 60) { const e = st.end; if (guard === 1) alarm(); advance(e); }
    if (finished) return;
    $('liveElapsed').textContent = `Durée ${fmt(Math.floor((Date.now() - st.started) / 1000))}`;
    const c = $('liveClock');
    if (c && st.end) {
      const rem = Math.ceil((st.end - Date.now()) / 1000);
      c.textContent = fmt(rem);
      if (rem <= 3 && rem > 0 && rem !== lastBeep) { lastBeep = rem; beep(660, 120); }
    }
  }

  const label = (s) => s.k === 'set' ? s.ex + (s.i ? ` · série ${s.i}/${s.n}` : ` · ${s.sub.toLowerCase()}`) : s.title;
  const target = (r) => 'Objectif : ' + String(r).replace(/^(\d+(?:[–-]\d+)?)/, '$1 reps');

  function render() {
    const s = steps[st.idx], main = $('liveMain'), P = $('livePrimary'), A = $('liveAlt');
    main.textContent = ''; $('liveBack').hidden = false; $('liveBack').parentElement.hidden = false;
    $('liveStep').textContent = `Étape ${st.idx + 1} / ${steps.length}`;
    $('liveProg').style.width = `${st.idx / steps.length * 100}%`;
    const finishAlt = () => { if (confirm('Terminer la séance maintenant ?')) finish(false); };
    $('liveBack').disabled = st.idx === 0 && st.phase === 'work';
    if (st.phase === 'rest') {
      const n = steps[st.idx + 1];
      main.append(el('div', 'Repos', 'live-label'), el('div', fmt(s.rest), 'live-clock rest'), el('div', n ? 'À suivre : ' + label(n) : '', 'live-next'));
      main.querySelector('.live-clock').id = 'liveClock';
      P.textContent = 'Passer le repos'; act.primary = () => next(); 
      A.textContent = '+15 s'; act.alt = () => { st.end += 15000; save(); tick(); };
    } else if (s.k === 'timer') {
      main.append(el('div', 'Bloc chronométré', 'live-label'), el('h2', s.title, 'live-title'), el('div', fmt(s.sec), 'live-clock'), el('div', s.detail, 'live-target'));
      main.querySelector('.live-clock').id = 'liveClock';
      const n = steps[st.idx + 1]; if (n) main.append(el('div', 'À suivre : ' + label(n), 'live-next'));
      P.textContent = 'Bloc suivant →'; act.primary = () => advance();
      A.textContent = '+30 s'; act.alt = () => { st.end += 30000; save(); tick(); };
    } else if (s.k === 'info') {
      main.append(el('div', 'Avant de commencer', 'live-label'), el('h2', s.title, 'live-title'), el('p', s.text, 'live-target'));
      P.textContent = 'C’est parti →'; act.primary = () => advance();
      A.textContent = 'Terminer'; act.alt = finishAlt;
    } else {
      const last = st.idx === steps.length - 1;
      main.append(el('div', s.i ? `Série ${s.i} / ${s.n}` : s.sub, 'live-label'), el('h2', s.ex, 'live-title'), el('div', target(s.reps), 'live-target'));
      if (s.log) {
        const v = st.vals[s.ex] || (st.vals[s.ex] = { kg: '', reps: first(s.reps) }), ll = lastLoad(s.ex);
        if (v.kg === '' && ll) v.kg = ll.kg;
        if (ll) main.append(el('div', `Dernière fois : ${ll.kg} kg · ${ll.sets}×${ll.reps}`, 'live-next'));
        const grid = el('div', undefined, 'live-inputs');
        [['kg', 'Charge (kg)', '0.5', 'decimal'], ['reps', 'Reps faites', '1', 'numeric']].forEach(([key, lab, step, mode]) => {
          const f = el('div', undefined, 'field'), l = el('label', lab, 'field-label'), i = el('input');
          i.type = 'number'; i.min = 0; i.step = step; i.inputMode = mode; i.value = v[key]; i.id = 'live-' + key; l.htmlFor = i.id;
          i.addEventListener('input', () => { v[key] = i.value; save(); });
          f.append(l, i); grid.append(f);
        });
        main.append(grid);
      }
      P.textContent = last ? 'Terminer la séance ✓' : 'Série faite ✓'; act.primary = () => advance();
      A.textContent = 'Terminer'; act.alt = finishAlt;
    }
  }

  function finish(natural) {
    finished = true; clear(); unlock();
    const sets = steps.filter((x, i) => x.k === 'set' && (i < st.idx || (i === st.idx && (st.phase === 'rest' || natural)))).length;
    const mins = Math.max(1, Math.round((Date.now() - st.started) / 60000));
    const d = S.load(), n = S.todayNum(d); let msg = '';
    if (n >= 1 && n <= 80) { d.days[n] = true; S.save(d); msg = `Jour ${n} validé automatiquement.`; }
    const main = $('liveMain'); main.textContent = '';
    main.append(el('div', 'Bien joué', 'live-label'), el('h2', `Séance ${D.letter} terminée 🎉`, 'live-title'),
      el('div', `${mins} min` + (sets ? ` · ${sets} série${sets > 1 ? 's' : ''} faite${sets > 1 ? 's' : ''}` : ''), 'live-target'));
    if (msg) main.append(el('div', msg, 'live-next'));
    const lk = el('a', 'Voir mes charges →', 'live-next'); lk.href = 'charges.html'; main.append(lk);
    $('liveProg').style.width = '100%'; $('liveStep').textContent = 'Terminée';
    $('livePrimary').textContent = 'Fermer'; act.primary = () => location.reload();
    $('liveBack').parentElement.hidden = true;
    if (soundOn()) { beep(660, 150); setTimeout(() => beep(880, 300), 200); }
  }

  function open(state) {
    st = state; finished = false;
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.resume) ac.resume(); } catch (_) {}
    $('live').hidden = false; document.body.classList.add('live-open'); lock();
    if (!st.end && steps[st.idx].k === 'timer' && st.phase === 'work') st.end = Date.now() + steps[st.idx].sec * 1000;
    save(); render(); tick();
  }
  function close() { $('live').hidden = true; document.body.classList.remove('live-open'); unlock(); }

  $('startLive').addEventListener('click', () => {
    if (localStorage.getItem(KEY) && !confirm('Une séance est en cours. La recommencer à zéro ?')) return;
    open(fresh());
  });
  $('resumeLive').addEventListener('click', () => { try { open(JSON.parse(localStorage.getItem(KEY))); } catch (_) { open(fresh()); } });
  $('livePrimary').addEventListener('click', () => act.primary && act.primary());
  $('liveAlt').addEventListener('click', () => act.alt && act.alt());
  $('liveBack').addEventListener('click', back);
  $('liveQuit').addEventListener('click', () => {
    if (finished) return location.reload();
    if (confirm('Quitter la séance ? Ta progression est conservée : tu pourras la reprendre.')) { close(); $('resumeLive').hidden = false; }
  });
  $('liveSound').addEventListener('click', () => { try { localStorage.setItem(SND, soundOn() ? '0' : '1'); } catch (_) {} $('liveSound').textContent = soundOn() ? '🔔' : '🔕'; });
  $('liveSound').textContent = soundOn() ? '🔔' : '🔕';
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !$('live').hidden) { lock(); tick(); } });
  setInterval(tick, 250);
  try { const sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv && sv.idx < steps.length && Date.now() - sv.started < 6 * 36e5) $('resumeLive').hidden = false; else clear(); } catch (_) {}
})();
