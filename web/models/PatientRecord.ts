import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument {
  name: string;
  url: string;
  type: string;
  uploadedAt: Date;
}

export interface IPatientRecord extends Document {
  proUserId: mongoose.Types.ObjectId;  // docteur / pharmacien / laboratoriste
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  phone?: string;
  email?: string;
  gender?: 'homme' | 'femme' | 'autre';
  bloodGroup?: string;
  notes?: string;
  documents: IDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  name: { type: String, required: true },
  url:  { type: String, required: true },
  type: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const PatientRecordSchema = new Schema<IPatientRecord>(
  {
    proUserId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    firstName:   { type: String, required: true, trim: true },
    lastName:    { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    phone:       { type: String, trim: true },
    email:       { type: String, trim: true, lowercase: true },
    gender:      { type: String, enum: ['homme', 'femme', 'autre'] },
    bloodGroup:  { type: String },
    notes:       { type: String },
    documents:   { type: [DocumentSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.PatientRecord ||
  mongoose.model<IPatientRecord>('PatientRecord', PatientRecordSchema);
