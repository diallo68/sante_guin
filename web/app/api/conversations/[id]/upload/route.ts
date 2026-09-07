import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { detectFileKind, safeExtensionFor, mimeTypeFor, DOCUMENT_KINDS } from '@/lib/fileValidation';
import { signDownloadToken } from '@/lib/downloadToken';
import { checkConversationAccess as checkAccess } from '@/lib/conversationAccess';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
// Répertoire privé — jamais servi directement par le serveur statique Next.js.
const UPLOAD_DIR = path.join(process.cwd(), 'private-uploads', 'conversations');

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
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Type réel vérifié par signature binaire, pas par le Content-Type
  // déclaré par le client (falsifiable) — voir audit S07.
  const kind = detectFileKind(buffer);
  if (!kind || !DOCUMENT_KINDS.includes(kind)) {
    return NextResponse.json({ error: 'Type de fichier non autorisé (images ou PDF uniquement)' }, { status: 400 });
  }

  if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });

  const storedFilename = `${crypto.randomUUID()}.${safeExtensionFor(kind)}`;
  await writeFile(path.join(UPLOAD_DIR, storedFilename), buffer);

  const messageContent = caption || `📎 ${file.name}`;
  const senderRole = authUser.role as 'patient' | 'doctor' | 'pharmacist' | 'laboratorist';

  const message = await Message.create({
    conversationId: id,
    senderId: authUser.userId,
    senderRole,
    content: messageContent,
    attachments: [{
      name: file.name,
      // Chemin stable, sans jeton (le jeton est régénéré à chaque lecture —
      // voir GET /api/conversations/[id] — pour éviter qu'une URL persistée
      // en base n'expire).
      url: `/api/conversations/${id}/messages/__MESSAGE_ID__/attachment/download`,
      type: mimeTypeFor(kind),
      size: file.size,
      storedFilename,
    }],
    readBy: [authUser.userId],
  });

  message.attachments[0].url = `/api/conversations/${id}/messages/${message._id.toString()}/attachment/download`;
  await message.save();

  await Conversation.findByIdAndUpdate(id, {
    lastMessage: messageContent,
    lastMessageAt: new Date(),
  });

  // Réponse immédiate à l'expéditeur avec un lien de téléchargement utilisable
  // tout de suite (jeton signé, court, scopé à ce message).
  const token = await signDownloadToken({
    docId: message._id.toString(),
    ownerId: '', // vérifié via checkAccess côté route de téléchargement, pas par propriétaire unique
    scope: 'conversation-attachment',
  });
  const responseMessage = message.toObject();
  responseMessage.attachments[0].url = `${responseMessage.attachments[0].url}?token=${token}`;

  return NextResponse.json({ message: responseMessage }, { status: 201 });
}
