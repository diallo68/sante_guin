import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import { sendEmail, emailNewMessage } from '@/lib/email';

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

  // Verify access
  const isPatient = String(conv.patientId._id) === authUser.userId;
  let isDoctor = false;
  if (authUser.role === 'doctor' || authUser.role === 'pharmacist') {
    const doc = await Doctor.findOne({ userId: authUser.userId }).select('_id').lean();
    isDoctor = doc ? String(doc._id) === String(conv.doctorId._id) : false;
  }
  if (!isPatient && !isDoctor) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

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

// POST /api/conversations/[id] — send a message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Message vide' }, { status: 400 });

  await connectDB();

  const conv = await Conversation.findById(id).lean();
  if (!conv) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  // Verify access
  const isPatient = String(conv.patientId) === authUser.userId;
  let isDoctor = false;
  if (authUser.role === 'doctor' || authUser.role === 'pharmacist') {
    const doc = await Doctor.findOne({ userId: authUser.userId }).select('_id').lean();
    isDoctor = doc ? String(doc._id) === String(conv.doctorId) : false;
  }
  if (!isPatient && !isDoctor) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const senderRole = isDoctor ? 'doctor' : 'patient';

  const message = await Message.create({
    conversationId: id,
    senderId: authUser.userId,
    senderRole,
    content: content.trim(),
    readBy: [authUser.userId],
  });

  await Conversation.findByIdAndUpdate(id, {
    lastMessage: content.trim(),
    lastMessageAt: new Date(),
  });

  // Notification email au destinataire (non-bloquant)
  Promise.resolve().then(async () => {
    try {
      const recipientId = isDoctor ? String(conv.patientId) : String(conv.doctorId);
      const senderName = isDoctor
        ? `Dr. ${(await Doctor.findOne({ userId: authUser.userId }).select('firstName lastName').lean())?.firstName}`
        : undefined;

      const recipientUser = await User.findById(isDoctor ? conv.patientId : undefined).select('email firstName lastName').lean();
      const senderUser = await User.findById(authUser.userId).select('firstName lastName').lean();

      if (isDoctor && recipientUser?.email && senderUser) {
        const doctorDoc = await Doctor.findOne({ userId: authUser.userId }).select('firstName lastName').lean();
        const tpl = emailNewMessage({
          recipientName: `${recipientUser.firstName} ${recipientUser.lastName}`,
          senderName: doctorDoc ? `Dr. ${doctorDoc.firstName} ${doctorDoc.lastName}` : senderUser.firstName,
          preview: content.trim(),
          conversationId: id,
          role: 'patient',
        });
        sendEmail({ to: recipientUser.email, ...tpl }).catch(() => {});
      } else if (!isDoctor) {
        // Notify doctor: get doctor's user email
        const doctorDoc = await Doctor.findById(conv.doctorId).select('userId email').lean();
        const doctorUser = await User.findById(doctorDoc?.userId).select('email firstName lastName').lean();
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
    } catch (_) {}
  });

  return NextResponse.json({ message }, { status: 201 });
}
