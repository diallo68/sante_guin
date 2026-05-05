import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import SubscriptionRequest from '@/models/SubscriptionRequest';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const filter = status && status !== 'all' ? { status } : {};
  const requests = await SubscriptionRequest.find(filter).sort({ createdAt: -1 });

  return NextResponse.json({ requests });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { id, status, adminNote } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

  await connectDB();

  const update: any = {};
  if (status) update.status = status;
  if (adminNote !== undefined) update.adminNote = adminNote;

  const updated = await SubscriptionRequest.findByIdAndUpdate(id, update, { new: true });
  if (!updated) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });

  return NextResponse.json({ request: updated });
}
