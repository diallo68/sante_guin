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

  let conversations;

  if (authUser.role === 'doctor' || authUser.role === 'pharmacist') {
    const doctor = await Doctor.findOne({ userId: authUser.userId }).select('_id').lean();
    if (!doctor) return NextResponse.json({ conversations: [] });

    conversations = await Conversation.find({ doctorId: doctor._id })
      .populate('patientId', 'firstName lastName')
      .populate('appointmentId', 'date time reason')
      .sort({ lastMessageAt: -1 })
      .lean();
  } else {
    conversations = await Conversation.find({ patientId: authUser.userId })
      .populate('doctorId', 'firstName lastName specialty')
      .populate('appointmentId', 'date time reason')
      .sort({ lastMessageAt: -1 })
      .lean();
  }

  // Attach unread count per conversation
  const userId = authUser.userId;
  const withUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unread = await Message.countDocuments({
        conversationId: conv._id,
        readBy: { $ne: userId },
        senderId: { $ne: userId },
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
