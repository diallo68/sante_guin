import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dob?: Date;
  city?: string;
  passwordHash: string;
  role: 'patient' | 'doctor' | 'pharmacist' | 'laboratorist' | 'admin';
  isVerified: boolean;
  isSuspended: boolean;
  tokenVersion: number;
  otpCode?: string;
  otpExpiry?: Date;
  // Horodatage de l'acceptation des CGU/politique de confidentialité à
  // l'inscription — voir audit RA-09. Absent sur les comptes créés avant
  // l'introduction de ce contrôle serveur.
  acceptedTermsAt?: Date;
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
      // `sparse` seul ici, sans `index`/`unique` : l'index réel (unique,
      // sparse) est déclaré explicitement plus bas via `.index()`, pour ne
      // pas le déclarer deux fois (avertissement Mongoose sinon).
      type: String,
      lowercase: true,
      trim: true,
    },
    // Absent jusqu'ici : les mises à jour de profil qui l'incluaient
    // étaient silencieusement ignorées par Mongoose (mode `strict` par
    // défaut) — voir audit B10.
    phone: { type: String, sparse: true, trim: true },
    // Facultatifs côté schéma (le mobile n'envoie encore ni l'un ni
    // l'autre à l'inscription) mais demandés systématiquement par le
    // formulaire web conversationnel — voir /api/auth/signup.
    dob: { type: Date },
    city: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'pharmacist', 'laboratorist', 'admin'],
      default: 'patient',
    },
    isVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    // Incrémenté à chaque changement de mot de passe ou action admin
    // (suspension, changement de rôle) pour révoquer immédiatement les
    // tokens déjà émis, sans attendre leur expiration.
    tokenVersion: { type: Number, default: 0 },
    otpCode: { type: String },
    otpExpiry: { type: Date },
    acceptedTermsAt: { type: Date },
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
