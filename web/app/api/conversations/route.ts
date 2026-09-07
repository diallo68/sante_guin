import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Doctor from '@/models/Doctor';
import Appointment from '@/models/Appointment';

// GET /api/conversations — list conversations for current user
export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  await connectDB();

  let conversations: any[] = [];

  if (authUser.role === 'doctor' || authUser.role === 'pharmacist' || authUser.role === 'laboratorist') {
    const doctor = await Doctor.findOne({ userId: authUser.userId }).select('_id').lean();

    // Appointment-based conversations
    const apptConvs = doctor
      ? await Conversation.find({ type: 'appointment', doctorId: doctor._id })
          .populate('patientId', 'firstName lastName')
          .populate('appointmentId', 'date time reason')
          .sort({ lastMessageAt: -1 })
          .lean()
      : [];

    // Document-sharing conversations
    const docConvs = await Conversation.find({
      type: 'document',
      'participants.userId': authUser.userId,
    })
      .sort({ lastMessageAt: -1 })
      .lean();

    conversations = [...apptConvs, ...docConvs].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  } else {
    // Patient: appointment-based conversations
    const apptConvs = await Conversation.find({ type: 'appointment', patientId: authUser.userId })
      .populate('doctorId', 'firstName lastName specialty')
      .populate('appointmentId', 'date time reason')
      .sort({ lastMessageAt: -1 })
      .lean();

    // Document-sharing conversations
    const docConvs = await Conversation.find({
      type: 'document',
      'participants.userId': authUser.userId,
    })
      .sort({ lastMessageAt: -1 })
      .lean();

    conversations = [...apptConvs, ...docConvs].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  // Attach unread count per conversation
  const withUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unread = await Message.countDocuments({
        conversationId: conv._id,
        readBy: { $ne: authUser.userId },
        senderId: { $ne: authUser.userId },
      });
      return { ...conv, unreadCount: unread };
    })
  );

  return NextResponse.json({ conversations: withUnread });
}

// POST /api/conversations — create an appointment conversation + first message.
// Le patient est toujours dérivé de la session (jamais du body), et le
// rendez-vous cité doit réellement lui appartenir : sans ça, n'importe quel
// utilisateur authentifié pouvait usurper un expéditeur et associer sa
// conversation au rendez-vous (donc aux métadonnées) d'un tiers.
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  if (authUser.role !== 'patient') {
    return NextResponse.json({ error: 'Réservé aux patients' }, { status: 403 });
  }

  const { appointmentId, firstMessage } = await req.json();
  if (!appointmentId || !firstMessage?.trim()) {
    return NextResponse.json({ error: 'appointmentId et firstMessage sont requis' }, { status: 400 });
  }

  await connectDB();

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    patientId: authUser.userId,
  }).select('doctorId patientId').lean();

  if (!appointment) {
    return NextResponse.json({ error: 'Rendez-vous introuvable' }, { status: 404 });
  }

  const existing = await Conversation.findOne({ type: 'appointment', appointmentId });
  if (existing) {
    return NextResponse.json({ conversation: existing }, { status: 200 });
  }

  const conversation = await Conversation.create({
    type: 'appointment',
    doctorId: appointment.doctorId,
    patientId: authUser.userId,
    appointmentId,
    lastMessage: firstMessage.trim(),
    lastMessageAt: new Date(),
  });

  await Message.create({
    conversationId: conversation._id,
    senderId: authUser.userId,
    senderRole: 'patient',
    content: firstMessage.trim(),
    readBy: [authUser.userId],
  });

  return NextResponse.json({ conversation }, { status: 201 });
}
