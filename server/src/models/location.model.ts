import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
  user_id: mongoose.Types.ObjectId;
  geo_location: {
    type: string;
    coordinates: [number, number];
  };
  address: string;
  city: string;
}

const LocationSchema: Schema = new Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    geo_location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (v: number[]) {
            return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
          },
          message: 'Invalid coordinates. Must be [longitude, latitude].',
        },
      },
    },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
  },
);

LocationSchema.index({ geo_location: '2dsphere' });

export const Location = mongoose.model<ILocation>('Location', LocationSchema);
