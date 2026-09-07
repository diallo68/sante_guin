import { MongoMemoryReplSet } from 'mongodb-memory-server';

// Démarré une seule fois pour l'ensemble de la suite, sur un port fixe
// repris dans vitest.config.ts (MONGODB_URI). Un replica set à un nœud
// (et non une instance standalone) est nécessaire : la production utilise
// MongoDB Atlas, toujours un replica set, et le code applicatif s'appuie
// sur de vraies transactions (voir appointments/route.ts, B03/B18) qui ne
// fonctionnent pas sur une instance standalone.
let mongod: MongoMemoryReplSet | undefined;

export async function setup() {
  mongod = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
    instanceOpts: [{ port: 27117 }],
  });
  await mongod.waitUntilRunning();
}

export async function teardown() {
  await mongod?.stop();
}
