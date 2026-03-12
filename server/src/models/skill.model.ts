import mongoose, { Schema, Document } from 'mongoose';

export interface ISkill extends Document {
  name: string;
  category: string;
  is_active: boolean;
  created_at: Date;
}

const SkillSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Tech',
        'Design',
        'Language',
        'Business',
        'Music',
        'Lifestyle',
        'Fitness',
        'Academics',
      ],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Skill = mongoose.model<ISkill>('Skill', SkillSchema);
