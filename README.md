# Carnet de séances

Site statique multi-pages (HTML/CSS/JS vanilla, sans framework), installable (PWA), déployé sur GitHub Pages.

## Architecture

- `js/store.js` : accès aux données (`localStorage`, clé `j80-data-v2`), validation (`clean`), export/import JSON, rappel de sauvegarde (30 jours).
- `data/sessions.json` : contenu des 4 séances (A–D). `seance.html?s=a` les affiche via `js/seance.js`, puis `js/live.js` pilote le mode séance en direct.
- `sw.js` : service worker (cache hors-ligne). Le bloc `@generated` est produit par `scripts/build-sw.js`.

## Développement

```
npm install
npm run build   # régénère VERSION + ASSETS dans sw.js (à lancer avant chaque push)
npm test        # tests node:test (store, données)
npm run lint    # ESLint
```

La CI (`.github/workflows/ci.yml`) lance lint, tests et vérifie que `sw.js` est à jour. Le déploiement reste « Deploy from branch » (Settings → Pages) : chaque push sur `main` publie le site.
