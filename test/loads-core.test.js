const test = require('node:test');
const assert = require('node:assert');
const L = require('../js/loads-core.js');

const w = (id, date, ex, sets) => ({ id, date, title: 'T', exercises: [{ ex, sets }] });
const workouts = [
  w('1', '2026-02-01', 'Squat', [{ kg: 60, reps: 8 }, { kg: 70, reps: 5 }]),
  w('2', '2026-02-08', 'Squat', [{ kg: 65, reps: 8 }]),
  w('3', '2026-02-02', 'Autre', [{ kg: 10, reps: 10 }]),
];

test('e1rm (Epley)', () => {
  assert.strictEqual(L.e1rm(100, 1), 100);
  assert.strictEqual(Math.round(L.e1rm(100, 10)), 133);
});

test('series max : une valeur par date, triée', () => {
  assert.deepStrictEqual(L.series(workouts, 'Squat', 'max'), [{ date: '2026-02-01', value: 70 }, { date: '2026-02-08', value: 65 }]);
});

test('series volume : somme des séries par date', () => {
  assert.strictEqual(L.series(workouts, 'Squat', 'volume')[0].value, 60 * 8 + 70 * 5);
});

test('series e1rm et métrique inconnue (repli sur max)', () => {
  assert.strictEqual(L.series(workouts, 'Squat', 'e1rm')[0].value, Math.round(L.e1rm(70, 5) * 10) / 10);
  assert.strictEqual(L.series(workouts, 'Squat', 'nope')[0].value, 70);
});

test('series : exercice inconnu', () => {
  assert.deepStrictEqual(L.series(workouts, 'Rien', 'max'), []);
});

test('summary', () => {
  assert.strictEqual(L.summary([]), null);
  assert.deepStrictEqual(L.summary(L.series(workouts, 'Squat', 'max')), { first: 70, last: 65, best: 70, delta: -5 });
});

test('lastSets : dernière séance contenant l exercice, hors séance exclue', () => {
  assert.deepStrictEqual(L.lastSets(workouts, 'Squat'), [{ kg: 65, reps: 8 }]);
  assert.deepStrictEqual(L.lastSets(workouts, 'Squat', '2').length, 2);
  assert.deepStrictEqual(L.lastSets(workouts, 'Rien'), []);
});

test('exercises : noms distincts', () => {
  assert.deepStrictEqual(L.exercises(workouts), ['Squat', 'Autre']);
});

test('mondayOf', () => {
  assert.strictEqual(L.mondayOf('2026-03-04'), '2026-03-02');
  assert.strictEqual(L.mondayOf('2026-03-02'), '2026-03-02');
  assert.strictEqual(L.mondayOf('2026-03-08'), '2026-03-02');
  assert.strictEqual(L.mondayOf('2026-03-09'), '2026-03-09');
});

test('weekStats : séances, séries et volume de la semaine', () => {
  const s = L.weekStats(workouts, '2026-02-02');
  assert.strictEqual(s.count, 2);
  assert.strictEqual(s.sets, 2);
  assert.strictEqual(s.volume, 65 * 8 + 100);
});

test('fmtSets', () => {
  assert.strictEqual(L.fmtSets([{ kg: 40, reps: 10 }, { kg: 37.5, reps: 8 }]), '40×10, 37,5×8');
});