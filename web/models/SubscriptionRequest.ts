import mongoose, { Schema, Document, models } from 'mongoose';

export interface ISubscriptionRequest extends Document {
  nom: string;
  telephone: string;
  email: string;
  localisation: string;
  planName: string;
  message: string;
  status: 'pending' | 'contacted' | 'active' | 'rejected';
  adminNote: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionRequestSchema = new Schema<ISubscriptionRequest>(
  {
    nom: { type: String, required: true },
    telephone: { type: String, required: true },
    email: { type: String, default: '' },
    localisation: { type: String, default: '' },
    planName: { type: String, required: true },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'active', 'rejected'],
      default: 'pending',
    },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

export default models.SubscriptionRequest ||
  mongoose.model<ISubscriptionRequest>('SubscriptionRequest', SubscriptionRequestSchema);
