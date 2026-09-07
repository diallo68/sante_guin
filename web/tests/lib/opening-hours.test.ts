import { describe, it, expect, vi, afterEach } from 'vitest';
import { isCurrentlyOpen } from '@/lib/openingHours';

// Régression B27 : l'heure locale du navigateur/serveur de test était
// utilisée telle quelle (faux résultat hors fuseau Africa/Conakry), et un
// horaire traversant minuit (ex. 20:00 → 02:00) rendait la condition
// toujours fausse.
describe('isCurrentlyOpen (B27)', () => {
  afterEach(() => vi.useRealTimers());

  function mockConakryTime(isoUtc: string) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(isoUtc));
  }

  it('24h/24 est toujours ouvert', () => {
    expect(isCurrentlyOpen(undefined, undefined, true)).toBe(true);
  });

  it('renvoie faux si les horaires sont absents', () => {
    expect(isCurrentlyOpen(undefined, '18:00', false)).toBe(false);
    expect(isCurrentlyOpen('08:00', undefined, false)).toBe(false);
  });

  it('ouvert pendant la plage normale (Africa/Conakry = UTC toute l\'année)', () => {
    // 10:00 UTC == 10:00 Africa/Conakry (pas de décalage, pas d'heure d'été).
    mockConakryTime('2026-06-15T10:00:00Z');
    expect(isCurrentlyOpen('08:00', '18:00', false)).toBe(true);
  });

  it('fermé avant l\'ouverture et après la fermeture', () => {
    mockConakryTime('2026-06-15T06:00:00Z');
    expect(isCurrentlyOpen('08:00', '18:00', false)).toBe(false);

    mockConakryTime('2026-06-15T19:00:00Z');
    expect(isCurrentlyOpen('08:00', '18:00', false)).toBe(false);
  });

  // Avant B27 : `current >= open*60 && current < close*60` était toujours
  // faux dès que la fermeture était numériquement avant l'ouverture.
  it('gère un horaire traversant minuit (20:00 → 02:00)', () => {
    mockConakryTime('2026-06-15T23:00:00Z'); // 23h, dans la plage 20h-2h
    expect(isCurrentlyOpen('20:00', '02:00', false)).toBe(true);

    mockConakryTime('2026-06-15T01:00:00Z'); // 1h du matin, toujours ouvert
    expect(isCurrentlyOpen('20:00', '02:00', false)).toBe(true);

    mockConakryTime('2026-06-15T10:00:00Z'); // 10h, en dehors de la plage
    expect(isCurrentlyOpen('20:00', '02:00', false)).toBe(false);
  });
});
