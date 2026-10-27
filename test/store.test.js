const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadStore(items = {}) {
  const ls = { ...items };
  const window = {};
  const ctx = {
    window,
    document: { addEventListener() {} },
    localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'store.js'), 'utf8'), ctx);
  return { S: window.J80Store, ls };
}
const plain = (x) => JSON.parse(JSON.stringify(x));

test('iso formate une date locale', () => {
  const { S } = loadStore();
  assert.strictEqual(S.iso(new Date(2026, 0, 5)), '2026-01-05');
});

test('clean rejette un format invalide', () => {
  const { S } = loadStore();
  assert.throws(() => S.clean(null));
  assert.throws(() => S.clean('x'));
});

test('clean filtre séances, séries et dates invalides', () => {
  const { S } = loadStore();
  const { d } = S.clean({
    workouts: [
      { id: 'a', date: '2026-03-01', title: 'Haut', exercises: [
        { ex: 'Squat', sets: [{ kg: 50, reps: 8 }, { kg: 5000, reps: 8 }, { kg: 50, reps: 0 }] },
        { ex: 'Vide', sets: [] },
        { ex: '', sets: [{ kg: 1, reps: 1 }] },
      ] },
      { id: 'b', date: 'hier', exercises: [] },
      { id: 'a', date: '2026-03-02', exercises: [] },
      null,
    ],
  });
  assert.strictEqual(d.workouts.length, 1);
  assert.deepStrictEqual(plain(d.workouts[0].exercises), [{ ex: 'Squat', sets: [{ kg: 50, reps: 8 }] }]);
});

test('clean : une séance sans exercice est conservée (cardio) avec sa durée', () => {
  const { S } = loadStore();
  const { d } = S.clean({ workouts: [{ id: 'c', date: '2026-03-01', title: 'Cardio', minutes: 42, exercises: [] }] });
  assert.strictEqual(d.workouts[0].minutes, 42);
});

test('clean : séances perso valides uniquement', () => {
  const { S } = loadStore();
  const { d } = S.clean({ sessions: [
    { id: 'u-1', title: 'Pecs', category: 'force', exercises: [{ name: 'Développé', sets: 4, reps: '8-10', rest: 90 }] },
    { id: 'Mauvais Id', title: 'x', exercises: [{ name: 'a' }] },
    { id: 'u-2', title: 'Sans exercice', exercises: [] },
    { id: 'u-3', title: 'Cat', category: 'zzz', exercises: [{ name: 'Pompes', log: false }] },
  ] });
  assert.deepStrictEqual(plain(d.sessions.map((s) => s.id)), ['u-1', 'u-3']);
  assert.strictEqual(d.sessions[1].category, 'force');
  assert.deepStrictEqual(plain(d.sessions[1].exercises[0]), { name: 'Pompes', sets: 3, reps: '10', rest: 90, log: false });
});

test('migration : anciennes charges regroupées en séances avec une série par répétition de série', () => {
  const { S } = loadStore();
  const { d } = S.clean({ loads: [
    { id: 'x1', ex: 'Squat', date: '2026-03-01', kg: 60, sets: 3, reps: 8, note: 'Séance C' },
    { id: 'x2', ex: 'Leg curl', date: '2026-03-01', kg: 30, sets: 2, reps: 12, note: 'Séance C' },
    { id: 'x3', ex: 'Squat', date: '2026-03-08', kg: 65, sets: 1, reps: 5 },
    { id: 'x4', ex: 'Mauvais', date: 'hier', kg: 1, sets: 1, reps: 1 },
  ] });
  assert.strictEqual(d.workouts.length, 2);
  assert.strictEqual(d.workouts[0].title, 'Séance C');
  assert.strictEqual(d.workouts[0].exercises[0].sets.length, 3);
  assert.strictEqual(d.workouts[1].title, 'Séance');
});

test('load convertit une fois l ancien format, garde une copie et supprime loads', () => {
  const old = JSON.stringify({ startDate: '2026-01-01', days: { 3: true }, loads: [{ id: 'x1', ex: 'Squat', date: '2026-03-01', kg: 60, sets: 3, reps: 8 }] });
  const { S, ls } = loadStore({ 'j80-data-v2': old });
  assert.strictEqual(S.load().workouts.length, 1);
  assert.strictEqual(ls['j80-data-v2-legacy'], old);
  const saved = JSON.parse(ls['j80-data-v2']);
  assert.ok(!('loads' in saved) && !('days' in saved));
  assert.strictEqual(saved.workouts[0].id, 'mx1');
});

test('load valide les données stockées corrompues', () => {
  const bad = JSON.stringify({ workouts: [{ ex: 1 }], sessions: 'x' });
  const { S } = loadStore({ 'j80-data-v2': bad });
  assert.deepStrictEqual(plain(S.load()), { workouts: [], sessions: [] });
});

test('load tolère un JSON illisible', () => {
  const { S } = loadStore({ 'j80-data-v2': '{pas du json' });
  assert.strictEqual(S.load().workouts.length, 0);
});

test('save puis load conserve les données valides', () => {
  const { S } = loadStore();
  S.save({ workouts: [{ id: 'w1', date: '2026-03-01', title: 'A', exercises: [{ ex: 'Squat', sets: [{ kg: 50, reps: 8 }] }] }], sessions: [] });
  assert.strictEqual(S.load().workouts[0].exercises[0].sets[0].kg, 50);
});