import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
  // Nom sur disque dans le répertoire privé. Absent pour les pièces jointes
  // envoyées avant le passage au stockage privé (voir audit S06) — la route
  // de téléchargement retombe alors sur l'ancien fichier public.
  storedFilename?: string;
}

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: 'patient' | 'doctor' | 'pharmacist' | 'laboratorist';
  content: string;
  attachments: IAttachment[];
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    storedFilename: { type: String },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: Schema.Types.ObjectId, required: true },
    senderRole: {
      type: String,
      enum: ['patient', 'doctor', 'pharmacist', 'laboratorist'],
      required: true,
    },
    content: { type: String, required: true, trim: true },
    attachments: { type: [AttachmentSchema], default: [] },
    readBy: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
