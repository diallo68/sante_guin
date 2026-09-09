import { defineConfig } from 'vitest/config';
import path from 'path';

// Voir audit RA-11 : aucune suite de tests n'existait, `pnpm test`
// échouait faute de fichiers. Environnement 'node' plutôt qu'un rendu
// React Native complet (qui demanderait un preset dédié, ex. jest-expo) :
// on couvre ici la logique testable indépendamment du rendu — stockage de
// session, client API (intercepteurs), calcul d'horaires — pas les écrans
// eux-mêmes.
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
