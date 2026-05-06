import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Doctor from '@/models/Doctor';

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
];

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

async function checkAccess(conv: any, authUser: { userId: string; role: string }) {
  if (conv.type === 'document') {
    return conv.participants.some((p: any) => String(p.userId) === authUser.userId);
  }
  const isPatient = String(conv.patientId) === authUser.userId;
  if (isPatient) return true;
  if (authUser.role === 'doctor' || authUser.role === 'pharmacist' || authUser.role === 'laboratorist') {
    const doc = await Doctor.findOne({ userId: authUser.userId }).select('_id').lean();
    return doc ? String(doc._id) === String(conv.doctorId) : false;
  }
  return false;
}

// POST /api/conversations/:id/upload — upload a document attachment
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  await connectDB();

  const conv = await Conversation.findById(id).lean();
  if (!conv) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });

  const hasAccess = await checkAccess(conv, authUser);
  if (!hasAccess) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const caption = (formData.get('caption') as string | null)?.trim() || '';

  if (!file) return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Type de fichier non autorisé (images ou PDF uniquement)' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const filename = `conv_${id}_${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'conversations');
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  const fileUrl = `/uploads/conversations/${filename}`;
  const attachment = { name: file.name, url: fileUrl, type: file.type, size: file.size };

  const messageContent = caption || `📎 ${file.name}`;
  const senderRole = authUser.role as 'patient' | 'doctor' | 'pharmacist' | 'laboratorist';

  const message = await Message.create({
    conversationId: id,
    senderId: authUser.userId,
    senderRole,
    content: messageContent,
    attachments: [attachment],
    readBy: [authUser.userId],
  });

  await Conversation.findByIdAndUpdate(id, {
    lastMessage: messageContent,
    lastMessageAt: new Date(),
  });

  return NextResponse.json({ message }, { status: 201 });
}
