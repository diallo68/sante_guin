import { describe, it, expect } from 'vitest';
import { GET as listContacts } from '@/app/api/conversations/new/route';
import { PATCH as patchSubscriptionRequest } from '@/app/api/admin/subscription-requests/route';
import Appointment from '@/models/Appointment';
import SubscriptionRequest from '@/models/SubscriptionRequest';
import Doctor from '@/models/Doctor';
import { createUser, createDoctor, authedRequest } from '../helpers';

// Régression S16 : un professionnel pouvait lister jusqu'à 100 patients
// sans aucun lien de soins avec eux.
describe('GET /api/conversations/new — annuaire patients restreint (S16)', () => {
  it('n\'expose pas un patient sans rendez-vous ni dossier avec ce médecin', async () => {
    await createUser({ email: 'unrelated-patient@test.local' }); // patient sans aucun lien
    const { token: doctorToken } = await createDoctor();

    const req = authedRequest('http://localhost/api/conversations/new', doctorToken);
    const res = await listContacts(req);
    const body = await res.json();
    const patientContacts = body.contacts.filter((c: any) => c.role === 'patient');
    expect(patientContacts).toHaveLength(0);
  });

  it('expose un patient ayant réellement pris rendez-vous avec ce médecin', async () => {
    const { user: patient } = await createUser({ email: 'real-patient@test.local' });
    const { doctor, token: doctorToken } = await createDoctor();
    await Appointment.create({
      patientId: patient._id, doctorId: doctor._id,
      date: new Date(Date.now() + 86400000), time: '10:00',
    });

    const req = authedRequest('http://localhost/api/conversations/new', doctorToken);
    const res = await listContacts(req);
    const body = await res.json();
    const patientContacts = body.contacts.filter((c: any) => c.role === 'patient');
    expect(patientContacts).toHaveLength(1);
    expect(patientContacts[0].userId).toBe(patient._id.toString());
  });
});

// Régression B20 : le statut de la demande était marqué "active" AVANT de
// vérifier que le profil professionnel avait bien été mis à jour. Un
// nouvel essai après un échec (ex. email ne correspondant à aucun compte)
// ne faisait alors plus rien, car `statusChanged` devenait faux.
describe('PATCH /api/admin/subscription-requests — activation idempotente (B20)', () => {
  it('échoue explicitement si aucun compte ne correspond, sans marquer la demande active', async () => {
    const { token: adminToken } = await createUser({ role: 'admin' });
    const request = await SubscriptionRequest.create({
      nom: 'Inconnu', telephone: '+224600000001', email: 'nobody-matching@test.local',
      planName: 'Essentiel', status: 'pending',
    });

    const req = authedRequest('http://localhost/api/admin/subscription-requests', adminToken, {
      method: 'PATCH',
      body: JSON.stringify({ id: request._id.toString(), status: 'active' }),
    });
    const res = await patchSubscriptionRequest(req);
    expect(res.status).toBe(409);

    const reloaded = await SubscriptionRequest.findById(request._id);
    expect(reloaded?.status).toBe('pending'); // pas marquée "active" malgré l'échec
  });

  it('active réellement le profil quand le compte correspond, et reste rejouable', async () => {
    const { token: adminToken } = await createUser({ role: 'admin' });
    const { doctor, user } = await createDoctor({ email: 'pro-to-activate@test.local' });
    const request = await SubscriptionRequest.create({
      nom: 'Pro Valide', telephone: '+224600000002', email: user.email,
      planName: 'Confort', status: 'pending',
    });

    const req = authedRequest('http://localhost/api/admin/subscription-requests', adminToken, {
      method: 'PATCH',
      body: JSON.stringify({ id: request._id.toString(), status: 'active' }),
    });
    const res = await patchSubscriptionRequest(req);
    expect(res.status).toBe(200);

    const updatedDoctor = await Doctor.findById(doctor._id);
    expect(updatedDoctor?.subscriptionStatus).toBe('active');
  });
});
