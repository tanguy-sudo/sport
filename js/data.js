// Chargement mis en cache des fichiers data/*.json.
window.J80Data = (() => {
  const memo = {};
  const get = (name) => memo[name] || (memo[name] = fetch(`data/${name}.json`).then((r) => {
    if (!r.ok) throw new Error(name);
    return r.json();
  }));
  return { get };
})();