import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import PatientRecord from '@/models/PatientRecord';
import { escapeRegex } from '@/lib/queryHelpers';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    // Le POST accepte les trois rôles pro ; le GET n'en acceptait qu'un
    // (un pharmacien/laboratoriste pouvait donc créer un dossier patient
    // mais jamais le revoir dans sa propre liste) — voir audit B13.
    if (!authUser || !['doctor', 'pharmacist', 'laboratorist'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = 20;

    // ── Patients via rendez-vous : uniquement pertinent pour les médecins,
    // seul rôle ayant des rendez-vous dans ce système.
    let patients: unknown[] = [];
    let total = 0;

    if (authUser.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: authUser.userId }).lean();

      if (doctor) {
        const pipeline: any[] = [
          { $match: { doctorId: doctor._id } },
          // `$last` dépend de l'ordre d'arrivée des documents dans le
          // groupe : sans ce tri explicite par date, cet ordre n'est pas
          // garanti et "dernier motif/statut" pouvait être arbitraire,
          // pas réellement le plus récent — voir audit B28.
          { $sort: { date: 1 } },
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
          const pattern = escapeRegex(search);
          pipeline.push({
            $match: {
              $or: [
                { 'patient.firstName': { $regex: pattern, $options: 'i' } },
                { 'patient.lastName': { $regex: pattern, $options: 'i' } },
                { 'patient.email': { $regex: pattern, $options: 'i' } },
                { 'patient.phone': { $regex: pattern, $options: 'i' } },
              ],
            },
          });
        }

        pipeline.push({ $sort: { lastAppointmentDate: -1 } });

        const countPipeline = [...pipeline, { $count: 'total' }];
        const [countResult, doctorPatients] = await Promise.all([
          Appointment.aggregate(countPipeline),
          Appointment.aggregate([...pipeline, { $skip: (page - 1) * limit }, { $limit: limit }]),
        ]);
        patients = doctorPatients;
        total = countResult[0]?.total || 0;
      }
    }

    // ── Patients enregistrés manuellement (les trois rôles pro) ──
    const manualQuery: any = { proUserId: authUser.userId };
    if (search) {
      const pattern = escapeRegex(search);
      manualQuery.$or = [
        { firstName: { $regex: pattern, $options: 'i' } },
        { lastName: { $regex: pattern, $options: 'i' } },
        { phone: { $regex: pattern, $options: 'i' } },
        { email: { $regex: pattern, $options: 'i' } },
      ];
    }
    const manual = await PatientRecord.find(manualQuery).sort({ createdAt: -1 }).lean();

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
