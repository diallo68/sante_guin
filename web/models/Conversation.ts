import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IParticipant {
  userId: mongoose.Types.ObjectId;
  role: 'patient' | 'doctor' | 'pharmacist' | 'laboratorist';
  profileId?: mongoose.Types.ObjectId;
  displayName: string;
}

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  type: 'appointment' | 'document';
  // Appointment-based conversations (legacy)
  doctorId?: mongoose.Types.ObjectId;
  patientId?: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  // Document-sharing conversations (flexible)
  participants: IParticipant[];
  lastMessage: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['patient', 'doctor', 'pharmacist', 'laboratorist'], required: true },
    profileId: { type: Schema.Types.ObjectId },
    displayName: { type: String, required: true },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    type: { type: String, enum: ['appointment', 'document'], default: 'appointment' },
    // Appointment-based (optional for document conversations)
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    patientId: { type: Schema.Types.ObjectId, ref: 'User' },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    // Document-sharing participants
    participants: { type: [ParticipantSchema], default: [] },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ConversationSchema.index({ doctorId: 1, patientId: 1 });
ConversationSchema.index({ patientId: 1, lastMessageAt: -1 });
ConversationSchema.index({ doctorId: 1, lastMessageAt: -1 });
ConversationSchema.index({ 'participants.userId': 1, lastMessageAt: -1 });

const Conversation: Model<IConversation> =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;
