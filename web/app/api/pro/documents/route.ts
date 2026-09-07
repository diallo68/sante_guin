import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { detectFileKind, safeExtensionFor, DOCUMENT_KINDS } from '@/lib/fileValidation';
import { signDownloadToken } from '@/lib/downloadToken';
import DocumentModel, { IDocument } from '@/models/Document';
import { PRO_ROLES, ProRole } from '@/lib/proAccess';

// Répertoire privé, hors de `public/` : ces fichiers ne sont jamais servis
// directement par le serveur statique Next.js, seulement via la route de
// téléchargement protégée ci-dessous.
const UPLOAD_DIR = path.join(process.cwd(), 'private-uploads', 'documents');

function formatSize(bytes: number): string {
  const kb = Math.round(bytes / 1024);
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

async function toClientDoc(req: NextRequest, doc: Pick<IDocument, '_id' | 'name' | 'category' | 'size' | 'createdAt' | 'userId'>) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const token = await signDownloadToken({
    docId: doc._id.toString(),
    ownerId: doc.userId.toString(),
    scope: 'pro-document',
  });
  return {
    id: doc._id.toString(),
    name: doc.name,
    category: doc.category,
    uploadDate: doc.createdAt.toISOString(),
    size: formatSize(doc.size),
    url: `${appUrl}/api/pro/documents/${doc._id.toString()}/download?token=${token}`,
  };
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    // Réservé aux professionnels : c'était auparavant ouvert à tout
    // utilisateur authentifié, y compris un patient — voir audit S10.
    if (!authUser || !PRO_ROLES.includes(authUser.role as ProRole)) {
      return NextResponse.json({ error: 'Accès réservé aux professionnels de santé' }, { status: 403 });
    }

    await connectDB();
    const docs = await DocumentModel.find({ userId: authUser.userId }).sort({ createdAt: -1 }).lean();
    const withUrls = await Promise.all(docs.map((d) => toClientDoc(req, d)));

    return NextResponse.json({ documents: withUrls });
  } catch (error) {
    console.error('Documents GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !PRO_ROLES.includes(authUser.role as ProRole)) {
      return NextResponse.json({ error: 'Accès réservé aux professionnels de santé' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'Autres';

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Le type réel est déterminé par signature binaire, jamais par le
    // Content-Type déclaré par le client ni par l'extension du nom de
    // fichier — ceux-ci sont falsifiables (voir audit S07).
    const kind = detectFileKind(buffer);
    if (!kind || !DOCUMENT_KINDS.includes(kind)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé (images ou PDF uniquement)' },
        { status: 400 }
      );
    }

    if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });

    const storedFilename = `${crypto.randomUUID()}.${safeExtensionFor(kind)}`;
    await writeFile(path.join(UPLOAD_DIR, storedFilename), buffer);

    await connectDB();
    const doc = await DocumentModel.create({
      userId: authUser.userId,
      name: file.name || storedFilename,
      category,
      mimeType: kind,
      storedFilename,
      size: file.size,
    });

    return NextResponse.json({ document: await toClientDoc(req, doc) }, { status: 201 });
  } catch (error) {
    console.error('Documents POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !PRO_ROLES.includes(authUser.role as ProRole)) {
      return NextResponse.json({ error: 'Accès réservé aux professionnels de santé' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await connectDB();
    const doc = await DocumentModel.findOne({ _id: id, userId: authUser.userId });
    if (!doc) {
      return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
    }

    try { await unlink(path.join(UPLOAD_DIR, doc.storedFilename)); } catch { /* fichier déjà absent */ }
    await doc.deleteOne();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Documents DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
