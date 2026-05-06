import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import { sendEmail, emailNewMessage } from '@/lib/email';

async function checkAccess(conv: any, authUser: { userId: string; role: string }) {
  if (conv.type === 'document') {
    return conv.participants.some((p: any) => String(p.userId) === authUser.userId);
  }
  // Appointment-based
  const isPatient = String(conv.patientId?._id ?? conv.patientId) === authUser.userId;
  if (isPatient) return true;
  if (authUser.role === 'doctor' || authUser.role === 'pharmacist' || authUser.role === 'laboratorist') {
    const doc = await Doctor.findOne({ userId: authUser.userId }).select('_id').lean();
    return doc ? String(doc._id) === String(conv.doctorId?._id ?? conv.doctorId) : false;
  }
  return false;
}

// GET /api/conversations/[id] — messages + mark as read
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  await connectDB();

  const conv = await Conversation.findById(id)
    .populate('doctorId', 'firstName lastName specialty')
    .populate('patientId', 'firstName lastName')
    .populate('appointmentId', 'date time reason status')
    .lean();

  if (!conv) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const hasAccess = await checkAccess(conv, authUser);
  if (!hasAccess) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const messages = await Message.find({ conversationId: id })
    .sort({ createdAt: 1 })
    .lean();

  // Mark messages as read
  await Message.updateMany(
    { conversationId: id, senderId: { $ne: authUser.userId }, readBy: { $ne: authUser.userId } },
    { $addToSet: { readBy: authUser.userId } }
  );

  return NextResponse.json({ conversation: conv, messages });
}

// POST /api/conversations/[id] — send a text message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Message vide' }, { status: 400 });

  await connectDB();

  const conv = await Conversation.findById(id).lean();
  if (!conv) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const hasAccess = await checkAccess(conv, authUser);
  if (!hasAccess) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const senderRole = authUser.role as 'patient' | 'doctor' | 'pharmacist' | 'laboratorist';

  const message = await Message.create({
    conversationId: id,
    senderId: authUser.userId,
    senderRole,
    content: content.trim(),
    readBy: [authUser.userId],
  });

  const lastMsg = content.trim().substring(0, 100);
  await Conversation.findByIdAndUpdate(id, {
    lastMessage: lastMsg,
    lastMessageAt: new Date(),
  });

  // Notification email (non-bloquant)
  Promise.resolve().then(async () => {
    try {
      if (conv.type === 'appointment') {
        const isDoctor = authUser.role !== 'patient';
        const senderUser = await User.findById(authUser.userId).select('firstName lastName').lean();
        const doctorDoc = await Doctor.findOne({ userId: authUser.userId }).select('firstName lastName').lean();

        if (isDoctor) {
          const recipientUser = await User.findById(conv.patientId).select('email firstName lastName').lean();
          if (recipientUser?.email && senderUser) {
            const tpl = emailNewMessage({
              recipientName: `${recipientUser.firstName} ${recipientUser.lastName}`,
              senderName: doctorDoc ? `Dr. ${doctorDoc.firstName} ${doctorDoc.lastName}` : senderUser.firstName,
              preview: content.trim(),
              conversationId: id,
              role: 'patient',
            });
            sendEmail({ to: recipientUser.email, ...tpl }).catch(() => {});
          }
        } else {
          const doctorRecord = await Doctor.findById(conv.doctorId).select('userId').lean();
          const doctorUser = await User.findById(doctorRecord?.userId).select('email firstName lastName').lean();
          if (doctorUser?.email && senderUser) {
            const tpl = emailNewMessage({
              recipientName: `${doctorUser.firstName} ${doctorUser.lastName}`,
              senderName: `${senderUser.firstName} ${senderUser.lastName}`,
              preview: content.trim(),
              conversationId: id,
              role: 'doctor',
            });
            sendEmail({ to: doctorUser.email, ...tpl }).catch(() => {});
          }
        }
      } else {
        // Document conversation: notify other participants
        const senderUser = await User.findById(authUser.userId).select('firstName lastName').lean();
        const otherParticipants = conv.participants.filter(
          (p: any) => String(p.userId) !== authUser.userId
        );
        for (const p of otherParticipants) {
          const recipientUser = await User.findById(p.userId).select('email firstName lastName').lean();
          if (recipientUser?.email && senderUser) {
            const tpl = emailNewMessage({
              recipientName: `${recipientUser.firstName} ${recipientUser.lastName}`,
              senderName: `${senderUser.firstName} ${senderUser.lastName}`,
              preview: content.trim(),
              conversationId: id,
              role: p.role,
            });
            sendEmail({ to: recipientUser.email, ...tpl }).catch(() => {});
          }
        }
      }
    } catch (_) {}
  });

  return NextResponse.json({ message }, { status: 201 });
}
