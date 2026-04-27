import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Doctor from '@/models/Doctor';

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

  return NextResponse.json({ message }, { status: 201 });
}
