import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { clientIp } from '@/lib/rateLimit';

function requestWithHeaders(headers: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost/api/auth/login', { headers: new Headers(headers) });
}

// Régression RA-03 : le premier élément de X-Forwarded-For est fourni par
// le client lui-même — un attaquant pouvait y écrire une IP différente à
// chaque tentative pour obtenir un nouveau quota de rate limiting gratuit.
describe('clientIp()', () => {
  it("préfère X-Real-IP (valeur unique posée par le proxy) quand il est présent", () => {
    const req = requestWithHeaders({
      'x-real-ip': '10.0.0.1',
      'x-forwarded-for': '203.0.113.9, 10.0.0.1',
    });
    expect(clientIp(req)).toBe('10.0.0.1');
  });

  it('retient le DERNIER élément de X-Forwarded-For (ajouté par le proxy), pas le premier (fourni par le client)', () => {
    const req = requestWithHeaders({
      // Un attaquant qui préfixe sa propre valeur : Nginx ($proxy_add_x_forwarded_for)
      // ajoute la vraie IP TCP à la fin plutôt que de l'écraser.
      'x-forwarded-for': '203.0.113.9, 10.0.0.1',
    });
    expect(clientIp(req)).toBe('10.0.0.1');
  });

  it('gère un X-Forwarded-For à une seule valeur', () => {
    const req = requestWithHeaders({ 'x-forwarded-for': '10.0.0.1' });
    expect(clientIp(req)).toBe('10.0.0.1');
  });

  it("renvoie 'unknown' en l'absence de tout header", () => {
    const req = requestWithHeaders({});
    expect(clientIp(req)).toBe('unknown');
  });
});
