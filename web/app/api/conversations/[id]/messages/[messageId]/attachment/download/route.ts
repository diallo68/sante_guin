import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { verifyDownloadToken } from '@/lib/downloadToken';
import { checkConversationAccess } from '@/lib/conversationAccess';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';

const UPLOAD_DIR = path.join(process.cwd(), 'private-uploads', 'conversations');
// Pièces jointes envoyées avant le passage au stockage privé (sans storedFilename).
const LEGACY_PUBLIC_DIR = path.join(process.cwd(), 'public', 'uploads', 'conversations');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const { id, messageId } = await params;

  // Accès soit par jeton signé scopé à ce message (mobile, ouvert via
  // Linking.openURL sans header d'authentification), soit par session
  // (web) avec vérification d'appartenance à la conversation.
  const token = req.nextUrl.searchParams.get('token');
  let authorized = false;

  if (token) {
    const payload = await verifyDownloadToken(token);
    authorized = !!payload && payload.scope === 'conversation-attachment' && payload.docId === messageId;
  }

  if (!authorized) {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    await connectDB();
    const conv = await Conversation.findById(id).lean();
    if (!conv) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
    authorized = await checkConversationAccess(conv, authUser);
  }

  if (!authorized) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  await connectDB();
  const message = await Message.findOne({ _id: messageId, conversationId: id }).lean();
  const attachment = message?.attachments?.[0];
  if (!attachment) return NextResponse.json({ error: 'Pièce jointe introuvable' }, { status: 404 });

  try {
    const buffer = attachment.storedFilename
      ? await readFile(path.join(UPLOAD_DIR, attachment.storedFilename))
      : await readFile(path.join(LEGACY_PUBLIC_DIR, path.basename(attachment.url)));

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': attachment.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.name)}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 });
  }
}
