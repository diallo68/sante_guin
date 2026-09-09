import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import Pharmacy from '@/models/Pharmacy';
import Laboratory from '@/models/Laboratory';
import { logError } from '@/lib/logger';

const PRO_ROLES = ['doctor', 'pharmacist', 'laboratorist'];

// `getAuthUser()` sans `req` ne lisait que le cookie web, jamais le Bearer
// mobile — voir audit B11.
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !PRO_ROLES.includes(authUser.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    // Sans borne supérieure, "ce mois-ci" incluait aussi tous les
    // rendez-vous futurs déjà pris pour les mois suivants — voir audit B28.
    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // ── Médecin ──
    if (authUser.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: authUser.userId }).lean();

      let stats = {
        todayAppointments: 0,
        monthAppointments: 0,
        pendingAppointments: 0,
        upcomingAppointments: [] as any[],
      };

      if (doctor) {
        const [todayCount, monthCount, pendingCount, upcoming] = await Promise.all([
          Appointment.countDocuments({
            doctorId: doctor._id,
            date: { $gte: today, $lt: tomorrow },
            status: { $in: ['confirmed', 'pending'] },
          }),
          Appointment.countDocuments({
            doctorId: doctor._id,
            date: { $gte: startOfMonth, $lt: startOfNextMonth },
            status: { $ne: 'cancelled' },
          }),
          Appointment.countDocuments({ doctorId: doctor._id, status: 'pending' }),
          Appointment.find({
            doctorId: doctor._id,
            date: { $gte: today },
            status: { $in: ['confirmed', 'pending'] },
          })
            .populate('patientId', 'firstName lastName phone email')
            .sort({ date: 1, time: 1 })
            .limit(5)
            .lean(),
        ]);

        stats = { todayAppointments: todayCount, monthAppointments: monthCount, pendingAppointments: pendingCount, upcomingAppointments: upcoming };
      }

      return NextResponse.json({ role: 'doctor', profile: doctor, stats });
    }

    // ── Pharmacien ──
    if (authUser.role === 'pharmacist') {
      const pharmacy = await Pharmacy.findOne({ userId: authUser.userId }).lean();
      return NextResponse.json({ role: 'pharmacist', profile: pharmacy });
    }

    // ── Laboratoriste ──
    if (authUser.role === 'laboratorist') {
      const laboratory = await Laboratory.findOne({ userId: authUser.userId }).lean();
      return NextResponse.json({ role: 'laboratorist', profile: laboratory });
    }

    return NextResponse.json({ error: 'Rôle inconnu' }, { status: 400 });
  } catch (error) {
    logError('Pro dashboard error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
