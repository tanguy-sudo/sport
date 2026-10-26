// Logique pure du planning (utilisable dans le navigateur et dans les tests Node).
(() => {
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  // Lundi = 0 ... dimanche = 6.
  const weekIndex = (date) => (date.getDay() + 6) % 7;
  const planFor = (week, date) => week[weekIndex(date)];
  const phaseOf = (phases, n) => phases.find((p) => n >= p.from && n <= p.to) || null;
  const dateOfDay = (startDate, n) => { const x = parse(startDate); x.setDate(x.getDate() + n - 1); return x; };
  // n = numéro du jour (J1 = date de départ), calculé par J80Store.todayNum.
  function todayInfo(content, data, n, now) {
    if (!data.startDate || n === null) return { state: 'nostart' };
    if (n < 1) return { state: 'before', days: 1 - n };
    if (n > 80) return { state: 'after' };
    return { state: 'active', n, phase: phaseOf(content.phases, n), plan: planFor(content.planning.week, now), done: !!data.days[n] };
  }
  const api = { parse, weekIndex, planFor, phaseOf, dateOfDay, todayInfo };
  if (typeof module !== 'undefined') module.exports = api; else window.J80Plan = api;
})();