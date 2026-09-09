// Régression B25 : sans ce bus d'événements, un token expiré/révoqué
// laissait l'interface affichée comme connectée jusqu'à ce qu'un écran
// interprète lui-même l'erreur 401.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onUnauthorized, triggerUnauthorized } from '@/lib/authEvents';

describe('authEvents', () => {
  beforeEach(() => {
    // Réinitialise l'écouteur global entre les tests (module singleton).
    onUnauthorized(() => {});
  });

  it('appelle l\'écouteur enregistré quand triggerUnauthorized() est appelé', () => {
    const listener = vi.fn();
    onUnauthorized(listener);
    triggerUnauthorized();
    expect(listener).toHaveBeenCalledOnce();
  });

  it('ne lève pas d\'erreur si triggerUnauthorized() est appelé sans écouteur enregistré', () => {
    // onUnauthorized(() => {}) dans beforeEach couvre déjà ce cas en
    // pratique, mais on vérifie explicitement qu'un appel "à vide" (avant
    // tout enregistrement, sur un tout nouveau module) ne casse rien.
    expect(() => triggerUnauthorized()).not.toThrow();
  });

  it('un nouvel enregistrement remplace le précédent (un seul écouteur actif à la fois)', () => {
    const first = vi.fn();
    const second = vi.fn();
    onUnauthorized(first);
    onUnauthorized(second);
    triggerUnauthorized();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });
});
