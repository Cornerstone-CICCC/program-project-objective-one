import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSkill extends Document {
  user_id: mongoose.Types.ObjectId;
  skill_id: mongoose.Types.ObjectId;
  type: 'TEACH' | 'LEARN';
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  description?: string;
}

const UserSkillSchema: Schema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skill_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    type: {
      type: String,
      enum: ['TEACH', 'LEARN'],
      required: true,
    },
    proficiency: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Intermediate',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

UserSkillSchema.index({ user_id: 1, skill_id: 1, type: 1 }, { unique: true });

export const UserSkill = mongoose.model<IUserSkill>('UserSkill', UserSkillSchema);
