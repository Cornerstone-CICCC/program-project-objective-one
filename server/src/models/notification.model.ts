import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient_id: mongoose.Types.ObjectId;
  type:
    | 'SWAP_REQUESTED'
    | 'SWAP_ACCEPTED'
    | 'SWAP_CANCELLED'
    | 'PARTNER_COMPLETED'
    | 'SWAP_COMPLETED'
    | 'NEW_EVALUATION'
    | 'SYSTEM_ALERT';
  title: string;
  message: string;
  is_read: boolean;
  trade_id?: mongoose.Types.ObjectId;
  partner_id?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    is_read: { type: Boolean, default: false },
    trade_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Trade' },
    partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
