// Calculs purs sur les charges (courbes de progression), testables sous Node.
(() => {
  // 1RM estimée (formule d’Epley).
  const e1rm = (kg, reps) => (reps <= 1 ? kg : kg * (1 + reps / 30));
  const round = (v) => Math.round(v * 10) / 10;
  const METRICS = {
    max: { label: 'Charge maximale (kg)', unit: 'kg', value: (l) => l.kg, agg: Math.max },
    e1rm: { label: '1RM estimée (kg)', unit: 'kg', value: (l) => e1rm(l.kg, l.reps), agg: Math.max },
    volume: { label: 'Volume (kg × séries × reps)', unit: 'kg', value: (l) => l.kg * l.sets * l.reps, agg: (a, b) => a + b },
  };
  // Une valeur par date, triée chronologiquement.
  function series(loads, ex, metric) {
    const m = METRICS[metric] || METRICS.max, by = {};
    loads.filter((l) => l.ex === ex).forEach((l) => { by[l.date] = l.date in by ? m.agg(by[l.date], m.value(l)) : m.value(l); });
    return Object.keys(by).sort().map((date) => ({ date, value: round(by[date]) }));
  }
  function summary(points) {
    if (!points.length) return null;
    const vals = points.map((p) => p.value), first = vals[0], last = vals[vals.length - 1];
    return { first, last, best: Math.max(...vals), delta: round(last - first) };
  }
  const api = { e1rm, series, summary, METRICS };
  if (typeof module !== 'undefined') module.exports = api; else window.J80Loads = api;
})();