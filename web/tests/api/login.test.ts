import { describe, it, expect } from 'vitest';
import { POST as login } from '@/app/api/auth/login/route';
import { GET as getMe } from '@/app/api/auth/me/route';
import { PATCH as patchUser } from '@/app/api/admin/users/[id]/route';
import { PUT as changePassword } from '@/app/api/auth/change-password/route';
import { createUser, authedRequest, jsonRequest } from '../helpers';

describe('POST /api/auth/login', () => {
  it('refuse un mot de passe incorrect', async () => {
    const { email } = await createUser({ password: 'correct-password' });
    const req = jsonRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'wrong-password' }),
    });
    const res = await login(req);
    expect(res.status).toBe(401);
  });

  // Régression S03 : un compte suspendu obtenait quand même un token valide.
  it('refuse la connexion d\'un compte suspendu', async () => {
    const { email, password } = await createUser({ isSuspended: true });
    const req = jsonRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const res = await login(req);
    expect(res.status).toBe(403);
  });

  it('refuse la connexion d\'un compte non vérifié', async () => {
    const { email, password } = await createUser({ isVerified: false });
    const req = jsonRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const res = await login(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.requiresVerification).toBe(true);
  });

  it('connecte un compte valide et renvoie un token', async () => {
    const { email, password } = await createUser();
    const req = jsonRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const res = await login(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeTruthy();
  });
});

// Régression S04 : un token émis avant une suspension, une rétrogradation ou
// un changement de mot de passe restait valide jusqu'à son expiration
// (jusqu'à 7 jours), faute de vérification du compte à chaque requête.
describe('Révocation de session (S04)', () => {
  it('un token devient invalide dès que le compte est suspendu par un admin', async () => {
    const { user, token } = await createUser();
    const { token: adminToken } = await createUser({ role: 'admin' });

    // Le token fonctionne avant suspension.
    let res = await getMe(authedRequest('http://localhost/api/auth/me', token));
    expect(res.status).toBe(200);

    // Un admin suspend le compte.
    const patchReq = authedRequest(`http://localhost/api/admin/users/${user._id}`, adminToken, {
      method: 'PATCH',
      body: JSON.stringify({ isSuspended: true }),
    });
    const patchRes = await patchUser(patchReq, { params: Promise.resolve({ id: user._id.toString() }) });
    expect(patchRes.status).toBe(200);

    // Le même token, déjà émis, est maintenant refusé sans attendre son expiration.
    res = await getMe(authedRequest('http://localhost/api/auth/me', token));
    expect(res.status).toBe(401);
  });

  it('un token devient invalide après un changement de mot de passe', async () => {
    const { token, password } = await createUser();

    let res = await getMe(authedRequest('http://localhost/api/auth/me', token));
    expect(res.status).toBe(200);

    const changeReq = authedRequest('http://localhost/api/auth/change-password', token, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword: password, newPassword: 'brand-new-password' }),
    });
    const changeRes = await changePassword(changeReq);
    expect(changeRes.status).toBe(200);

    // L'ancien token (tokenVersion périmée) n'est plus valide.
    res = await getMe(authedRequest('http://localhost/api/auth/me', token));
    expect(res.status).toBe(401);

    // Mais la réponse du changement de mot de passe fournit un nouveau
    // token valide pour la session courante.
    const changeBody = await changeRes.json();
    res = await getMe(authedRequest('http://localhost/api/auth/me', changeBody.token));
    expect(res.status).toBe(200);
  });
});
