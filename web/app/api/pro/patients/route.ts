import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import PatientRecord from '@/models/PatientRecord';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'doctor') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await connectDB();

    const doctor = await Doctor.findOne({ userId: authUser.userId }).lean();
    if (!doctor) {
      return NextResponse.json({ patients: [], manual: [], total: 0 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = 20;

    // ── Patients via rendez-vous ──
    const pipeline: any[] = [
      { $match: { doctorId: doctor._id } },
      {
        $group: {
          _id: '$patientId',
          totalAppointments: { $sum: 1 },
          completedAppointments: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          lastAppointmentDate: { $max: '$date' },
          lastReason: { $last: '$reason' },
          lastStatus: { $last: '$status' },
        },
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'patient' } },
      { $unwind: '$patient' },
      {
        $project: {
          _id: 1, totalAppointments: 1, completedAppointments: 1,
          lastAppointmentDate: 1, lastReason: 1, lastStatus: 1,
          'patient._id': 1, 'patient.firstName': 1, 'patient.lastName': 1,
          'patient.email': 1, 'patient.phone': 1, 'patient.createdAt': 1,
        },
      },
    ];

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

    pipeline.push({ $sort: { lastAppointmentDate: -1 } });

    const countPipeline = [...pipeline, { $count: 'total' }];
    const [countResult, patients] = await Promise.all([
      Appointment.aggregate(countPipeline),
      Appointment.aggregate([...pipeline, { $skip: (page - 1) * limit }, { $limit: limit }]),
    ]);

    // ── Patients enregistrés manuellement ──
    const manualQuery: any = { proUserId: authUser.userId };
    if (search) {
      manualQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const manual = await PatientRecord.find(manualQuery).sort({ createdAt: -1 }).lean();

    const total = countResult[0]?.total || 0;

    return NextResponse.json({
      patients,
      manual,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Pro patients error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !['doctor', 'pharmacist', 'laboratorist'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await connectDB();

    const body = await req.json();
    const { firstName, lastName, dateOfBirth, phone, email, gender, bloodGroup, notes } = body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: 'Nom et prénom requis' }, { status: 400 });
    }

    const record = await PatientRecord.create({
      proUserId: authUser.userId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      phone: phone?.trim() || undefined,
      email: email?.trim() || undefined,
      gender: gender || undefined,
      bloodGroup: bloodGroup || undefined,
      notes: notes?.trim() || undefined,
      documents: [],
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error('Create patient error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
