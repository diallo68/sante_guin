import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { sendEmail, emailAppointmentConfirmation } from '@/lib/email';

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

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

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

    if (typeof time !== 'string' || !TIME_RE.test(time)) {
      return NextResponse.json({ error: 'Heure invalide' }, { status: 400 });
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
    }

    // Comparaison par jour calendaire (pas par horodatage exact) pour
    // éviter les faux positifs liés au fuseau horaire du navigateur —
    // voir audit B04/B27.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDay = new Date(parsedDate);
    requestedDay.setHours(0, 0, 0, 0);
    if (requestedDay < today) {
      return NextResponse.json({ error: 'La date du rendez-vous est déjà passée' }, { status: 400 });
    }

    await connectDB();

    // Le médecin doit exister et être disponible : sans ce contrôle, un
    // rendez-vous pouvait être créé pour un identifiant inexistant ou un
    // médecin explicitement indisponible — voir audit B04.
    const doctor = await Doctor.findById(doctorId).select('firstName lastName isAvailable').lean();
    if (!doctor) {
      return NextResponse.json({ error: 'Médecin introuvable' }, { status: 404 });
    }
    if (doctor.isAvailable === false) {
      return NextResponse.json({ error: 'Ce médecin n\'accepte pas de nouveaux rendez-vous actuellement' }, { status: 409 });
    }

    // Rendez-vous + conversation + premier message créés en une seule
    // transaction : sans ça, un rendez-vous pouvait réussir sans que la
    // conversation associée soit jamais créée (erreur avalée par le bloc
    // non-bloquant) — voir audit B18. La contrainte unique sur
    // {doctorId, date, time} rend la double réservation concurrente
    // impossible même en cas de requêtes simultanées — voir audit B03.
    const patient = await User.findById(authUser.userId).select('firstName lastName email').lean();
    if (!patient) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const session = await mongoose.startSession();
    let appointment;
    try {
      await session.withTransaction(async () => {
        const [createdAppointment] = await Appointment.create(
          [{ patientId: authUser.userId, doctorId, date: parsedDate, time, reason }],
          { session }
        );
        appointment = createdAppointment;

        const dateFormatted = parsedDate.toLocaleDateString('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long',
        });
        const firstMessage = `Bonjour Dr. ${doctor.firstName} ${doctor.lastName},\n\nJe souhaite un rendez-vous le ${dateFormatted} à ${time}.${reason ? `\n\nMotif : ${reason}` : ''}\n\nCordialement,\n${patient.firstName} ${patient.lastName}`;

        const [conversation] = await Conversation.create(
          [{
            type: 'appointment',
            doctorId,
            patientId: authUser.userId,
            appointmentId: createdAppointment._id,
            lastMessage: firstMessage.split('\n')[0],
            lastMessageAt: new Date(),
          }],
          { session }
        );

        await Message.create(
          [{
            conversationId: conversation._id,
            senderId: authUser.userId,
            senderRole: 'patient',
            content: firstMessage,
            readBy: [authUser.userId],
          }],
          { session }
        );
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        return NextResponse.json({ error: 'Ce créneau est déjà réservé' }, { status: 409 });
      }
      throw err;
    } finally {
      await session.endSession();
    }

    // Email de confirmation (non-bloquant : un échec d'envoi ne doit pas
    // annuler un rendez-vous déjà confirmé en base).
    if (patient.email) {
      const dateFormatted2 = parsedDate.toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });
      const tpl = emailAppointmentConfirmation({
        patientFirstName: patient.firstName,
        doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        date: dateFormatted2,
        time,
        reason,
      });
      sendEmail({ to: patient.email, ...tpl }).catch(() => {});
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error('Appointment create error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
