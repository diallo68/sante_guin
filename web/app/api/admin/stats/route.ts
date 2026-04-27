import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Pharmacy from '@/models/Pharmacy';
import Appointment from '@/models/Appointment';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  await connectDB();

  const [
    totalUsers,
    totalDoctors,
    verifiedDoctors,
    totalPharmacies,
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    newUsersThisMonth,
  ] = await Promise.all([
    User.countDocuments(),
    Doctor.countDocuments(),
    Doctor.countDocuments({ isVerified: true }),
    Pharmacy.countDocuments(),
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: 'pending' }),
    Appointment.countDocuments({ status: 'confirmed' }),
    User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    }),
  ]);

  const roleBreakdown = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);

  return NextResponse.json({
    totalUsers,
    totalDoctors,
    verifiedDoctors,
    totalPharmacies,
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    newUsersThisMonth,
    roleBreakdown,
  });
}
