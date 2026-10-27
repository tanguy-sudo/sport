const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pages = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

test('chaque page utilise le gabarit commun', () => {
  assert.ok(pages.length >= 8);
  pages.forEach((f) => {
    const h = read(f);
    assert.match(h, /<body data-page="\w+"/, `${f} : data-page`);
    assert.ok(h.includes('js/layout.js'), `${f} : layout.js`);
    assert.ok(!h.includes('<nav>'), `${f} : nav dupliquée`);
    assert.ok(!h.includes('<footer>'), `${f} : footer dupliqué`);
  });
});

test('tous les liens et scripts locaux existent', () => {
  pages.forEach((f) => {
    [...read(f).matchAll(/(?:href|src)="([^"#:]+?)(?:\?[^"]*)?"/g)].forEach((m) => {
      assert.ok(fs.existsSync(path.join(root, m[1])), `${f} : ${m[1]} introuvable`);
    });
  });
});

test('les scripts utilisés par une page sont chargés dans le bon ordre', () => {
  [['charges', 'charges'], ['index', 'home'], ['suivi', 'suivi'], ['editeur', 'editeur'], ['seances', 'seances'], ['seance', 'seance']].forEach(([p, js]) => {
    const h = read(`${p}.html`), idx = (s) => h.indexOf(s);
    assert.ok(idx('js/store.js') >= 0 && idx('js/store.js') < idx(`js/${js}.js`), p);
  });
});

test('content.json : contenu complet', () => {
  const c = JSON.parse(read('data/content.json'));
  assert.strictEqual(c.nutrition.groups.length, 4);
  assert.strictEqual(c.nutrition.meals.length, 4);
  assert.strictEqual(c.recuperation.cards.length, 4);
});

test('aucun caractère de remplacement (encodage)', () => {
  pages.concat(['js/layout.js', 'data/content.json', 'data/sessions.json']).forEach((f) => assert.ok(!read(f).includes('\uFFFD'), f));
});
test('seance.html contient tous les éléments du mode séance', () => {
  const h = read('seance.html');
  ['live', 'liveStep', 'liveElapsed', 'liveMain', 'liveProg', 'livePrimary', 'liveBack', 'liveAlt', 'liveQuit', 'liveSound', 'startLive', 'resumeLive', 'sPager'].forEach((id) => assert.ok(h.includes(`id="${id}"`), id));
});
test('chaque page a un <head> complet (viewport, CSS, manifeste, PWA)', () => {
  pages.forEach((f) => {
    const h = read(f);
    ['<meta charset="utf-8">', 'name="viewport"', 'css/style.css', 'js/theme.js', 'manifest.webmanifest', 'apple-touch-icon', 'js/pwa.js', '<title>'].forEach((s) => assert.ok(h.includes(s), `${f} : ${s}`));
  });
});