import { describe, it, expect, vi, afterEach } from 'vitest';
import { logError, logWarn } from '@/lib/logger';

// Régression RA-06 : une erreur brute (message Mongoose, réponse Brevo...)
// pouvait citer l'email d'un utilisateur en clair dans les logs.
describe('logError() / logWarn()', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('masque un email présent dans le message d\'une Error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logError('Brevo error:', new Error('invalid recipient patient@example.com'));
    const [, logged] = spy.mock.calls[0];
    expect(logged).toBeInstanceOf(Error);
    expect((logged as Error).message).toBe('invalid recipient [email masqué]');
    expect((logged as Error).message).not.toContain('patient@example.com');
  });

  it('masque un email présent dans une chaîne simple', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logError('Login error:', 'duplicate key: { email: "user@test.local" }');
    expect(spy.mock.calls[0][1]).toBe('duplicate key: { email: "[email masqué]" }');
  });

  it('laisse passer une valeur sans email inchangée', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('Erreur serveur générique');
    logError('X error:', err);
    expect((spy.mock.calls[0][1] as Error).message).toBe('Erreur serveur générique');
  });

  it('logWarn masque un email dans un message simple', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logWarn('[Brevo skipped] To: someone@example.com');
    expect(spy.mock.calls[0][0]).toBe('[Brevo skipped] To: [email masqué]');
  });
});
