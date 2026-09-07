import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Laboratory from '@/models/Laboratory';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const laboratory = await Laboratory.findById(id).lean();
    if (!laboratory) return NextResponse.json({ error: 'Laboratoire introuvable' }, { status: 404 });
    return NextResponse.json({ laboratory });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
