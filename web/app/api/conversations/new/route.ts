import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import User from '@/models/User';
import Doctor from '@/models/Doctor';
import Pharmacy from '@/models/Pharmacy';
import Laboratory from '@/models/Laboratory';

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
    // Pros can contact: patients + other pros (doctors, pharmacies, labs)
    const patients = await User.find({ role: 'patient' })
      .select('_id firstName lastName')
      .limit(100)
      .lean();
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

// POST /api/conversations/new — create or reuse a document-sharing conversation
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { recipientUserId, recipientRole, recipientProfileId, recipientDisplayName } =
    await req.json();

  if (!recipientUserId || !recipientRole || !recipientDisplayName) {
    return NextResponse.json({ error: 'Destinataire requis' }, { status: 400 });
  }
  if (recipientUserId === authUser.userId) {
    return NextResponse.json({ error: 'Impossible de vous écrire à vous-même' }, { status: 400 });
  }

  await connectDB();

  // Find sender display name
  let senderDisplayName = '';
  if (authUser.role === 'patient') {
    const user = await User.findById(authUser.userId).select('firstName lastName').lean();
    senderDisplayName = user ? `${user.firstName} ${user.lastName}` : 'Patient';
  } else {
    const doc = await Doctor.findOne({ userId: authUser.userId }).select('firstName lastName').lean();
    if (doc) {
      senderDisplayName = `Dr. ${doc.firstName} ${doc.lastName}`;
    } else {
      const pharmacy = await Pharmacy.findOne({ userId: authUser.userId }).select('name').lean();
      if (pharmacy) {
        senderDisplayName = pharmacy.name;
      } else {
        const lab = await Laboratory.findOne({ userId: authUser.userId }).select('name').lean();
        senderDisplayName = lab?.name ?? 'Professionnel';
      }
    }
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
  const senderDoc = authUser.role !== 'patient'
    ? await Doctor.findOne({ userId: authUser.userId }).select('_id').lean()
    : null;

  const conversation = await Conversation.create({
    type: 'document',
    participants: [
      {
        userId: authUser.userId,
        role: authUser.role,
        profileId: senderDoc?._id,
        displayName: senderDisplayName,
      },
      {
        userId: recipientUserId,
        role: recipientRole,
        profileId: recipientProfileId,
        displayName: recipientDisplayName,
      },
    ],
    lastMessage: '',
    lastMessageAt: new Date(),
  });

  return NextResponse.json({ conversation, existing: false }, { status: 201 });
}
