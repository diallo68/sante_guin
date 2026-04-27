import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDoctor extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  specialty: string;
  phone?: string;
  email?: string;
  city: string;
  address?: string;
  bio?: string;
  photo?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isAvailable: boolean;
  consultationFee?: number;
  languages: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    specialty: { type: String, required: true },
    phone: { type: String },
    email: { type: String, lowercase: true },
    city: { type: String, required: true, default: 'Conakry' },
    address: { type: String },
    bio: { type: String },
    photo: { type: String },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    consultationFee: { type: Number },
    languages: { type: [String], default: ['Français'] },
  },
  { timestamps: true }
);

DoctorSchema.index({ specialty: 1 });
DoctorSchema.index({ city: 1 });
DoctorSchema.index({ isAvailable: 1 });

const Doctor: Model<IDoctor> =
  mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema);

export default Doctor;
