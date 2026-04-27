import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAppointment extends Document {
  _id: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  date: Date;
  time: string;
  reason?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    reason: { type: String },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

AppointmentSchema.index({ patientId: 1, date: -1 });
AppointmentSchema.index({ doctorId: 1, date: -1 });

const Appointment: Model<IAppointment> =
  mongoose.models.Appointment ||
  mongoose.model<IAppointment>('Appointment', AppointmentSchema);

export default Appointment;
