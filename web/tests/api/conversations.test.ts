import { describe, it, expect } from 'vitest';
import { POST as createConversation } from '@/app/api/conversations/route';
import { POST as createNewConversation } from '@/app/api/conversations/new/route';
import { GET as getConversation } from '@/app/api/conversations/[id]/route';
import Appointment from '@/models/Appointment';
import { createUser, createDoctor, authedRequest } from '../helpers';

// Régression S05 : le patient/expéditeur et les métadonnées du rendez-vous
// associé étaient acceptés tels quels depuis le corps de la requête, sans
// vérifier qu'ils correspondaient à l'utilisateur authentifié.
describe('POST /api/conversations — usurpation (S05)', () => {
  it('refuse de lier une conversation à un rendez-vous qui n\'appartient pas à l\'appelant', async () => {
    // Rendez-vous appartenant à un AUTRE patient.
    const { user: victimPatient } = await createUser({ email: 'victim@test.local' });
    const { doctor } = await createDoctor();
    const victimAppointment = await Appointment.create({
      patientId: victimPatient._id,
      doctorId: doctor._id,
      date: new Date(Date.now() + 86400000),
      time: '09:00',
      reason: 'Motif confidentiel de la victime',
    });

    // L'attaquant, authentifié comme un autre patient, tente de créer une
    // conversation liée à ce rendez-vous tiers.
    const { token: attackerToken } = await createUser({ email: 'attacker@test.local' });
    const req = authedRequest('http://localhost/api/conversations', attackerToken, {
      method: 'POST',
      body: JSON.stringify({
        appointmentId: victimAppointment._id.toString(),
        firstMessage: 'Bonjour',
      }),
    });

    const res = await createConversation(req);
    expect(res.status).toBe(404); // le rendez-vous "n'existe pas" pour l'attaquant
  });

  it('crée normalement une conversation pour le propriétaire du rendez-vous', async () => {
    const { user, token } = await createUser();
    const { doctor } = await createDoctor();
    const appointment = await Appointment.create({
      patientId: user._id,
      doctorId: doctor._id,
      date: new Date(Date.now() + 86400000),
      time: '09:00',
    });

    const req = authedRequest('http://localhost/api/conversations', token, {
      method: 'POST',
      body: JSON.stringify({ appointmentId: appointment._id.toString(), firstMessage: 'Bonjour docteur' }),
    });
    const res = await createConversation(req);
    expect(res.status).toBe(201);
  });
});

describe('POST /api/conversations/new — infos destinataire dérivées serveur (S16)', () => {
  it('ignore le rôle/nom fournis par le client et les recalcule côté serveur', async () => {
    const { token: senderToken } = await createUser({ email: 'sender@test.local' });
    const { user: recipientUser } = await createDoctor({ email: 'recipient@test.local' });

    const req = authedRequest('http://localhost/api/conversations/new', senderToken, {
      method: 'POST',
      body: JSON.stringify({
        recipientUserId: recipientUser._id.toString(),
        // Tentative d'usurpation : rôle et nom mensongers.
        recipientRole: 'admin',
        recipientDisplayName: 'PDG Mondocteur',
      }),
    });

    const res = await createNewConversation(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    const recipientParticipant = body.conversation.participants.find(
      (p: any) => p.userId === recipientUser._id.toString()
    );
    expect(recipientParticipant.role).toBe('doctor');
    expect(recipientParticipant.displayName).not.toBe('PDG Mondocteur');
  });
});

describe('GET /api/conversations/[id] — contrôle d\'accès', () => {
  it('refuse l\'accès à un tiers qui n\'est ni le patient ni le médecin', async () => {
    const { user: patient } = await createUser({ email: 'p@test.local' });
    const { doctor } = await createDoctor({ email: 'd@test.local' });
    const appointment = await Appointment.create({
      patientId: patient._id, doctorId: doctor._id,
      date: new Date(Date.now() + 86400000), time: '09:00',
    });

    const Conversation = (await import('@/models/Conversation')).default;
    const conv = await Conversation.create({
      type: 'appointment', doctorId: doctor._id, patientId: patient._id,
      appointmentId: appointment._id, lastMessage: '', lastMessageAt: new Date(),
    });

    const { token: strangerToken } = await createUser({ email: 'stranger@test.local' });
    const req = authedRequest(`http://localhost/api/conversations/${conv._id}`, strangerToken);
    const res = await getConversation(req, { params: Promise.resolve({ id: conv._id.toString() }) });
    expect(res.status).toBe(403);
  });
});
