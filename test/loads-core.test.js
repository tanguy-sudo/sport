const test = require('node:test');
const assert = require('node:assert');
const L = require('../js/loads-core.js');

const loads = [
  { ex: 'Squat', date: '2026-02-01', kg: 60, sets: 3, reps: 8 },
  { ex: 'Squat', date: '2026-02-01', kg: 70, sets: 1, reps: 5 },
  { ex: 'Squat', date: '2026-02-08', kg: 65, sets: 3, reps: 8 },
  { ex: 'Autre', date: '2026-02-02', kg: 10, sets: 3, reps: 10 },
];

test('e1rm (Epley)', () => {
  assert.strictEqual(L.e1rm(100, 1), 100);
  assert.strictEqual(Math.round(L.e1rm(100, 10)), 133);
});

test('series max : une valeur par date, triée', () => {
  assert.deepStrictEqual(L.series(loads, 'Squat', 'max'), [{ date: '2026-02-01', value: 70 }, { date: '2026-02-08', value: 65 }]);
});

test('series volume : somme par date', () => {
  assert.strictEqual(L.series(loads, 'Squat', 'volume')[0].value, 60 * 3 * 8 + 70 * 5);
});

test('series e1rm et métrique inconnue (repli sur max)', () => {
  assert.strictEqual(L.series(loads, 'Squat', 'e1rm')[0].value, Math.round(L.e1rm(70, 5) * 10) / 10);
  assert.strictEqual(L.series(loads, 'Squat', 'nope')[0].value, 70);
});

test('series : exercice inconnu', () => {
  assert.deepStrictEqual(L.series(loads, 'Rien', 'max'), []);
});

test('summary', () => {
  assert.strictEqual(L.summary([]), null);
  assert.deepStrictEqual(L.summary(L.series(loads, 'Squat', 'max')), { first: 70, last: 65, best: 70, delta: -5 });
});