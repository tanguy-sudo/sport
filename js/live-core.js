// Logique pure du mode séance (étapes, transitions, rattrapage des minuteurs). Testable sous Node.
(() => {
  const first = (s) => { const m = String(s).match(/\d+/); return m ? +m[0] : ''; };
  const fmt = (sec) => { sec = Math.max(0, sec); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
  const parseKg = (v) => parseFloat(String(v == null ? '' : v).replace(',', '.'));
  const validKg = (kg) => kg >= 0 && kg <= 1000;

  function buildSteps(D) {
    const st = [];
    if (D.warmup) st.push({ k: 'info', title: 'Échauffement', text: D.warmup });
    (D.blocks || []).forEach((b) => st.push({ k: 'timer', title: b.title, sec: b.sec, detail: b.detail || '' }));
    (D.exercises || []).forEach((e) => { for (let i = 1; i <= e.sets; i++) st.push({ k: 'set', ex: e.name, i, n: e.sets, reps: e.reps, rest: e.rest, log: true }); });
    if (D.circuit) {
      for (let t = 1; t <= D.circuit.rounds; t++) {
        D.circuit.exercises.forEach((e, j, a) => st.push({ k: 'set', ex: e.name, sub: `Tour ${t} / ${D.circuit.rounds}`, reps: e.reps, rest: j === a.length - 1 ? 60 : 30, log: false }));
      }
    }
    return st;
  }

  const fresh = (now) => ({ idx: 0, phase: 'work', end: 0, started: now, vals: {}, logged: {} });
  const timerEnd = (step, base) => (step.k === 'timer' ? base + step.sec * 1000 : 0);

  // Étape suivante (base = instant de fin théorique du minuteur écoulé, pour enchaîner sans dérive).
  function next(steps, st, now, base) {
    const i = st.idx + 1;
    if (i >= steps.length) return { finish: { natural: false } };
    return { st: { ...st, idx: i, phase: 'work', end: timerEnd(steps[i], base || now) } };
  }
  // Valide l'étape courante : série faite -> repos ; sinon étape suivante.
  function advance(steps, st, now, base) {
    const s = steps[st.idx];
    if (st.phase === 'work' && s.k === 'set') {
      if (st.idx === steps.length - 1) return { log: s, finish: { natural: true } };
      return { log: s, st: { ...st, phase: 'rest', end: now + s.rest * 1000 } };
    }
    return next(steps, st, now, base);
  }
  function back(steps, st, now) {
    if (st.phase === 'rest') return { ...st, phase: 'work', end: 0 };
    if (st.idx === 0) return st;
    return { ...st, idx: st.idx - 1, phase: 'work', end: timerEnd(steps[st.idx - 1], now) };
  }
  // Rejoue les minuteurs échoués (écran verrouillé, onglet en arrière-plan...).
  function catchUp(steps, st, now) {
    const logs = []; let fired = 0;
    while (st.end && now >= st.end && fired < 60) {
      const r = advance(steps, st, now, st.end); fired++;
      if (r.log) logs.push(r.log);
      if (r.finish) return { st, logs, finish: r.finish, fired };
      st = r.st;
    }
    return { st, logs, finish: null, fired };
  }
  const countSets = (steps, st, natural) =>
    steps.filter((x, i) => x.k === 'set' && (i < st.idx || (i === st.idx && (st.phase === 'rest' || natural)))).length;
  const isResumable = (sv, steps, now) => !!sv && sv.idx < steps.length && now - sv.started < 6 * 36e5;

  const api = { first, fmt, parseKg, validKg, buildSteps, fresh, next, advance, back, catchUp, countSets, isResumable };
  if (typeof module !== 'undefined') module.exports = api; else window.J80LiveCore = api;
})();