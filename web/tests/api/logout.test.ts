import { describe, it, expect } from 'vitest';
import { POST as logout } from '@/app/api/auth/logout/route';
import { GET as getMe } from '@/app/api/auth/me/route';
import { createUser, authedRequest, jsonRequest } from '../helpers';

// Régression RA-01 : le logout ne supprimait que le cookie `gs_token` sans
// incrémenter `tokenVersion` — un JWT copié avant la déconnexion (ex. via
// le header Authorization, comme mobile) restait valide jusqu'à son
// expiration (jusqu'à 7 jours).
describe('POST /api/auth/logout', () => {
  it('révoque le token courant : il devient inutilisable après déconnexion', async () => {
    const { token } = await createUser();

    let res = await getMe(authedRequest('http://localhost/api/auth/me', token));
    expect(res.status).toBe(200);

    const logoutRes = await logout(authedRequest('http://localhost/api/auth/logout', token, { method: 'POST' }));
    expect(logoutRes.status).toBe(200);

    res = await getMe(authedRequest('http://localhost/api/auth/me', token));
    expect(res.status).toBe(401);
  });

  it('ne casse pas la déconnexion pour une requête non authentifiée', async () => {
    const req = jsonRequest('http://localhost/api/auth/logout', { method: 'POST' });
    const res = await logout(req);
    expect(res.status).toBe(200);
  });
});
