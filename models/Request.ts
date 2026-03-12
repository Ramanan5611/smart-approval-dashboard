import mongoose, { Document, Schema } from 'mongoose';
import { RequestStage, RequestStatus, LogEntry } from '../types';

export interface IRequest extends Document {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  title: string;
  description: string;
  currentStage: RequestStage;
  status: RequestStatus;
  logs: LogEntry[];
  complianceScore?: number;
  complianceReason?: string;
  requestType?: string;
  priority?: string;
  studentIdNumber?: string;
  needsFacultyApproval?: boolean;
  needsHodApproval?: boolean;
  needsOdApproval?: boolean;
  needsLeaveApproval?: boolean;
  needsMailIdUnblock?: boolean;
  email?: string;
  phone?: string;
  mailIdReason?: string;
  additionalNotes?: string;
  eventType?: string;
  eventId?: string;
  studentRegistrationNumber?: string;
  eventStatusImageUrl?: string;
  fromDate?: string;
  fromTime?: string;
  toDate?: string;
  toTime?: string;
  enteredMailId?: string;
}

const LogEntrySchema = new Schema({
  date: {
    type: String,
    required: true
  },
  actorName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  comment: {
    type: String
  }
}, { _id: false });

const RequestSchema = new Schema<IRequest>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  currentStage: {
    type: String,
    enum: Object.values(RequestStage),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(RequestStatus),
    required: true
  },
  logs: [LogEntrySchema],
  complianceScore: {
    type: Number,
    min: 0,
    max: 100
  },
  complianceReason: {
    type: String
  },
  requestType: { type: String },
  priority: { type: String },
  studentIdNumber: { type: String },
  needsFacultyApproval: { type: Boolean, default: false },
  needsHodApproval: { type: Boolean, default: false },
  needsOdApproval: { type: Boolean, default: false },
  needsLeaveApproval: { type: Boolean, default: false },
  needsMailIdUnblock: { type: Boolean, default: false },
  email: { type: String },
  phone: { type: String },
  mailIdReason: { type: String },
  additionalNotes: { type: String },
  // Custom Fields
  eventType: { type: String },
  eventId: { type: String },
  studentRegistrationNumber: { type: String },
  eventStatusImageUrl: { type: String },
  fromDate: { type: String },
  fromTime: { type: String },
  toDate: { type: String },
  toTime: { type: String },
  enteredMailId: { type: String }
}, {
  timestamps: true
});

// Add a virtual for formatted ID
RequestSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Ensure virtuals are serialized
RequestSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model<IRequest>('Request', RequestSchema);
