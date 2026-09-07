import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Doctor from '@/models/Doctor';
import Pharmacy from '@/models/Pharmacy';
import Laboratory from '@/models/Laboratory';

// Traité de façon polymorphe (mise à jour/suppression par id, indépendante
// des champs propres à chaque type) : type effacé en `Model<any>` pour
// éviter un conflit de surcharge TypeScript entre les trois modèles, qui
// n'apporterait ici aucune sécurité de type réelle.
function getModel(type: string): mongoose.Model<any> {
  if (type === 'pharmacy') return Pharmacy;
  if (type === 'laboratory') return Laboratory;
  return Doctor;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();
  const Model = getModel(type);

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  await connectDB();
  const Model = getModel(type);

  const doc = await Model.findByIdAndDelete(id);
  if (!doc) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  return NextResponse.json({ message: 'Supprimé avec succès' });
}
