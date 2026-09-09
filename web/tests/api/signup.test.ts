import { describe, it, expect } from 'vitest';
import { POST as signup } from '@/app/api/auth/signup/route';
import User from '@/models/User';
import { jsonRequest } from '../helpers';

// Régression S01 : l'inscription publique acceptait n'importe quel rôle,
// y compris 'admin', fourni tel quel par le client.
describe('POST /api/auth/signup', () => {
  it('refuse la création d\'un compte admin depuis l\'inscription publique', async () => {
    const req = jsonRequest('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Eve',
        lastName: 'Attacker',
        email: 'eve@test.local',
        password: 'password123',
        role: 'admin',
      }),
    });

    const res = await signup(req);
    expect(res.status).toBe(400);

    const created = await User.findOne({ email: 'eve@test.local' });
    expect(created).toBeNull();
  });

  it('refuse un rôle inconnu', async () => {
    const req = jsonRequest('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Mallory',
        lastName: 'Attacker',
        email: 'mallory@test.local',
        password: 'password123',
        role: 'superadmin',
      }),
    });

    const res = await signup(req);
    expect(res.status).toBe(400);
  });

  // Régression RA-09 : la case « J'accepte les conditions » n'était
  // vérifiée que côté client — rien n'empêchait de créer un compte sans
  // jamais l'avoir cochée.
  it('refuse la création d\'un compte sans acceptation des conditions', async () => {
    const req = jsonRequest('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Bob',
        lastName: 'SansCGU',
        email: 'bob@test.local',
        password: 'password123',
        role: 'patient',
      }),
    });

    const res = await signup(req);
    expect(res.status).toBe(400);

    const created = await User.findOne({ email: 'bob@test.local' });
    expect(created).toBeNull();
  });

  it('crée un compte patient avec un rôle valide', async () => {
    const req = jsonRequest('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Alice',
        lastName: 'Patient',
        email: 'alice@test.local',
        password: 'password123',
        role: 'patient',
        acceptTerms: true,
      }),
    });

    const res = await signup(req);
    expect(res.status).toBe(201);

    const created = await User.findOne({ email: 'alice@test.local' });
    expect(created).not.toBeNull();
    expect(created?.role).toBe('patient');
    expect(created?.isVerified).toBe(false); // en attente de vérification OTP
    expect(created?.acceptedTermsAt).toBeInstanceOf(Date);
  });

  it('crée un compte médecin avec son profil professionnel associé', async () => {
    const req = jsonRequest('http://localhost/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'Ahmed',
        lastName: 'Diallo',
        email: 'ahmed@test.local',
        password: 'password123',
        role: 'doctor',
        specialties: ['Cardiologue'],
        acceptTerms: true,
      }),
    });

    const res = await signup(req);
    expect(res.status).toBe(201);

    const created = await User.findOne({ email: 'ahmed@test.local' });
    expect(created?.role).toBe('doctor');
  });
});
