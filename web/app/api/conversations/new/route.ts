import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Pharmacy from '@/models/Pharmacy';
import Laboratory from '@/models/Laboratory';
import Appointment from '@/models/Appointment';
import PatientRecord from '@/models/PatientRecord';

// GET /api/conversations/new — list available contacts to start a conversation with
export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  await connectDB();

  const contacts: Array<{
    userId: string;
    role: string;
    profileId: string;
    displayName: string;
    subtitle: string;
  }> = [];

  if (authUser.role === 'patient') {
    // Patients can contact: doctors, pharmacies, labs with active subscription
    const doctors = await Doctor.find({ subscriptionStatus: 'active' })
      .select('_id userId firstName lastName specialty')
      .lean();
    for (const d of doctors) {
      contacts.push({
        userId: String(d.userId),
        role: 'doctor',
        profileId: String(d._id),
        displayName: `Dr. ${d.firstName} ${d.lastName}`,
        subtitle: d.specialty,
      });
    }

    const pharmacies = await Pharmacy.find({ subscriptionStatus: 'active', userId: { $exists: true } })
      .select('_id userId name city')
      .lean();
    for (const p of pharmacies) {
      if (p.userId) {
        contacts.push({
          userId: String(p.userId),
          role: 'pharmacist',
          profileId: String(p._id),
          displayName: p.name,
          subtitle: `Pharmacie · ${p.city}`,
        });
      }
    }

    const labs = await Laboratory.find({ subscriptionStatus: 'active', userId: { $exists: true } })
      .select('_id userId name city')
      .lean();
    for (const l of labs) {
      if (l.userId) {
        contacts.push({
          userId: String(l.userId),
          role: 'laboratorist',
          profileId: String(l._id),
          displayName: l.name,
          subtitle: `Laboratoire · ${l.city}`,
        });
      }
    }
  } else {
    // Pros can contact: patients with an existing relationship (rendez-vous
    // ou dossier patient) + other pros. Sans cette restriction, n'importe
    // quel compte professionnel auto-déclaré pouvait lister jusqu'à 100
    // patients sans lien de soins — voir audit S16.
    const patientIds = new Set<string>();

    const doctorProfile = await Doctor.findOne({ userId: authUser.userId }).select('_id').lean();
    if (doctorProfile) {
      const apptPatientIds = await Appointment.distinct('patientId', { doctorId: doctorProfile._id });
      apptPatientIds.forEach((id: any) => patientIds.add(String(id)));
    }

    const manualRecords = await PatientRecord.find({ proUserId: authUser.userId, email: { $exists: true, $ne: '' } })
      .select('email')
      .lean();
    if (manualRecords.length > 0) {
      const emails = manualRecords.map(r => r.email).filter(Boolean);
      const linkedUsers = await User.find({ role: 'patient', email: { $in: emails } }).select('_id').lean();
      linkedUsers.forEach(u => patientIds.add(String(u._id)));
    }

    const patients = patientIds.size > 0
      ? await User.find({ _id: { $in: Array.from(patientIds) } })
          .select('_id firstName lastName')
          .limit(100)
          .lean()
      : [];
    for (const p of patients) {
      contacts.push({
        userId: String(p._id),
        role: 'patient',
        profileId: String(p._id),
        displayName: `${p.firstName} ${p.lastName}`,
        subtitle: 'Patient',
      });
    }

    const doctors = await Doctor.find({
      subscriptionStatus: 'active',
      userId: { $ne: authUser.userId },
    })
      .select('_id userId firstName lastName specialty')
      .lean();
    for (const d of doctors) {
      contacts.push({
        userId: String(d.userId),
        role: 'doctor',
        profileId: String(d._id),
        displayName: `Dr. ${d.firstName} ${d.lastName}`,
        subtitle: d.specialty,
      });
    }

    const pharmacies = await Pharmacy.find({
      subscriptionStatus: 'active',
      userId: { $exists: true, $ne: authUser.userId },
    })
      .select('_id userId name city')
      .lean();
    for (const p of pharmacies) {
      if (p.userId) {
        contacts.push({
          userId: String(p.userId),
          role: 'pharmacist',
          profileId: String(p._id),
          displayName: p.name,
          subtitle: `Pharmacie · ${p.city}`,
        });
      }
    }

    const labs = await Laboratory.find({
      subscriptionStatus: 'active',
      userId: { $exists: true, $ne: authUser.userId },
    })
      .select('_id userId name city')
      .lean();
    for (const l of labs) {
      if (l.userId) {
        contacts.push({
          userId: String(l.userId),
          role: 'laboratorist',
          profileId: String(l._id),
          displayName: l.name,
          subtitle: `Laboratoire · ${l.city}`,
        });
      }
    }
  }

  return NextResponse.json({ contacts });
}

