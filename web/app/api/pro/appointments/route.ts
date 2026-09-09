import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Doctor from '@/models/Doctor';
import Appointment from '@/models/Appointment';
import { logError } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();

    const doctor = await Doctor.findOne({ userId: authUser.userId }).lean();
    if (!doctor) {
      return NextResponse.json({ error: 'Profil médecin introuvable' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');
    const limit = parseInt(searchParams.get('limit') || '0');

    const query: Record<string, unknown> = { doctorId: doctor._id };
    if (status && status !== 'all') query.status = status;
    if (patientId) query.patientId = patientId;

    let q = Appointment.find(query)
      .populate('patientId', 'firstName lastName email phone')
      .sort({ date: -1 });

    if (limit > 0) q = q.limit(limit) as typeof q;

    const appointments = await q.lean();

    return NextResponse.json({ appointments });
  } catch (error) {
    logError('Pro appointments GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { appointmentId, status, notes } = body;

    if (!appointmentId || !status) {
      return NextResponse.json({ error: 'ID et statut requis' }, { status: 400 });
    }

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    await connectDB();

    const doctor = await Doctor.findOne({ userId: authUser.userId }).lean();
    if (!doctor) {
      return NextResponse.json({ error: 'Profil médecin introuvable' }, { status: 404 });
    }

    const appointment = await Appointment.findOneAndUpdate(
      { _id: appointmentId, doctorId: doctor._id },
      { status, ...(notes !== undefined && { notes }) },
      { new: true }
    ).populate('patientId', 'firstName lastName email phone');

    if (!appointment) {
      return NextResponse.json({ error: 'Rendez-vous introuvable' }, { status: 404 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    logError('Pro appointments PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get('id');

    if (!appointmentId) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await connectDB();

    const doctor = await Doctor.findOne({ userId: authUser.userId }).lean();
    if (!doctor) {
      return NextResponse.json({ error: 'Profil médecin introuvable' }, { status: 404 });
    }

    const appointment = await Appointment.findOneAndDelete({
      _id: appointmentId,
      doctorId: doctor._id,
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Rendez-vous introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('Pro appointments DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
