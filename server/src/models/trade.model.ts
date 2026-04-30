import mongoose, { Schema, Document } from 'mongoose';

export interface ITrade extends Document {
  initiator_id: mongoose.Types.ObjectId;
  receiver_id: mongoose.Types.ObjectId;
  offered_skill_id: mongoose.Types.ObjectId;
  received_skill_id: mongoose.Types.ObjectId;

  message?: string;
  proposed_location?: string;
  cancellation_reason?: string;
  hidden_by: mongoose.Types.ObjectId[];

  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  completion_confirmed_initiator: boolean;
  completion_confirmed_receiver: boolean;
  createdAt: Date;
  completed_at?: Date;
}

const TradeSchema: Schema = new Schema(
  {
    initiator_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    offered_skill_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    received_skill_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    proposed_location: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    cancellation_reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    hidden_by: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    completion_confirmed_initiator: {
      type: Boolean,
      default: false,
    },
    completion_confirmed_receiver: {
      type: Boolean,
      default: false,
    },
    completed_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

TradeSchema.index({ initiator_id: 1, status: 1 });
TradeSchema.index({ receiver_id: 1, status: 1 });

export const Trade = mongoose.model<ITrade>('Trade', TradeSchema);
