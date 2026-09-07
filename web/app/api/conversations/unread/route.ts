import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Doctor from '@/models/Doctor';

// GET /api/conversations/unread — total unread count for badge
//
// Reprend la même logique que GET /api/conversations (liste) : les
// pharmaciens/laboratoristes n'ont pas de profil Doctor (ils étaient
// auparavant toujours comptés à 0), et les conversations de type
// "document" (partage de documents, tous rôles) n'étaient jamais prises
// en compte pour personne — voir audit B24.
export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ count: 0 });

  await connectDB();

  const convIds = new Set<string>();

  if (authUser.role === 'doctor' || authUser.role === 'pharmacist' || authUser.role === 'laboratorist') {
    const doctor = await Doctor.findOne({ userId: authUser.userId }).select('_id').lean();
    if (doctor) {
      const apptConvs = await Conversation.find({ type: 'appointment', doctorId: doctor._id }).select('_id').lean();
      apptConvs.forEach(c => convIds.add(String(c._id)));
    }
  } else {
    const apptConvs = await Conversation.find({ type: 'appointment', patientId: authUser.userId }).select('_id').lean();
    apptConvs.forEach(c => convIds.add(String(c._id)));
  }

  const docConvs = await Conversation.find({ type: 'document', 'participants.userId': authUser.userId })
    .select('_id')
    .lean();
  docConvs.forEach(c => convIds.add(String(c._id)));

  if (convIds.size === 0) return NextResponse.json({ count: 0 });

  const count = await Message.countDocuments({
    conversationId: { $in: Array.from(convIds) },
    senderId: { $ne: authUser.userId },
    readBy: { $ne: authUser.userId },
  });

  return NextResponse.json({ count });
}
