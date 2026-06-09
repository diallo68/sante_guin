import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email?: string;
  passwordHash: string;
  role: 'patient' | 'doctor' | 'pharmacist' | 'laboratorist' | 'admin';
  isVerified: boolean;
  isSuspended: boolean;
  otpCode?: string;
  otpExpiry?: Date;
  favorites: {
    doctors: mongoose.Types.ObjectId[];
    pharmacies: mongoose.Types.ObjectId[];
    laboratories: mongoose.Types.ObjectId[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'pharmacist', 'laboratorist', 'admin'],
      default: 'patient',
    },
    isVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    otpCode: { type: String },
    otpExpiry: { type: Date },
    favorites: {
      doctors: [{ type: Schema.Types.ObjectId, ref: 'Doctor' }],
      pharmacies: [{ type: Schema.Types.ObjectId, ref: 'Pharmacy' }],
      laboratories: [{ type: Schema.Types.ObjectId, ref: 'Laboratory' }],
    },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true, sparse: true });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
