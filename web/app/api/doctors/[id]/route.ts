import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Doctor from '@/models/Doctor';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const doctor = await Doctor.findById(id).lean();
    if (!doctor) return NextResponse.json({ error: 'Médecin introuvable' }, { status: 404 });
    return NextResponse.json({ doctor });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
