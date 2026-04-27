import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'documents');

// In-memory store (replace with DB in production)
// Key: userId, Value: array of document metadata
const documentStore = new Map<string, Array<{
  id: string;
  name: string;
  category: string;
  uploadDate: string;
  size: string;
  url: string;
}>>();

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const docs = documentStore.get(authUser.userId) || [];
    return NextResponse.json({ documents: docs });
  } catch (error) {
    console.error('Documents GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
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

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const ext = path.extname(file.name);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const fileName = `${authUser.userId}-${id}${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const sizeKB = Math.round(file.size / 1024);
    const sizeStr = sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

    const doc = {
      id,
      name: file.name,
      category,
      uploadDate: new Date().toISOString(),
      size: sizeStr,
      url: `/uploads/documents/${fileName}`,
    };

    const existing = documentStore.get(authUser.userId) || [];
    documentStore.set(authUser.userId, [...existing, doc]);

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    console.error('Documents POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const docs = documentStore.get(authUser.userId) || [];
    const doc = docs.find(d => d.id === id);

    if (!doc) {
      return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'public', doc.url);
    try { await unlink(filePath); } catch { /* file may not exist */ }

    documentStore.set(authUser.userId, docs.filter(d => d.id !== id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Documents DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
