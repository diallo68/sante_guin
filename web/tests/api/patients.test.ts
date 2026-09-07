import { describe, it, expect } from 'vitest';
import { GET as listPatients, POST as createPatient } from '@/app/api/pro/patients/route';
import { createUser, createDoctor, authedRequest } from '../helpers';

// Régression B13 : GET n'acceptait que 'doctor' alors que POST acceptait
// les trois rôles pro — un pharmacien pouvait créer un dossier patient
// mais jamais le revoir. Le genre 'M'/'F' envoyé par le mobile ne
// correspondait pas non plus à l'enum réel ('homme'/'femme'/'autre').
describe('GET/POST /api/pro/patients — rôles harmonisés (B13)', () => {
  it('un pharmacien peut créer ET relire ses dossiers patients manuels', async () => {
    const { token } = await createUser({ role: 'pharmacist' });

    const createRes = await createPatient(authedRequest('http://localhost/api/pro/patients', token, {
      method: 'POST',
      body: JSON.stringify({ firstName: 'Client', lastName: 'Fidèle', phone: '+224600000000', gender: 'homme' }),
    }));
    expect(createRes.status).toBe(201);

    const listRes = await listPatients(authedRequest('http://localhost/api/pro/patients', token));
    expect(listRes.status).toBe(200);
    const body = await listRes.json();
    expect(body.manual).toHaveLength(1);
    expect(body.manual[0].firstName).toBe('Client');
    expect(body.manual[0].gender).toBe('homme');
  });

  it('un laboratoriste peut créer et relire ses dossiers patients', async () => {
    const { token } = await createUser({ role: 'laboratorist' });
    await createPatient(authedRequest('http://localhost/api/pro/patients', token, {
      method: 'POST',
      body: JSON.stringify({ firstName: 'Patient', lastName: 'Labo', phone: '+224600000001' }),
    }));
    const listRes = await listPatients(authedRequest('http://localhost/api/pro/patients', token));
    const body = await listRes.json();
    expect(body.manual).toHaveLength(1);
  });

  it('refuse un patient authentifié (pas un rôle pro)', async () => {
    const { token } = await createUser({ role: 'patient' });
    const res = await listPatients(authedRequest('http://localhost/api/pro/patients', token));
    expect(res.status).toBe(403);
  });

  it('un médecin ne voit que ses propres dossiers manuels, pas ceux d\'un autre pro', async () => {
    const { token: doctorAToken } = await createDoctor({ email: 'doctorA@test.local' });
    const { token: doctorBToken } = await createDoctor({ email: 'doctorB@test.local' });

    await createPatient(authedRequest('http://localhost/api/pro/patients', doctorAToken, {
      method: 'POST',
      body: JSON.stringify({ firstName: 'Patient', lastName: 'DeA', phone: '+224600000002' }),
    }));

    const listB = await listPatients(authedRequest('http://localhost/api/pro/patients', doctorBToken));
    const bodyB = await listB.json();
    expect(bodyB.manual).toHaveLength(0);
  });
});
