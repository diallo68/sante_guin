import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  role: 'patient' | 'doctor' | 'pharmacist' | 'admin';
  isVerified: boolean;
  isSuspended: boolean;
  favorites: {
    doctors: mongoose.Types.ObjectId[];
    pharmacies: mongoose.Types.ObjectId[];
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
    phone: { type: String, sparse: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'pharmacist', 'admin'],
      default: 'patient',
    },
    isVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    favorites: {
      doctors: [{ type: Schema.Types.ObjectId, ref: 'Doctor' }],
      pharmacies: [{ type: Schema.Types.ObjectId, ref: 'Pharmacy' }],
    },
  },
  { timestamps: true }
);

// Index unique sur email et phone (sparse = ignore null)
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
