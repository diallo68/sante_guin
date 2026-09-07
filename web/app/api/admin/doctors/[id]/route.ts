import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Doctor from '@/models/Doctor';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  if (typeof body.isVerified === 'boolean') allowed.isVerified = body.isVerified;
  if (typeof body.isAvailable === 'boolean') allowed.isAvailable = body.isAvailable;

  const doctor = await Doctor.findByIdAndUpdate(id, allowed, { new: true });
  if (!doctor) return NextResponse.json({ error: 'Médecin introuvable' }, { status: 404 });

  return NextResponse.json({ doctor });
}
