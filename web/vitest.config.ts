import { defineConfig } from 'vitest/config';
import path from 'path';

// Suite de tests d'intégration contre une vraie instance MongoDB en
// mémoire (mongodb-memory-server) plutôt que des mocks : les contraintes
// réelles (index uniques, agrégations, validations Mongoose) sont ainsi
// vérifiées telles qu'elles se comportent en production — voir audit
// section 7 ("Aucune suite de régression persistante").
export default defineConfig({
  test: {
    globalSetup: './tests/setup/globalSetup.ts',
    setupFiles: ['./tests/setup/testSetup.ts'],
    environment: 'node',
    testTimeout: 20000,
    hookTimeout: 30000,
    // Tous les fichiers de test partagent la même instance MongoDB en
    // mémoire (un seul port fixe) : les exécuter en parallèle ferait se
    // percuter les `afterEach` de nettoyage d'un fichier avec les tests en
    // cours d'un autre.
    fileParallelism: false,
    // Isolation par fichier : chaque fichier de test obtient sa propre
    // connexion Mongoose vers la même instance mémoire partagée.
    env: {
      MONGODB_URI: 'mongodb://127.0.0.1:27117/mondocteur_test',
      JWT_SECRET: 'test-secret-do-not-use-in-production',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NODE_ENV: 'test',
      // Jamais résolu réellement : 'ioredis' est mocké par ioredis-mock
      // dans tests/setup/testSetup.ts. Juste présent pour que
      // lib/rateLimit.ts construise un client au lieu de retomber sur le
      // repli en mémoire — les tests exercent ainsi le vrai code Redis.
      REDIS_URL: 'redis://127.0.0.1:6399/1',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
