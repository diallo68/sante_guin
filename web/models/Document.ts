import mongoose, { Schema, Document as MongooseDocument, Model } from 'mongoose';

// Remplace l'ancien stockage en mémoire (perdu à chaque redémarrage,
// incohérent entre plusieurs instances) par une collection persistante.
export interface IDocument extends MongooseDocument {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  mimeType: string;
  storedFilename: string; // nom sur disque, dans le répertoire privé — jamais dérivé du nom client
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, default: 'Autres' },
    mimeType: { type: String, required: true },
    storedFilename: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { timestamps: true }
);

export default (mongoose.models.Document as Model<IDocument>) ||
  mongoose.model<IDocument>('Document', DocumentSchema);
