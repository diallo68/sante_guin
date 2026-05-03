import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILaboratory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  city: string;
  address: string;
  photo?: string;
  analyses: string[];
  isOpen24h: boolean;
  openTime?: string;
  closeTime?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isAvailable: boolean;
  subscriptionStatus: 'active' | 'suspended' | 'expired' | 'none';
  subscriptionPlan?: string;
  subscriptionExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LaboratorySchema = new Schema<ILaboratory>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String },
    email: { type: String, lowercase: true },
    city: { type: String, required: true, default: 'Conakry' },
    address: { type: String, required: true },
    photo: { type: String },
    analyses: [{ type: String }],
    isOpen24h: { type: Boolean, default: false },
    openTime: { type: String, default: '07:00' },
    closeTime: { type: String, default: '18:00' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'suspended', 'expired', 'none'],
      default: 'none',
    },
    subscriptionPlan: { type: String },
    subscriptionExpiresAt: { type: Date },
  },
  { timestamps: true }
);

LaboratorySchema.index({ city: 1 });

const Laboratory: Model<ILaboratory> =
  mongoose.models.Laboratory ||
  mongoose.model<ILaboratory>('Laboratory', LaboratorySchema);

export default Laboratory;
