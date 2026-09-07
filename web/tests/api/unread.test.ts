import { describe, it, expect } from 'vitest';
import { GET as getUnread } from '@/app/api/conversations/unread/route';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { createUser, createDoctor, authedRequest } from '../helpers';

// Régression B24 : les pharmaciens (recherchés comme Doctor, un modèle
// qu'ils n'ont pas) et les laboratoristes (traités comme des patients)
// obtenaient toujours 0, et les conversations de type "document" (tous
// rôles) n'étaient jamais comptées, pour personne.
describe('GET /api/conversations/unread (B24)', () => {
  it('compte les messages non lus d\'une conversation documentaire pour un pharmacien', async () => {
    const { user: pharmacist, token } = await createUser({ role: 'pharmacist', email: 'pharma@test.local' });
    const { user: patient } = await createUser({ email: 'client@test.local' });

    const conv = await Conversation.create({
      type: 'document',
      participants: [
        { userId: patient._id, role: 'patient', displayName: 'Client' },
        { userId: pharmacist._id, role: 'pharmacist', displayName: 'Pharmacie' },
      ],
      lastMessage: 'Bonjour', lastMessageAt: new Date(),
    });
    await Message.create({
      conversationId: conv._id, senderId: patient._id, senderRole: 'patient',
      content: 'Avez-vous ce médicament ?', readBy: [patient._id],
    });

    const res = await getUnread(authedRequest('http://localhost/api/conversations/unread', token));
    const body = await res.json();
    expect(body.count).toBe(1);
  });

  it('compte les messages non lus pour un laboratoriste', async () => {
    const { user: lab, token } = await createUser({ role: 'laboratorist', email: 'lab@test.local' });
    const { user: patient } = await createUser({ email: 'client2@test.local' });

    const conv = await Conversation.create({
      type: 'document',
      participants: [
        { userId: patient._id, role: 'patient', displayName: 'Client' },
        { userId: lab._id, role: 'laboratorist', displayName: 'Labo' },
      ],
      lastMessage: 'Résultats ?', lastMessageAt: new Date(),
    });
    await Message.create({
      conversationId: conv._id, senderId: patient._id, senderRole: 'patient',
      content: 'Mes résultats sont-ils prêts ?', readBy: [patient._id],
    });

    const res = await getUnread(authedRequest('http://localhost/api/conversations/unread', token));
    const body = await res.json();
    expect(body.count).toBe(1);
  });

  it('additionne conversations de rendez-vous et conversations documentaires pour un médecin', async () => {
    const { doctor, token, user: doctorUser } = await createDoctor({ email: 'doc@test.local' });
    const { user: patient } = await createUser({ email: 'patient3@test.local' });

    const apptConv = await Conversation.create({
      type: 'appointment', doctorId: doctor._id, patientId: patient._id,
      lastMessage: '', lastMessageAt: new Date(),
    });
    await Message.create({
      conversationId: apptConv._id, senderId: patient._id, senderRole: 'patient',
      content: 'Question sur mon ordonnance', readBy: [patient._id],
    });

    const docConv = await Conversation.create({
      type: 'document',
      participants: [
        { userId: patient._id, role: 'patient', displayName: 'Patient' },
        { userId: doctorUser._id, role: 'doctor', displayName: 'Docteur' },
      ],
      lastMessage: '', lastMessageAt: new Date(),
    });
    await Message.create({
      conversationId: docConv._id, senderId: patient._id, senderRole: 'patient',
      content: 'Voici mon document', readBy: [patient._id],
    });

    const res = await getUnread(authedRequest('http://localhost/api/conversations/unread', token));
    const body = await res.json();
    expect(body.count).toBe(2);
  });

  it('ne compte pas ses propres messages comme non lus', async () => {
    const { token, user } = await createUser();
    const { doctor } = await createDoctor();
    const conv = await Conversation.create({
      type: 'appointment', doctorId: doctor._id, patientId: user._id,
      lastMessage: '', lastMessageAt: new Date(),
    });
    await Message.create({
      conversationId: conv._id, senderId: user._id, senderRole: 'patient',
      content: 'Mon propre message', readBy: [user._id],
    });

    const res = await getUnread(authedRequest('http://localhost/api/conversations/unread', token));
    const body = await res.json();
    expect(body.count).toBe(0);
  });
});
