import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: 'patient' | 'doctor';
  content: string;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: Schema.Types.ObjectId, required: true },
    senderRole: { type: String, enum: ['patient', 'doctor'], required: true },
    content: { type: String, required: true, trim: true },
    readBy: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
