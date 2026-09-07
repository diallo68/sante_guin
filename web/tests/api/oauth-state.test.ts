import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as googleCallback } from '@/app/api/auth/google/callback/route';
import { OAUTH_STATE_COOKIE } from '@/lib/oauthState';

// Régression S15 : sans vérification du `state`, un attaquant pouvait faire
// ouvrir à une victime un lien de callback OAuth initié pour un autre
// compte (CSRF de connexion).
describe('GET /api/auth/google/callback — vérification du state (S15)', () => {
  const originalClientId = process.env.GOOGLE_CLIENT_ID;
  const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
  });

  afterAll(() => {
    process.env.GOOGLE_CLIENT_ID = originalClientId;
    process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
  });

  it('rejette un callback sans state du tout', async () => {
    const req = new NextRequest('http://localhost/api/auth/google/callback?code=fake-code');
    const res = await googleCallback(req);
    expect(res.headers.get('location')).toContain('error=oauth_invalid_state');
  });

  it('rejette un state qui ne correspond pas au cookie émis au départ du flux', async () => {
    const req = new NextRequest('http://localhost/api/auth/google/callback?code=fake-code&state=attacker-supplied-state', {
      headers: { cookie: `${OAUTH_STATE_COOKIE}=different-state-from-cookie` },
    });
    const res = await googleCallback(req);
    expect(res.headers.get('location')).toContain('error=oauth_invalid_state');
  });

  it('rejette un callback sans code', async () => {
    const req = new NextRequest('http://localhost/api/auth/google/callback?state=whatever');
    const res = await googleCallback(req);
    expect(res.headers.get('location')).toContain('error=oauth_cancelled');
  });
});
