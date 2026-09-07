// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Apostrophes non échappées dans du JSX préexistant, sur des écrans non
    // revus pour la remédiation de sécurité — voir web/eslint.config.mjs
    // pour le même choix côté web. Avertissement visible, non bloquant.
    rules: {
      'react/no-unescaped-entities': 'warn',
    },
  },
]);
