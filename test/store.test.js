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

test('iso formate une date locale', () => {
  const { S } = loadStore();
  assert.strictEqual(S.iso(new Date(2026, 0, 5)), '2026-01-05');
});

test('todayNum : null sans date de départ', () => {
  const { S } = loadStore();
  assert.strictEqual(S.todayNum({ startDate: '' }), null);
});

test('todayNum : jour 1 le jour de départ, jour 2 le lendemain', () => {
  const { S } = loadStore();
  const t = new Date();
  assert.strictEqual(S.todayNum({ startDate: S.iso(t) }), 1);
  assert.strictEqual(S.todayNum({ startDate: S.iso(new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1)) }), 2);
});

test('clean rejette un format invalide', () => {
  const { S } = loadStore();
  assert.throws(() => S.clean(null));
  assert.throws(() => S.clean('x'));
});

test('clean filtre jours, dates et charges invalides', () => {
  const { S } = loadStore();
  const { d } = S.clean({
    startDate: '2026-02-30x',
    days: { 1: true, 80: true, 81: true, 0: true, 5: false, abc: true },
    loads: [
      { ex: 'Squat', date: '2026-03-01', kg: 50, sets: 3, reps: 8 },
      { ex: 'Mauvais', date: 'hier', kg: 50, sets: 3, reps: 8 },
      { ex: 'Trop lourd', date: '2026-03-01', kg: 5000, sets: 3, reps: 8 },
      null,
    ],
  });
  assert.strictEqual(d.startDate, '');
  assert.deepStrictEqual(Object.keys(d.days).map(Number).sort((a, b) => a - b), [1, 80]);
  assert.strictEqual(d.loads.length, 1);
  assert.strictEqual(d.loads[0].ex, 'Squat');
});

test('load valide les données stockées corrompues', () => {
  const bad = JSON.stringify({ startDate: 'nope', days: { 999: true }, loads: [{ ex: 1 }] });
  const { S } = loadStore({ 'j80-data-v2': bad });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(S.load())), { startDate: '', days: {}, loads: [] });
});

test('load tolère un JSON illisible', () => {
  const { S } = loadStore({ 'j80-data-v2': '{pas du json' });
  assert.strictEqual(S.load().loads.length, 0);
});

test('save puis load conserve les données valides', () => {
  const { S } = loadStore();
  S.save({ startDate: '2026-01-01', days: { 3: true }, loads: [] });
  const d = S.load();
  assert.strictEqual(d.startDate, '2026-01-01');
  assert.strictEqual(d.days[3], true);
});
