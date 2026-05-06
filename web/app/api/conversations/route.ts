import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Doctor from '@/models/Doctor';

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

// POST /api/conversations — create conversation + first message (called by appointments API)
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { doctorId, patientId, appointmentId, firstMessage } = await req.json();

  await connectDB();

  const conversation = await Conversation.create({
    type: 'appointment',
    doctorId,
    patientId,
    appointmentId,
    lastMessage: firstMessage,
    lastMessageAt: new Date(),
  });

  await Message.create({
    conversationId: conversation._id,
    senderId: patientId,
    senderRole: 'patient',
    content: firstMessage,
    readBy: [patientId],
  });

  return NextResponse.json({ conversation }, { status: 201 });
}
