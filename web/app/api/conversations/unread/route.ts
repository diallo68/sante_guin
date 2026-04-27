import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Doctor from '@/models/Doctor';

// GET /api/conversations/unread — total unread count for badge
export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return NextResponse.json({ count: 0 });

  await connectDB();

  let convIds: string[];

  if (authUser.role === 'doctor' || authUser.role === 'pharmacist') {
    const doctor = await Doctor.findOne({ userId: authUser.userId }).select('_id').lean();
    if (!doctor) return NextResponse.json({ count: 0 });
    const convs = await Conversation.find({ doctorId: doctor._id }).select('_id').lean();
    convIds = convs.map(c => String(c._id));
  } else {
    const convs = await Conversation.find({ patientId: authUser.userId }).select('_id').lean();
    convIds = convs.map(c => String(c._id));
  }

  if (convIds.length === 0) return NextResponse.json({ count: 0 });

  const count = await Message.countDocuments({
    conversationId: { $in: convIds },
    senderId: { $ne: authUser.userId },
    readBy: { $ne: authUser.userId },
  });

  return NextResponse.json({ count });
}
