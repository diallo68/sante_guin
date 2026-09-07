import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['tests/**', 'scripts/**', '.next/**', 'node_modules/**'],
  },
  {
    // Le code existant contient ~100 occurrences de `any` et d'apostrophes
    // non échappées dans du JSX, accumulées avant qu'ESLint ne soit
    // configuré (voir audit, section "ESLint... configurations absentes").
    // Les corriger une à une dépasse le cadre de la remédiation de
    // sécurité et risquerait d'introduire des régressions non liées dans
    // des dizaines de fichiers non revus pour cette PR. Ces deux règles
    // restent actives en avertissement (visibles, non bloquantes) le
    // temps d'un nettoyage dédié ; toutes les autres règles Next/React
    // (hooks, a11y, next/image...) restent bloquantes.
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
];

export default eslintConfig;
