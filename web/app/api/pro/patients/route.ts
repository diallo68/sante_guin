import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'doctor') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await connectDB();

    const doctor = await Doctor.findOne({ userId: authUser.userId }).lean();
    if (!doctor) {
      return NextResponse.json({ patients: [], total: 0 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = 20;

    // Agréger les rendez-vous par patient pour obtenir les stats de suivi
    const pipeline: any[] = [
      { $match: { doctorId: doctor._id } },
      {
        $group: {
          _id: '$patientId',
          totalAppointments: { $sum: 1 },
          completedAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          lastAppointmentDate: { $max: '$date' },
          lastReason: { $last: '$reason' },
          lastStatus: { $last: '$status' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'patient',
        },
      },
      { $unwind: '$patient' },
      {
        $project: {
          _id: 1,
          totalAppointments: 1,
          completedAppointments: 1,
          lastAppointmentDate: 1,
          lastReason: 1,
          lastStatus: 1,
          'patient._id': 1,
          'patient.firstName': 1,
          'patient.lastName': 1,
          'patient.email': 1,
          'patient.phone': 1,
          'patient.createdAt': 1,
        },
      },
    ];

    // Filtre de recherche
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'patient.firstName': { $regex: search, $options: 'i' } },
            { 'patient.lastName': { $regex: search, $options: 'i' } },
            { 'patient.email': { $regex: search, $options: 'i' } },
            { 'patient.phone': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    // Trier par dernière consultation
    pipeline.push({ $sort: { lastAppointmentDate: -1 } });

    // Compter le total avant pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const [countResult, patients] = await Promise.all([
      Appointment.aggregate(countPipeline),
      Appointment.aggregate([
        ...pipeline,
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    const total = countResult[0]?.total || 0;

    return NextResponse.json({
      patients,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Pro patients error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
