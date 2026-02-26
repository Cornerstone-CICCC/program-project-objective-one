import { Skill, ISkill } from '../models/skill.model';

// Get all active skills
const getAll = async () => {
  return await Skill.find({ is_active: true }).sort({ name: 1 });
};

// Get skill by ID
const getById = async (id: string) => {
  return await Skill.findById(id);
};

// Create new skill
const create = async (data: Partial<ISkill>) => {
  const { name, category } = data;

  if (!name) throw new Error('Skill name is required.');

  // Duplicate check
  const existing = await Skill.findOne({
    name: { $regex: new RegExp(`^${name}$`, 'i') },
  });

  if (existing) {
    throw new Error(`Skill '${name}' already exists!`);
  }

  return await Skill.create({
    name,
    category: category || 'Lifestyle',
  });
};

// Update a skill
const update = async (id: string, updates: Partial<ISkill>) => {
  return await Skill.findByIdAndUpdate(id, updates, { new: true });
};

// Soft delete a skill
const remove = async (id: string) => {
  return await Skill.findByIdAndUpdate(id, { is_active: false }, { new: true });
};

export default {
  getAll,
  getById,
  create,
  update,
  remove,
};
