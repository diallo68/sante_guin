import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  lastMessage: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ConversationSchema.index({ doctorId: 1, patientId: 1 });
ConversationSchema.index({ patientId: 1, lastMessageAt: -1 });
ConversationSchema.index({ doctorId: 1, lastMessageAt: -1 });

const Conversation: Model<IConversation> =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;
