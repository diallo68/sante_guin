import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { verifyDownloadToken } from '@/lib/downloadToken';
import { mimeTypeFor, DetectedKind } from '@/lib/fileValidation';
import DocumentModel from '@/models/Document';

const UPLOAD_DIR = path.join(process.cwd(), 'private-uploads', 'documents');

// Autorise soit une session valide (web, cookie), soit un jeton de
// téléchargement signé et scopé à ce document précis (mobile, via
// `Linking.openURL`, qui n'envoie pas de header Authorization).
async function resolveOwnerId(req: NextRequest, docId: string): Promise<string | null> {
  const token = req.nextUrl.searchParams.get('token');
  if (token) {
    const payload = await verifyDownloadToken(token);
    if (payload && payload.scope === 'pro-document' && payload.docId === docId) {
      return payload.ownerId;
    }
  }
  const authUser = await getAuthUser(req);
  return authUser?.userId ?? null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const ownerId = await resolveOwnerId(req, id);
  if (!ownerId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  await connectDB();
  const doc = await DocumentModel.findOne({ _id: id, userId: ownerId }).lean();
  if (!doc) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
  }

  try {
    const buffer = await readFile(path.join(UPLOAD_DIR, doc.storedFilename));
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeTypeFor(doc.mimeType as DetectedKind),
        // 'attachment' plutôt que 'inline' : même si le type est déjà
        // vérifié à l'upload, on évite tout rendu actif dans le navigateur.
        'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.name)}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 });
  }
}
