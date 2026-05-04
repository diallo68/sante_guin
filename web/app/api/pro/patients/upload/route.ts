import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import PatientRecord from '@/models/PatientRecord';

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
];

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

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non autorisé (images ou PDF uniquement)' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 });
    }

    await connectDB();

    const record = await PatientRecord.findOne({ _id: patientId, proUserId: authUser.userId });
    if (!record) return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const filename = `patient_${patientId}_${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'patients');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const fileUrl = `/uploads/patients/${filename}`;

    record.documents.push({
      name: file.name,
      url: fileUrl,
      type: file.type,
      uploadedAt: new Date(),
    });
    await record.save();

    return NextResponse.json({ document: record.documents[record.documents.length - 1] });
  } catch (error) {
    console.error('Upload patient doc error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
