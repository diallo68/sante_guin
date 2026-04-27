import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Doctor from '@/models/Doctor';
import Pharmacy from '@/models/Pharmacy';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();
  const { type, id } = params;
  const Model = type === 'pharmacy' ? Pharmacy : Doctor;

  const allowed: Record<string, unknown> = {};
  if (typeof body.isVerified === 'boolean') allowed.isVerified = body.isVerified;
  if (typeof body.isAvailable === 'boolean') allowed.isAvailable = body.isAvailable;
  if (body.subscriptionStatus) allowed.subscriptionStatus = body.subscriptionStatus;
  if (body.subscriptionPlan) allowed.subscriptionPlan = body.subscriptionPlan;
  if (body.subscriptionExpiresAt) allowed.subscriptionExpiresAt = new Date(body.subscriptionExpiresAt);

  const doc = await Model.findByIdAndUpdate(id, allowed, { new: true });
  if (!doc) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  return NextResponse.json({ item: { ...doc.toObject(), _type: type } });
}
