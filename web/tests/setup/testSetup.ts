import { afterEach, beforeAll, vi } from 'vitest';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Appointment from '@/models/Appointment';

// `next/headers`'s `cookies()` a besoin du contexte de requête App Router
// (AsyncLocalStorage), indisponible quand un handler de route est appelé
// directement en test, hors cycle de vie d'une vraie requête. Seule la
// lecture est utilisée dans l'app (lib/auth.ts) ; ce mock simule "aucun
// cookie envoyé", ce qui correspond exactement au scénario testé
// (requête sans Authorization ni cookie de session).
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => undefined,
    getAll: () => [],
    has: () => false,
  }),
}));

// lib/rateLimit.ts se connecte à Redis en production (voir audit RA-04) ;
// ioredis-mock simule un vrai serveur Redis en mémoire, partagé par tous
// les clients créés dans ce process de test — les tests exercent ainsi le
// code Redis réel (INCR/PEXPIRE/PTTL) sans dépendre d'un serveur Redis
// installé localement ni d'un service ajouté à la CI.
vi.mock('ioredis', async () => {
  const RedisMock = (await import('ioredis-mock')).default;
  return { default: RedisMock };
});

beforeAll(async () => {
  await connectDB();
  // Les tests de réservation concurrente (B03) dépendent de l'index unique
  // partiel réellement construit en base, pas seulement déclaré dans le
  // schéma — la création d'index par Mongoose est asynchrone.
  await Appointment.syncIndexes();
});

afterEach(async () => {
  // Isole chaque test : la même instance mémoire est partagée par tous les
  // fichiers de test, donc les collections doivent être vidées entre deux
  // tests pour éviter qu'un scénario n'en pollue un autre.
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map(c => c.deleteMany({})));
});
