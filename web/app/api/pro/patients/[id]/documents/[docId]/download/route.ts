import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import PatientRecord from '@/models/PatientRecord';

const UPLOAD_DIR = path.join(process.cwd(), 'private-uploads', 'patients');
// Documents uploadés avant le passage au stockage privé (sans storedFilename).
const LEGACY_PUBLIC_DIR = path.join(process.cwd(), 'public', 'uploads', 'patients');

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await params;

  const authUser = await getAuthUser(req);
  if (!authUser || !['doctor', 'pharmacist', 'laboratorist'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  await connectDB();
  const record = await PatientRecord.findOne({ _id: id, proUserId: authUser.userId });
  if (!record) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const doc = record.documents.id(docId);
  if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });

  try {
    const buffer = doc.storedFilename
      ? await readFile(path.join(UPLOAD_DIR, doc.storedFilename))
      : await readFile(path.join(LEGACY_PUBLIC_DIR, path.basename(doc.url)));

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': doc.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.name)}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 });
  }
}
