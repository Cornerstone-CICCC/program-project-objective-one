import { Request, Response } from 'express';
import skillService from '../services/skill.service';

/**
 * Get All Active Skills
 * @route GET /skills
 * @access Public
 */
const getSkills = async (req: Request, res: Response) => {
  try {
    const skills = await skillService.getAll();
    res.status(200).json(skills);
  } catch (err) {
    console.error('Error fetching skills:', err);
    res.status(500).json({
      message: 'Server error while fetching skills.',
    });
  }
};

/**
 * Create New Skill
 * @route POST /skills
 * @access Private (Admin)
 */
const createSkill = async (req: Request, res: Response) => {
  try {
    const { name, category } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        message: 'Name and Category are required.',
      });
    }

    const newSkill = await skillService.create({ name, category });
    res.status(201).json(newSkill);
  } catch (err: any) {
    if (err.message.includes('already exists')) {
      return res.status(409).json({
        message: err.message,
      });
    }

    res.status(500).json({
      message: 'Server error while creating skill.',
    });
  }
};

/**
 * Update Skill (Name or Category)
 * @route PUT /skills/:id
 * @access Private (Admin)
 */
const updateSkill = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category } = req.body;

    const updatedSkill = await skillService.update(id, { name, category });

    if (!updatedSkill) {
      return res.status(404).json({
        message: 'Skill not found.',
      });
    }

    res.status(200).json(updatedSkill);
  } catch (err) {
    res.status(500).json({
      message: 'Server error while updating skill.',
    });
  }
};

/**
 * Soft Delete Skill (Hide from list)
 * @route DELETE /skills/:id
 * @access Private (Admin)
 */
const deleteSkill = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    const deletedSkill = await skillService.remove(id);

    if (!deletedSkill) {
      return res.status(404).json({
        message: 'Skill not found.',
      });
    }

    res.status(200).json({
      message: 'Skill deactivated successfully.',
      skill: deletedSkill,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error while deleting skill.',
    });
  }
};

export default {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
};
