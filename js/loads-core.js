// Calculs purs sur les séances enregistrées (courbes d'évolution, dernières séries, stats hebdo), testables sous Node.
(() => {
  // 1RM estimée (formule d’Epley).
  const e1rm = (kg, reps) => (reps <= 1 ? kg : kg * (1 + reps / 30));
  const round = (v) => Math.round(v * 10) / 10;
  // Chaque valeur est calculée sur une série { kg, reps } ; agg combine les séries d'une même date.
  const METRICS = {
    max: { label: 'Charge maximale (kg)', unit: 'kg', value: (s) => s.kg, agg: Math.max },
    e1rm: { label: '1RM estimée (kg)', unit: 'kg', value: (s) => e1rm(s.kg, s.reps), agg: Math.max },
    volume: { label: 'Volume (kg × reps)', unit: 'kg', value: (s) => s.kg * s.reps, agg: (a, b) => a + b },
  };
  const setsOf = (workouts, ex) => workouts.flatMap((w) => w.exercises.filter((e) => e.ex === ex).flatMap((e) => e.sets.map((s) => ({ ...s, date: w.date }))));
  // Une valeur par date, triée chronologiquement.
  function series(workouts, ex, metric) {
    const m = METRICS[metric] || METRICS.max, by = {};
    setsOf(workouts, ex).forEach((s) => { by[s.date] = s.date in by ? m.agg(by[s.date], m.value(s)) : m.value(s); });
    return Object.keys(by).sort().map((date) => ({ date, value: round(by[date]) }));
  }
  function summary(points) {
    if (!points.length) return null;
    const vals = points.map((p) => p.value), first = vals[0], last = vals[vals.length - 1];
    return { first, last, best: Math.max(...vals), delta: round(last - first) };
  }
  // Séries de la dernière séance (hors excludeId) qui contient cet exercice.
  function lastSets(workouts, ex, excludeId) {
    const l = workouts.filter((w) => w.id !== excludeId && w.exercises.some((e) => e.ex === ex))
      .map((w, i) => ({ w, i })).sort((a, b) => a.w.date.localeCompare(b.w.date) || a.i - b.i);
    return l.length ? l[l.length - 1].w.exercises.find((e) => e.ex === ex).sets : [];
  }
  const exercises = (workouts) => [...new Set(workouts.flatMap((w) => w.exercises.map((e) => e.ex)))];
  // Lundi de la semaine d'une date « YYYY-MM-DD », au même format.
  function mondayOf(iso) {
    const [y, m, d] = iso.split('-').map(Number), t = new Date(Date.UTC(y, m - 1, d));
    t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
    return t.toISOString().slice(0, 10);
  }
  function weekStats(workouts, monday) {
    const w = workouts.filter((x) => mondayOf(x.date) === monday), all = w.flatMap((x) => x.exercises.flatMap((e) => e.sets));
    return { workouts: w, count: w.length, sets: all.length, volume: Math.round(all.reduce((a, s) => a + s.kg * s.reps, 0)) };
  }
  // « 40×10, 40×10, 37,5×8 »
  const fmtSets = (sets) => sets.map((s) => `${String(s.kg).replace('.', ',')}×${s.reps}`).join(', ');
  const api = { e1rm, series, summary, lastSets, exercises, mondayOf, weekStats, fmtSets, METRICS };
  if (typeof module !== 'undefined') module.exports = api; else window.J80Loads = api;
})();
