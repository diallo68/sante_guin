import { describe, it, expect } from 'vitest';
import Redis from 'ioredis';
import { POST as login } from '@/app/api/auth/login/route';
import { POST as verifyResetOtp } from '@/app/api/auth/forgot-password/verify/route';
import { rateLimit } from '@/lib/rateLimit';
import { createUser, jsonRequest } from '../helpers';

// Régression S13 : aucune limite de tentatives n'existait sur le login —
// un mot de passe pouvait être bruteforcé sans coût. Le compteur est
// désormais distribué via Redis (voir audit RA-04, régression testée
// ci-dessous) ; ce fichier de test reste isolé des autres pour ne pas
// fausser leurs propres tentatives de connexion.
describe('Rate limiting — login (S13)', () => {
  it('bloque après 10 tentatives échouées sur le même compte', async () => {
    const { email } = await createUser({ password: 'correct-password' });

    const attempt = () => login(jsonRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'wrong-password' }),
    }));

    const results: number[] = [];
    for (let i = 0; i < 11; i++) {
      const res = await attempt();
      results.push(res.status);
    }

    // Les 10 premières sont des échecs d'identifiants (401), la 11e est
    // bloquée par le rate limit (429) avant même de vérifier le mot de passe.
    expect(results.slice(0, 10).every(s => s === 401)).toBe(true);
    expect(results[10]).toBe(429);
  });
});

describe('Rate limiting — vérification OTP réinitialisation (S13)', () => {
  it('bloque après 10 tentatives de code incorrect', async () => {
    const { email } = await createUser();

    const attempt = () => verifyResetOtp(jsonRequest('http://localhost/api/auth/forgot-password/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp: '000000' }),
    }));

    const results: number[] = [];
    for (let i = 0; i < 11; i++) {
      results.push((await attempt()).status);
    }

    expect(results.slice(0, 10).every(s => s === 400)).toBe(true);
    expect(results[10]).toBe(429);
  });
});

// Régression RA-04 : le compteur était une Map en mémoire par processus —
// deux instances de l'app n'auraient pas partagé la même limite. Vérifie
// que rateLimit() passe bien par un client Redis (ici ioredis-mock, voir
// tests/setup/testSetup.ts) plutôt que par le repli en mémoire local.
describe('Rate limiting — backend distribué (RA-04)', () => {
  it('stocke le compteur dans Redis, avec une expiration, plutôt qu\'en mémoire locale', async () => {
    const key = `ra04-test:${Date.now()}`;
    const result = await rateLimit(key, 3, 60_000);
    expect(result.allowed).toBe(true);

    // Un second client Redis, distinct de celui utilisé par rateLimit(),
    // voit la même clé : ioredis-mock simule un serveur partagé, comme un
    // vrai Redis le serait entre plusieurs instances de l'app.
    const inspector = new Redis('redis://127.0.0.1:6399/1');
    const stored = await inspector.get(key);
    const ttl = await inspector.pttl(key);
    expect(stored).toBe('1');
    expect(ttl).toBeGreaterThan(0);
  });

  it('bloque au-delà de la limite, comme le ferait un vrai compteur partagé', async () => {
    const key = `ra04-test-limit:${Date.now()}`;
    const results = await Promise.all([
      rateLimit(key, 2, 60_000),
      rateLimit(key, 2, 60_000),
      rateLimit(key, 2, 60_000),
    ]);
    // Peu importe l'ordre exact sous concurrence : au plus 2 autorisées.
    expect(results.filter(r => r.allowed).length).toBeLessThanOrEqual(2);
    expect(results.some(r => !r.allowed)).toBe(true);
  });
});
