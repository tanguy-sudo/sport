const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/'] },
  js.configs.recommended,
  { files: ['js/**/*.js'], languageOptions: { sourceType: 'script', globals: { ...globals.browser, module: 'writable', J80Store: 'readonly', J80Data: 'readonly', J80Plan: 'readonly', J80Loads: 'readonly', J80LiveCore: 'readonly' } } },
  { files: ['sw.js'], languageOptions: { sourceType: 'script', globals: globals.serviceworker } },
  { files: ['scripts/**', 'test/**', 'eslint.config.js'], languageOptions: { sourceType: 'commonjs', globals: globals.node } },
  { rules: { 'no-unused-vars': ['error', { caughtErrors: 'none' }], 'no-empty': ['error', { allowEmptyCatch: true }] } },
];
