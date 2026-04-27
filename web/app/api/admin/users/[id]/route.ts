import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  if (body.role) allowed.role = body.role;
  if (typeof body.isVerified === 'boolean') allowed.isVerified = body.isVerified;
  if (typeof body.isSuspended === 'boolean') allowed.isSuspended = body.isSuspended;

  const user = await User.findByIdAndUpdate(params.id, allowed, { new: true }).select('-passwordHash');
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  return NextResponse.json({ user });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  // Prevent self-deletion
  if (auth.userId === params.id) {
    return NextResponse.json({ error: 'Impossible de se supprimer soi-même' }, { status: 400 });
  }

  await connectDB();
  await User.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}
