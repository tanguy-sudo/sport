// Régénère VERSION (hash du contenu) et ASSETS dans sw.js.
// `node scripts/build-sw.js` écrit ; `--check` échoue si sw.js n'est pas à jour.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const EXT = /\.(html|css|js|json|webmanifest|png)$/;
const SKIP = new Set(['sw.js', 'package.json', 'package-lock.json', 'eslint.config.js']);
const SKIP_DIRS = new Set(['.git', '.github', 'node_modules', 'scripts', 'test']);

function walk(dir, rel = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(path.join(dir, e.name), r);
    return EXT.test(e.name) && !SKIP.has(r) ? [r] : [];
  });
}

function generate(src) {
  const files = walk(root).sort();
  const hash = crypto.createHash('sha1');
  files.forEach((f) => hash.update(f).update(fs.readFileSync(path.join(root, f)).toString('latin1').replace(/\r\n/g, '\n')));
  const assets = ['./', ...files].map((f) => `  ${JSON.stringify(f)}`).join(',\n');
  const block = `// @generated-start\nconst VERSION = 'j80-${hash.digest('hex').slice(0, 8)}';\nconst ASSETS = [\n${assets}\n];\n// @generated-end`;
  return src.replace(/\/\/ @generated-start[\s\S]*?\/\/ @generated-end/, block);
}

const file = path.join(root, 'sw.js');
const current = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const next = generate(current);
if (process.argv.includes('--check')) {
  if (next !== current) { console.error('sw.js obsolète : lance "npm run build".'); process.exit(1); }
} else {
  fs.writeFileSync(file, next);
  console.log('sw.js mis à jour');
}
