import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
  user_id: mongoose.Types.ObjectId;
  lat: number;
  lng: number;
  address: string;
  city: string;
}

const LocationSchema: Schema = new Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

export const Location = mongoose.model<ILocation>('Location', LocationSchema);
