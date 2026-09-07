import { describe, it, expect } from 'vitest';
import { POST as requestReset } from '@/app/api/auth/forgot-password/request/route';
import { POST as verifyResetOtp } from '@/app/api/auth/forgot-password/verify/route';
import { POST as resetPassword } from '@/app/api/auth/forgot-password/reset/route';
import { POST as login } from '@/app/api/auth/login/route';
import User from '@/models/User';
import { createUser, jsonRequest } from '../helpers';

// Régression B08 : les trois écrans (web et mobile) enchaînaient des délais
// artificiels sans jamais appeler d'API réelle — le mot de passe n'était
// jamais effectivement réinitialisé.
describe('Flux mot de passe oublié (B08)', () => {
  it('répond identiquement pour un email existant ou non (anti-énumération)', async () => {
    await createUser({ email: 'exists@test.local' });

    const resExisting = await requestReset(jsonRequest('http://localhost/api/auth/forgot-password/request', {
      method: 'POST', body: JSON.stringify({ email: 'exists@test.local' }),
    }));
    const resMissing = await requestReset(jsonRequest('http://localhost/api/auth/forgot-password/request', {
      method: 'POST', body: JSON.stringify({ email: 'does-not-exist@test.local' }),
    }));

    expect(resExisting.status).toBe(resMissing.status);
    const [bodyA, bodyB] = await Promise.all([resExisting.json(), resMissing.json()]);
    expect(bodyA.message).toBe(bodyB.message);
  });

  it('réinitialise réellement le mot de passe de bout en bout', async () => {
    const { email } = await createUser({ password: 'old-password' });

    await requestReset(jsonRequest('http://localhost/api/auth/forgot-password/request', {
      method: 'POST', body: JSON.stringify({ email }),
    }));

    const stored = await User.findOne({ email }).select('otpCode otpExpiry');
    expect(stored?.otpCode).toBeTruthy();

    // Le code en clair n'est jamais renvoyé par l'API (seul l'email le
    // reçoit) : on le récupère directement en base pour le test, en
    // recalculant le hash inverse n'est pas possible — on relit via le
    // module otp pour générer un code et vérifier le rejet d'un mauvais code.
    const wrongVerify = await verifyResetOtp(jsonRequest('http://localhost/api/auth/forgot-password/verify', {
      method: 'POST', body: JSON.stringify({ email, otp: '000000' }),
    }));
    expect(wrongVerify.status).toBe(400);

    // On importe le module otp pour générer/hasher un code identique à
    // celui stocké, en forçant le tirage via une requête directe : plus
    // simple ici, on relit le otpCode haché et on vérifie le rejet, puis on
    // exploite l'API interne du modèle pour injecter un code connu.
    const { hashOTP } = await import('@/lib/otp');
    const knownOtp = '123456';
    await User.updateOne({ email }, { otpCode: hashOTP(knownOtp) });

    const verifyRes = await verifyResetOtp(jsonRequest('http://localhost/api/auth/forgot-password/verify', {
      method: 'POST', body: JSON.stringify({ email, otp: knownOtp }),
    }));
    expect(verifyRes.status).toBe(200);

    const resetRes = await resetPassword(jsonRequest('http://localhost/api/auth/forgot-password/reset', {
      method: 'POST', body: JSON.stringify({ email, otp: knownOtp, newPassword: 'brand-new-password' }),
    }));
    expect(resetRes.status).toBe(200);

    // L'ancien mot de passe ne fonctionne plus, le nouveau si.
    const oldLogin = await login(jsonRequest('http://localhost/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password: 'old-password' }),
    }));
    expect(oldLogin.status).toBe(401);

    const newLogin = await login(jsonRequest('http://localhost/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password: 'brand-new-password' }),
    }));
    expect(newLogin.status).toBe(200);
  });

  it('refuse un code expiré', async () => {
    const { email } = await createUser();
    const { hashOTP } = await import('@/lib/otp');
    await User.updateOne(
      { email },
      { otpCode: hashOTP('123456'), otpExpiry: new Date(Date.now() - 1000) } // déjà expiré
    );

    const res = await resetPassword(jsonRequest('http://localhost/api/auth/forgot-password/reset', {
      method: 'POST', body: JSON.stringify({ email, otp: '123456', newPassword: 'whatever123' }),
    }));
    expect(res.status).toBe(400);
  });
});
