import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();
  const setFields: Record<string, unknown> = {};
  const ROLES = ['patient', 'doctor', 'pharmacist', 'laboratorist', 'admin'];
  if (typeof body.role === 'string' && ROLES.includes(body.role)) setFields.role = body.role;
  if (typeof body.isVerified === 'boolean') setFields.isVerified = body.isVerified;
  if (typeof body.isSuspended === 'boolean') setFields.isSuspended = body.isSuspended;

  // Un changement de rôle ou de statut de suspension révoque immédiatement
  // les tokens déjà émis pour ce compte, plutôt que d'attendre leur expiration.
  const revokesSessions = 'role' in setFields || 'isSuspended' in setFields;
  const update = revokesSessions
    ? { $set: setFields, $inc: { tokenVersion: 1 } }
    : { $set: setFields };

  const user = await User.findByIdAndUpdate(id, update, { new: true }).select('-passwordHash');
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  return NextResponse.json({ user });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  // Prevent self-deletion
  if (auth.userId === id) {
    return NextResponse.json({ error: 'Impossible de se supprimer soi-même' }, { status: 400 });
  }

  await connectDB();
  await User.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
