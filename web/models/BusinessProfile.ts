import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBusinessProfile extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'medecin_independant' | 'cabinet' | 'clinique' | 'centre_sante' | 'pharmacie' | 'pharmacie_24h';
  name: string;
  phone: string;
  email?: string;
  location: string;
  address: string;
  description?: string;
  // Cabinet / Clinique
  specialties?: string[];
  doctorCount?: number;
  services?: string[];
  // Pharmacie
  isOpen24h?: boolean;
  hasDelivery?: boolean;
  // Horaires
  openTime?: string;
  closeTime?: string;
  openDays?: string[];
  // Schedule (per-day)
  schedule?: Array<{ day: string; startTime: string; endTime: string; isOpen: boolean }>;
  // Meta
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessProfileSchema = new Schema<IBusinessProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    type: {
      type: String,
      enum: ['medecin_independant', 'cabinet', 'clinique', 'centre_sante', 'pharmacie', 'pharmacie_24h'],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    location: { type: String, required: true },
    address: { type: String },
    description: { type: String },
    specialties: [{ type: String }],
    doctorCount: { type: Number, min: 1 },
    services: [{ type: String }],
    isOpen24h: { type: Boolean, default: false },
    hasDelivery: { type: Boolean, default: false },
    openTime: { type: String },
    closeTime: { type: String },
    openDays: [{ type: String }],
    schedule: [
      {
        day: { type: String },
        startTime: { type: String },
        endTime: { type: String },
        isOpen: { type: Boolean },
      },
    ],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const BusinessProfile: Model<IBusinessProfile> =
  mongoose.models.BusinessProfile ||
  mongoose.model<IBusinessProfile>('BusinessProfile', BusinessProfileSchema);

export default BusinessProfile;
