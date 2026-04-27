import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPharmacy extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  city: string;
  address: string;
  photo?: string;
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

const PharmacySchema = new Schema<IPharmacy>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String },
    email: { type: String, lowercase: true },
    city: { type: String, required: true, default: 'Conakry' },
    address: { type: String, required: true },
    photo: { type: String },
    isOpen24h: { type: Boolean, default: false },
    openTime: { type: String, default: '08:00' },
    closeTime: { type: String, default: '20:00' },
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

PharmacySchema.index({ city: 1 });

const Pharmacy: Model<IPharmacy> =
  mongoose.models.Pharmacy ||
  mongoose.model<IPharmacy>('Pharmacy', PharmacySchema);

export default Pharmacy;
