import { describe, it, expect, vi, beforeEach } from 'vitest';

// Régression B07 : la promesse de connexion rejetée restait en cache
// indéfiniment, empêchant toute nouvelle tentative après un premier échec
// MongoDB. Testé ici avec un mock complet du module `mongoose` (jamais la
// vraie connexion partagée par le reste de la suite), dans un registre de
// modules isolé.
describe('connectDB — reconnexion après échec (B07)', () => {
  beforeEach(() => {
    vi.resetModules();
    (global as any).mongoose = undefined;
  });

  it('retente une vraie tentative de connexion après un premier échec', async () => {
    let callCount = 0;
    vi.doMock('mongoose', () => ({
      default: {
        connect: vi.fn(() => {
          callCount += 1;
          if (callCount === 1) return Promise.reject(new Error('connexion simulée en échec'));
          return Promise.resolve({ fake: 'connection' });
        }),
      },
    }));

    const { connectDB } = await import('@/lib/db');

    await expect(connectDB()).rejects.toThrow('connexion simulée en échec');
    expect(callCount).toBe(1);

    // Sans le correctif B07, ce second appel réutiliserait la même
    // promesse rejetée sans jamais rappeler mongoose.connect.
    const conn = await connectDB();
    expect(conn).toEqual({ fake: 'connection' });
    expect(callCount).toBe(2);
  });
});
