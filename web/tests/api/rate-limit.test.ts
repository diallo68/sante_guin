import { describe, it, expect } from 'vitest';
import { POST as login } from '@/app/api/auth/login/route';
import { POST as verifyResetOtp } from '@/app/api/auth/forgot-password/verify/route';
import { createUser, jsonRequest } from '../helpers';

// Régression S13 : aucune limite de tentatives n'existait sur le login —
// un mot de passe pouvait être bruteforcé sans coût. Le compteur est en
// mémoire par processus ; ce fichier de test est isolé des autres pour ne
// pas fausser leurs propres tentatives de connexion.
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