type ConversationRole = 'patient' | 'doctor' | 'pharmacist' | 'laboratorist';
interface ResolvedParticipant {
  role: ConversationRole;
  profileId: mongoose.Types.ObjectId | undefined;
  displayName: string;
}

// Résout le rôle, le profil et le nom d'affichage d'un utilisateur à
// partir de son seul userId — jamais à partir de valeurs fournies par le
// client, qui pouvaient auparavant usurper le rôle ou le nom affiché d'un
// participant à la conversation — voir audit S16.
async function resolveParticipant(userId: string): Promise<ResolvedParticipant | null> {
  const user = await User.findById(userId).select('firstName lastName role').lean();
  if (!user) return null;

  if (user.role === 'patient') {
    return { role: 'patient', profileId: undefined, displayName: `${user.firstName} ${user.lastName}` };
  }

  const doc = await Doctor.findOne({ userId }).select('_id firstName lastName').lean();
  if (doc) return { role: 'doctor', profileId: doc._id, displayName: `Dr. ${doc.firstName} ${doc.lastName}` };

  const pharmacy = await Pharmacy.findOne({ userId }).select('_id name').lean();
  if (pharmacy) return { role: 'pharmacist', profileId: pharmacy._id, displayName: pharmacy.name };

  const lab = await Laboratory.findOne({ userId }).select('_id name').lean();
  if (lab) return { role: 'laboratorist', profileId: lab._id, displayName: lab.name };

  // Rôle sans profil de messagerie connu (ex : admin) — pas un participant
  // valide pour une conversation.
  return null;
}

// POST /api/conversations/new — create or reuse a document-sharing conversation
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { recipientUserId } = await req.json();

  if (!recipientUserId) {
    return NextResponse.json({ error: 'Destinataire requis' }, { status: 400 });
  }
  if (recipientUserId === authUser.userId) {
    return NextResponse.json({ error: 'Impossible de vous écrire à vous-même' }, { status: 400 });
  }

  await connectDB();

  const [sender, recipient] = await Promise.all([
    resolveParticipant(authUser.userId),
    resolveParticipant(recipientUserId),
  ]);

  if (!sender || !recipient) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  }

  // Check if a document conversation already exists between these two users
  const existing = await Conversation.findOne({
    type: 'document',
    'participants.userId': { $all: [authUser.userId, recipientUserId] },
    $expr: { $eq: [{ $size: '$participants' }, 2] },
  });

  if (existing) {
    return NextResponse.json({ conversation: existing, existing: true });
  }

  // Create new document conversation
  const conversation = await Conversation.create({
    type: 'document',
    participants: [
      {
        userId: authUser.userId,
        role: sender.role,
        profileId: sender.profileId,
        displayName: sender.displayName,
      },
      {
        userId: recipientUserId,
        role: recipient.role,
        profileId: recipient.profileId,
        displayName: recipient.displayName,
      },
    ],
    lastMessage: '',
    lastMessageAt: new Date(),
  });

  return NextResponse.json({ conversation, existing: false }, { status: 201 });
}
