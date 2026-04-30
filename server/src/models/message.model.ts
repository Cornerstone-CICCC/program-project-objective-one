import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  trade_id: mongoose.Types.ObjectId;
  sender_id: mongoose.Types.ObjectId;
  content: string;
  is_read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    trade_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trade',
      required: true,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

MessageSchema.index({ trade_id: 1, createdAt: 1 });

MessageSchema.index({ trade_id: 1, sender_id: 1, is_read: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
