import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Pharmacy from '@/models/Pharmacy';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const pharmacy = await Pharmacy.findById(params.id).lean();
    if (!pharmacy) return NextResponse.json({ error: 'Pharmacie introuvable' }, { status: 404 });
    return NextResponse.json({ pharmacy });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
