import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { GET as listContacts } from '@/app/api/conversations/new/route';
import { PATCH as patchSubscriptionRequest } from '@/app/api/admin/subscription-requests/route';
import Appointment from '@/models/Appointment';
import SubscriptionRequest from '@/models/SubscriptionRequest';
import Doctor from '@/models/Doctor';
import { createUser, createDoctor, authedRequest } from '../helpers';
import type { SendEmailInput } from '@/lib/emailProvider';

// Espionne l'appel HTTP réel à Brevo (jamais atteint sans BREVO_API_KEY,
// voir lib/mailer.ts) pour pouvoir inspecter le HTML effectivement envoyé.
// `vi.hoisted` évite la TDZ : `vi.mock` est hoisté au-dessus des imports
// (donc évalué avant toute déclaration `const` normale du fichier).
const { sendViaBrevoMock } = vi.hoisted(() => ({
  sendViaBrevoMock: vi.fn(async (_input: SendEmailInput) => ({ ok: true })),
}));
vi.mock('@/lib/emailProvider', () => ({
  sendViaBrevo: sendViaBrevoMock,
}));

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

// Régression S19/RA-14 : `nom`, `planName` et `adminNote` étaient interpolés
// sans échappement dans les emails envoyés à l'utilisateur, permettant à une
// demande d'abonnement forgée de falsifier le contenu d'un email envoyé au
// nom de la plateforme.
describe('PATCH /api/admin/subscription-requests — échappement HTML des emails (S19/RA-14)', () => {
  const originalBrevoKey = process.env.BREVO_API_KEY;
  beforeAll(() => { process.env.BREVO_API_KEY = 'test-key'; });
  afterAll(() => { process.env.BREVO_API_KEY = originalBrevoKey; });

  it('échappe nom, planName et adminNote dans l\'email d\'activation', async () => {
    sendViaBrevoMock.mockClear();
    const { token: adminToken } = await createUser({ role: 'admin' });
    const { doctor, user } = await createDoctor({ email: 'xss-activate@test.local' });
    const request = await SubscriptionRequest.create({
      nom: '<img src=x onerror=alert(1)>', telephone: '+224600000003', email: user.email,
      planName: '<script>evil()</script>', status: 'pending',
    });

    const req = authedRequest('http://localhost/api/admin/subscription-requests', adminToken, {
      method: 'PATCH',
      body: JSON.stringify({
        id: request._id.toString(),
        status: 'active',
        adminNote: '<a href="https://phishing.example">cliquez</a>',
      }),
    });
    const res = await patchSubscriptionRequest(req);
    expect(res.status).toBe(200);
    expect(doctor).toBeTruthy();

    expect(sendViaBrevoMock).toHaveBeenCalled();
    const html = sendViaBrevoMock.mock.calls[0][0].html as string;
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).not.toContain('<script>evil()</script>');
    expect(html).not.toContain('<a href="https://phishing.example">');
    expect(html).toContain('&lt;img');
    expect(html).toContain('&lt;script&gt;evil()&lt;/script&gt;');
  });

  it('échappe nom, planName et adminNote dans l\'email "sendMessageOnly"', async () => {
    sendViaBrevoMock.mockClear();
    const { token: adminToken } = await createUser({ role: 'admin' });
    const request = await SubscriptionRequest.create({
      nom: '<b>Faux</b> Nom', telephone: '+224600000004', email: 'xss-message@test.local',
      planName: 'Essentiel', status: 'pending',
    });

    const req = authedRequest('http://localhost/api/admin/subscription-requests', adminToken, {
      method: 'PATCH',
      body: JSON.stringify({
        id: request._id.toString(),
        adminNote: '<script>steal()</script>',
        sendMessageOnly: true,
      }),
    });
    const res = await patchSubscriptionRequest(req);
    expect(res.status).toBe(200);

    expect(sendViaBrevoMock).toHaveBeenCalled();
    const html = sendViaBrevoMock.mock.calls[0][0].html as string;
    expect(html).not.toContain('<b>Faux</b>');
    expect(html).not.toContain('<script>steal()</script>');
    expect(html).toContain('&lt;script&gt;steal()&lt;/script&gt;');
  });
});

// Régression : `status` n'était pas validé côté serveur avant d'être écrit
// en base (`findByIdAndUpdate` n'exécute pas les validateurs du schéma par
// défaut), un statut arbitraire pouvait donc être enregistré.
describe('PATCH /api/admin/subscription-requests — validation stricte du statut', () => {
  it('rejette un statut hors de l\'enum sans modifier la demande', async () => {
    const { token: adminToken } = await createUser({ role: 'admin' });
    const request = await SubscriptionRequest.create({
      nom: 'Test Statut', telephone: '+224600000005', planName: 'Essentiel', status: 'pending',
    });

    const req = authedRequest('http://localhost/api/admin/subscription-requests', adminToken, {
      method: 'PATCH',
      body: JSON.stringify({ id: request._id.toString(), status: 'not-a-real-status' }),
    });
    const res = await patchSubscriptionRequest(req);
    expect(res.status).toBe(400);

    const reloaded = await SubscriptionRequest.findById(request._id);
    expect(reloaded?.status).toBe('pending');
  });
});
