import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Doctor from '@/models/Doctor';
import { detectFileKind, safeExtensionFor, IMAGE_KINDS } from '@/lib/fileValidation';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'doctor') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });
    }

    // Limite 5 Mo
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'La photo ne doit pas dépasser 5 Mo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Type réel vérifié par signature binaire (jamais par le Content-Type
    // déclaré par le client). Le SVG est délibérément exclu : bien que son
    // Content-Type commence par "image/", il peut embarquer du script et
    // ce fichier est servi publiquement — voir audit S07.
    const kind = detectFileKind(buffer);
    if (!kind || !IMAGE_KINDS.includes(kind)) {
      return NextResponse.json({ error: 'Le fichier doit être une image (JPEG, PNG, WEBP ou GIF)' }, { status: 400 });
    }

    // Nom de fichier généré côté serveur, jamais dérivé du nom fourni par le client.
    const filename = `doctor_${authUser.userId}_${Date.now()}.${safeExtensionFor(kind)}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'doctors');

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const photoUrl = `/uploads/doctors/${filename}`;

    // Mettre à jour le profil Doctor
    await connectDB();
    const doctor = await Doctor.findOneAndUpdate(
      { userId: authUser.userId },
      { photo: photoUrl },
      { new: true }
    ).lean();

    if (!doctor) {
      return NextResponse.json({ error: 'Profil médecin introuvable' }, { status: 404 });
    }

    return NextResponse.json({ photoUrl, doctor });
  } catch (error) {
    console.error('Upload photo error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 });
  }
}
