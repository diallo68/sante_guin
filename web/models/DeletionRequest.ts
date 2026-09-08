import mongoose, { Schema, Document, Model } from 'mongoose';

// Persiste les demandes de suppression de compte plutôt que de ne
// dépendre que d'un email de notification : si Brevo est mal
// configuré ou indisponible, la demande était auparavant perdue sans
// aucune trace, alors même que l'API répondait un succès — voir audit B19.
export interface IDeletionRequest extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  emailSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeletionRequestSchema = new Schema<IDeletionRequest>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const DeletionRequest: Model<IDeletionRequest> =
  mongoose.models.DeletionRequest || mongoose.model<IDeletionRequest>('DeletionRequest', DeletionRequestSchema);

export default DeletionRequest;
