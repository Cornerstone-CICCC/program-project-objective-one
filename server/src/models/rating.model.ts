import mongoose, { Schema, Document } from 'mongoose';

export interface IRating extends Document {
  trade_id: mongoose.Types.ObjectId;
  reviewer_id: mongoose.Types.ObjectId;
  reviewee_id: mongoose.Types.ObjectId;
  score: number;
  comment?: string;
  created_at: Date;
}

const RatingSchema: Schema = new Schema(
  {
    trade_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trade',
      required: true,
    },
    reviewer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

RatingSchema.index({ trade_id: 1, reviewer_id: 1 }, { unique: true });

RatingSchema.index({ reviewee_id: 1 });

export const Rating = mongoose.model<IRating>('Rating', RatingSchema);
