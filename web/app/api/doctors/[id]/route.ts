import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Doctor from '@/models/Doctor';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const doctor = await Doctor.findById(params.id).lean();
    if (!doctor) return NextResponse.json({ error: 'Médecin introuvable' }, { status: 404 });
    return NextResponse.json({ doctor });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
