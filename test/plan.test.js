const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const P = require('../js/plan.js');
const content = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'content.json'), 'utf8'));

test('weekIndex : lundi = 0, dimanche = 6', () => {
  assert.strictEqual(P.weekIndex(new Date(2026, 0, 5)), 0); // lundi 5 janvier 2026
  assert.strictEqual(P.weekIndex(new Date(2026, 0, 11)), 6);
});

test('planFor : lundi = séance A, jeudi = C, samedi = D', () => {
  const at = (d) => P.planFor(content.planning.week, new Date(2026, 0, d)).session;
  assert.deepStrictEqual([at(5), at(6), at(7), at(8), at(9), at(10), at(11)], ['a', 'b', null, 'c', null, 'd', null]);
});

test('phases : couvrent J1 à J80 sans trou', () => {
  for (let n = 1; n <= 80; n++) assert.ok(P.phaseOf(content.phases, n), `jour ${n}`);
  assert.strictEqual(P.phaseOf(content.phases, 14).title, 'Reprise structurée');
  assert.strictEqual(P.phaseOf(content.phases, 15).title, 'Progression');
  assert.strictEqual(P.phaseOf(content.phases, 81), null);
});

test('dateOfDay', () => {
  assert.strictEqual(P.dateOfDay('2026-01-31', 2).getMonth(), 1);
  assert.strictEqual(P.dateOfDay('2026-01-31', 1).getDate(), 31);
});

test('todayInfo : états', () => {
  const now = new Date(2026, 0, 5);
  assert.strictEqual(P.todayInfo(content, { startDate: '', days: {} }, null, now).state, 'nostart');
  assert.deepStrictEqual(P.todayInfo(content, { startDate: 'x', days: {} }, -2, now), { state: 'before', days: 3 });
  assert.strictEqual(P.todayInfo(content, { startDate: 'x', days: {} }, 81, now).state, 'after');
  const a = P.todayInfo(content, { startDate: 'x', days: { 1: true } }, 1, now);
  assert.strictEqual(a.state, 'active');
  assert.strictEqual(a.plan.session, 'a');
  assert.strictEqual(a.done, true);
});