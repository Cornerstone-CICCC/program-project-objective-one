import { UserSkill, IUserSkill } from '../models/userSkill.model';

// Add Skill to User profile
const add = async (userId: string, data: Partial<IUserSkill>) => {
  // Validate required fields
  if (!data.skill_id || !data.type) {
    throw new Error('Skill ID and Type (TEACH/LEARN) are required.');
  }

  // Check for duplicates
  const existing = await UserSkill.findOne({
    user_id: userId,
    skill_id: data.skill_id,
    type: data.type,
  });

  if (existing) {
    throw new Error(`You already have this skill listed as ${data.type}.`);
  }

  // Create the entry
  const newEntry = await UserSkill.create({
    ...data,
    user_id: userId,
  });

  // Return result
  return await newEntry.populate('skill_id', 'name category');
};

// Get all Skills for a User
const getByUser = async (userId: string) => {
  return await UserSkill.find({ user_id: userId })
    .populate('skill_id', 'name category')
    .sort({ createdAt: -1 });
};

// Update a User Skill
const update = async (userSkillId: string, userId: string, updates: Partial<IUserSkill>) => {
  // Prevent user from changing the owner (user_id) or the skill itself (skill_id)
  delete updates.user_id;
  delete updates.skill_id;

  const updatedSkill = await UserSkill.findOneAndUpdate(
    { _id: userSkillId, user_id: userId },
    updates,
    { new: true },
  ).populate('skill_id', 'name category');

  if (!updatedSkill) {
    throw new Error('Skill not found or you do not have permission to edit it.');
  }

  return updatedSkill;
};

// Remove a Skill from User
const remove = async (userSkillId: string, userId: string) => {
  const deleted = await UserSkill.findOneAndDelete({
    _id: userSkillId,
    user_id: userId,
  });

  if (!deleted) {
    throw new Error('Skill not found or you do not have permission to delete it.');
  }

  return deleted;
};

export default {
  add,
  getByUser,
  update,
  remove,
};
