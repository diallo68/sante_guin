import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import PatientRecord from '@/models/PatientRecord';
import { detectFileKind, safeExtensionFor, mimeTypeFor, DOCUMENT_KINDS } from '@/lib/fileValidation';
import { logError } from '@/lib/logger';

// Répertoire privé — jamais servi directement par le serveur statique.
const UPLOAD_DIR = path.join(process.cwd(), 'private-uploads', 'patients');

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !['doctor', 'pharmacist', 'laboratorist'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const patientId = formData.get('patientId') as string | null;

    if (!file) return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });
    if (!patientId) return NextResponse.json({ error: 'Patient ID requis' }, { status: 400 });

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 });
    }

    await connectDB();

    const record = await PatientRecord.findOne({ _id: patientId, proUserId: authUser.userId });
    if (!record) return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 });

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

    // `url` pointe vers la route de téléchargement protégée (auth par
    // cookie de session — cette fonctionnalité est web uniquement).
    record.documents.push({
      name: file.name || storedFilename,
      type: mimeTypeFor(kind),
      storedFilename,
      uploadedAt: new Date(),
      url: '',
    } as any);
    const created = record.documents[record.documents.length - 1];
    created.url = `/api/pro/patients/${patientId}/documents/${created._id.toString()}/download`;
    await record.save();

    return NextResponse.json({ document: created });
  } catch (error) {
    logError('Upload patient doc error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
