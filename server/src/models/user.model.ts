import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  bio?: string;
  avatar_url?: string;
  total_trades: number;
  average_rating: number;
  location_id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    bio: { type: String, trim: true, maxLength: 300, default: 'New Swap landed! 🚀' },
    avatar_url: {
      type: String,
      default: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Brooklynn',
    },
    total_trades: { type: Number, default: 0 },
    average_rating: { type: Number, default: 0 },
    location_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model<IUser>('User', UserSchema);
