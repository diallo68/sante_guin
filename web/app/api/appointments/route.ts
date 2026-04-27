import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { sendAppointmentConfirmation } from '@/lib/mailer';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await connectDB();

    const appointments = await Appointment.find({ patientId: authUser.userId })
      .populate('doctorId', 'firstName lastName specialty city photo')
      .sort({ date: -1 })
      .lean();

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Appointments list error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json();
    const { doctorId, date, time, reason } = body;

    if (!doctorId || !date || !time) {
      return NextResponse.json(
        { error: 'Médecin, date et heure sont requis' },
        { status: 400 }
      );
    }

    await connectDB();

    const conflict = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      time,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (conflict) {
      return NextResponse.json(
        { error: 'Ce créneau est déjà réservé' },
        { status: 409 }
      );
    }

    const appointment = await Appointment.create({
      patientId: authUser.userId,
      doctorId,
      date: new Date(date),
      time,
      reason,
    });

    // Créer la conversation + message initial (non-bloquant)
    Promise.all([
      User.findById(authUser.userId).select('firstName lastName email').lean(),
      Doctor.findById(doctorId).select('firstName lastName').lean(),
    ]).then(async ([patient, doctor]) => {
      if (patient && doctor) {
        const dateFormatted = new Date(date).toLocaleDateString('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long',
        });
        const firstMessage = `Bonjour Dr. ${doctor.firstName} ${doctor.lastName},\n\nJe souhaite un rendez-vous le ${dateFormatted} à ${time}.${reason ? `\n\nMotif : ${reason}` : ''}\n\nCordialement,\n${patient.firstName} ${patient.lastName}`;

        const conversation = await Conversation.create({
          doctorId,
          patientId: authUser.userId,
          appointmentId: appointment._id,
          lastMessage: firstMessage.split('\n')[0],
          lastMessageAt: new Date(),
        });

        await Message.create({
          conversationId: conversation._id,
          senderId: authUser.userId,
          senderRole: 'patient',
          content: firstMessage,
          readBy: [authUser.userId],
        });

        // Email optionnel
        if (patient.email) {
          sendAppointmentConfirmation({
            patientEmail: patient.email,
            patientName: `${patient.firstName} ${patient.lastName}`,
            doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
            date,
            time,
          }).catch(err => console.error('Email error:', err));
        }
      }
    }).catch(() => {});

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error('Appointment create error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
