import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  doctorId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

// Un patient ne peut laisser qu'un avis par médecin
ReviewSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });
ReviewSchema.index({ doctorId: 1, createdAt: -1 });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
