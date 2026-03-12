import mongoose, { Schema, Document } from 'mongoose';

export interface ITrade extends Document {
  initiator_id: mongoose.Types.ObjectId;
  receiver_id: mongoose.Types.ObjectId;
  offered_skill_id: mongoose.Types.ObjectId;
  sought_skill_id: mongoose.Types.ObjectId;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  completion_confirmed_initiator: boolean;
  completion_confirmed_receiver: boolean;
  created_at: Date;
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
    sought_skill_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
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
