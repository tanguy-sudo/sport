const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const C = require('../js/live-core.js');
const sessions = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'sessions.json'), 'utf8'));
const by = (id) => sessions.find((s) => s.id === id);

test('fmt et first', () => {
  assert.strictEqual(C.fmt(65), '1:05');
  assert.strictEqual(C.fmt(-3), '0:00');
  assert.strictEqual(C.first('8–10'), 8);
  assert.strictEqual(C.first('max'), '');
});

test('parseKg / validKg', () => {
  assert.strictEqual(C.parseKg('12,5'), 12.5);
  assert.ok(Number.isNaN(C.parseKg('')));
  assert.ok(C.validKg(0));
  assert.ok(!C.validKg(1001));
  assert.ok(!C.validKg(NaN));
});

test('buildSteps : nombre d’étapes par séance', () => {
  assert.strictEqual(C.buildSteps(by('a')).length, 1 + 15); // échauffement + 15 séries
  assert.strictEqual(C.buildSteps(by('b')).length, 3); // 3 blocs
  assert.strictEqual(C.buildSteps(by('c')).length, 1 + 14);
  assert.strictEqual(C.buildSteps(by('d')).length, 10 + 12); // 10 blocs + 3 tours × 4 exercices
});

test('advance : série -> repos -> série suivante', () => {
  const steps = C.buildSteps(by('a'));
  let st = { ...C.fresh(0), idx: 1 };
  let r = C.advance(steps, st, 1000);
  assert.strictEqual(r.log, steps[1]);
  assert.strictEqual(r.st.phase, 'rest');
  assert.strictEqual(r.st.end, 1000 + steps[1].rest * 1000);
  r = C.advance(steps, r.st, 5000); // en repos : étape suivante
  assert.strictEqual(r.st.idx, 2);
  assert.strictEqual(r.st.phase, 'work');
  assert.strictEqual(r.st.end, 0);
});

test('advance : dernière série termine naturellement', () => {
  const steps = C.buildSteps(by('a'));
  const r = C.advance(steps, { ...C.fresh(0), idx: steps.length - 1 }, 1);
  assert.deepStrictEqual(r.finish, { natural: true });
});

test('next : depuis un bloc chronométré, fin à base + durée', () => {
  const steps = C.buildSteps(by('b'));
  const r = C.next(steps, C.fresh(0), 10, 5000);
  assert.strictEqual(r.st.idx, 1);
  assert.strictEqual(r.st.end, 5000 + steps[1].sec * 1000);
  assert.deepStrictEqual(C.next(steps, { ...C.fresh(0), idx: 2 }, 0).finish, { natural: false });
});

test('back : repos -> travail ; étape précédente ; premier pas', () => {
  const steps = C.buildSteps(by('b'));
  assert.strictEqual(C.back(steps, { ...C.fresh(0), idx: 1, phase: 'rest', end: 9 }, 0).phase, 'work');
  const b = C.back(steps, { ...C.fresh(0), idx: 2, end: 1 }, 100);
  assert.strictEqual(b.idx, 1);
  assert.strictEqual(b.end, 100 + steps[1].sec * 1000);
  const first = C.fresh(0);
  assert.strictEqual(C.back(steps, first, 0), first);
});

test('catchUp : rien à faire avant la fin du minuteur', () => {
  const steps = C.buildSteps(by('b'));
  const st = { ...C.fresh(0), end: 10000 };
  const r = C.catchUp(steps, st, 9999);
  assert.strictEqual(r.fired, 0);
  assert.strictEqual(r.st, st);
});

test('catchUp : enchaîne plusieurs blocs échus sans dérive', () => {
  const steps = C.buildSteps(by('b')); // 300 s, 1800 s, 300 s
  const st = { ...C.fresh(0), end: 300000 };
  const r = C.catchUp(steps, st, 300000 + 1800000 + 1);
  assert.strictEqual(r.fired, 1 + 1);
  assert.strictEqual(r.st.idx, 2);
  assert.strictEqual(r.st.end, 300000 + 1800000 + 300000);
});

test('catchUp : termine la séance et liste les séries à enregistrer', () => {
  const steps = C.buildSteps(by('b'));
  const r = C.catchUp(steps, { ...C.fresh(0), idx: 2, end: 1000 }, 5000);
  assert.deepStrictEqual(r.finish, { natural: false });
});

test('catchUp : séance de force, repos échu -> série suivante en attente', () => {
  const steps = C.buildSteps(by('a'));
  const st = { ...C.fresh(0), idx: 1, phase: 'rest', end: 1000 };
  const r = C.catchUp(steps, st, 2000);
  assert.strictEqual(r.st.idx, 2);
  assert.strictEqual(r.st.phase, 'work');
  assert.strictEqual(r.st.end, 0);
});

test('countSets', () => {
  const steps = C.buildSteps(by('a'));
  assert.strictEqual(C.countSets(steps, { ...C.fresh(0), idx: 4, phase: 'work' }, false), 3);
  assert.strictEqual(C.countSets(steps, { ...C.fresh(0), idx: 4, phase: 'rest' }, false), 4);
  assert.strictEqual(C.countSets(steps, { ...C.fresh(0), idx: steps.length - 1 }, true), 15);
});

test('isResumable : < 6 h et index valide', () => {
  const steps = C.buildSteps(by('a'));
  assert.ok(C.isResumable({ idx: 2, started: 0 }, steps, 3600000));
  assert.ok(!C.isResumable({ idx: 2, started: 0 }, steps, 7 * 3600000));
  assert.ok(!C.isResumable({ idx: 99, started: 0 }, steps, 1));
  assert.ok(!C.isResumable(null, steps, 1));
});

test('parcours complet de la séance A jusqu’à la fin', () => {
  const steps = C.buildSteps(by('a'));
  let st = C.fresh(0), now = 0, logged = 0, finished = null;
  for (let i = 0; i < 100 && !finished; i++) {
    const r = C.advance(steps, st, (now += 1000));
    if (r.log) logged += r.log.i === r.log.n ? 1 : 0;
    finished = r.finish; if (r.st) st = r.st;
  }
  assert.deepStrictEqual(finished, { natural: true });
  assert.strictEqual(logged, 6); // une consigne de charge par exercice
});