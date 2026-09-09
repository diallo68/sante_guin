// Régression B27 : l'heure locale de l'appareil (au lieu du fuseau
// Africa/Conakry) et les horaires traversant minuit donnaient un statut
// ouvert/fermé faux. On fixe l'horloge système à une heure connue plutôt
// que de dépendre de l'heure réelle au moment du test.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { isCurrentlyOpen } from '@/lib/openingHours';

// Toutes les dates ci-dessous sont exprimées en UTC ; Africa/Conakry n'a
// pas d'heure d'été et est à UTC+0, donc l'heure UTC = l'heure de Conakry.
function setNowUTC(hour: number, minute: number) {
  vi.setSystemTime(new Date(Date.UTC(2026, 0, 15, hour, minute, 0)));
}

describe('isCurrentlyOpen()', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('toujours ouvert quand isOpen24h est vrai, quelle que soit l\'heure', () => {
    vi.useFakeTimers();
    setNowUTC(3, 0);
    expect(isCurrentlyOpen('09:00', '18:00', true)).toBe(true);
  });

  it('fermé si les horaires sont absents', () => {
    expect(isCurrentlyOpen(undefined, undefined, false)).toBe(false);
    expect(isCurrentlyOpen('09:00', undefined, false)).toBe(false);
  });

  it('fermé si les horaires sont mal formés', () => {
    expect(isCurrentlyOpen('abc', '18:00', false)).toBe(false);
  });

  it('ouvert pendant la plage normale (ex. 09:00–18:00, à 12:00)', () => {
    vi.useFakeTimers();
    setNowUTC(12, 0);
    expect(isCurrentlyOpen('09:00', '18:00', false)).toBe(true);
  });

  it('fermé avant l\'ouverture et après la fermeture (plage normale)', () => {
    vi.useFakeTimers();
    setNowUTC(8, 0);
    expect(isCurrentlyOpen('09:00', '18:00', false)).toBe(false);

    setNowUTC(19, 0);
    expect(isCurrentlyOpen('09:00', '18:00', false)).toBe(false);
  });

  // Régression B27 : une plage traversant minuit (ex. 20:00 → 02:00)
  // rendait `current >= open && current < close` toujours fausse.
  it('ouvert sur une plage traversant minuit, avant minuit (ex. 20:00–02:00, à 23:00)', () => {
    vi.useFakeTimers();
    setNowUTC(23, 0);
    expect(isCurrentlyOpen('20:00', '02:00', false)).toBe(true);
  });

  it('ouvert sur une plage traversant minuit, après minuit (ex. 20:00–02:00, à 01:00)', () => {
    vi.useFakeTimers();
    setNowUTC(1, 0);
    expect(isCurrentlyOpen('20:00', '02:00', false)).toBe(true);
  });

  it('fermé sur une plage traversant minuit, en dehors (ex. 20:00–02:00, à 12:00)', () => {
    vi.useFakeTimers();
    setNowUTC(12, 0);
    expect(isCurrentlyOpen('20:00', '02:00', false)).toBe(false);
  });
});
