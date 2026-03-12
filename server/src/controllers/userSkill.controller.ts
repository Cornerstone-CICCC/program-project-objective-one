import { Request, Response } from 'express';
import userSkillService from '../services/userSkill.service';

/**
 * Add a Skill to My Profile
 * @route POST /user-skills
 */
const addUserSkill = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { skill_id, type, proficiency, description } = req.body;

    // Basic validation
    if (!skill_id || !type) {
      return res.status(400).json({
        message: 'Skill and Type (TEACH/LEARN) are required.',
      });
    }

    const newSkill = await userSkillService.add(userId, {
      skill_id,
      type,
      proficiency,
      description,
    });

    res.status(201).json(newSkill);
  } catch (err: any) {
    if (err.message.includes('already have this skill')) {
      return res.status(409).json({
        message: err.message,
      });
    }

    console.error('Add skill error:', err);
    res.status(500).json({
      message: 'Server error adding skill.',
    });
  }
};

/**
 * Get My Skills
 * @route GET /user-skills/me
 */
const getMySkills = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const skills = await userSkillService.getByUser(userId);
    res.status(200).json(skills);
  } catch (err) {
    res.status(500).json({
      message: 'Error fetching your skills.',
    });
  }
};

/**
 * Get Skills by User ID (Public Profile View)
 * @route GET /api/user-skills/user/:userId
 */
const getUserSkills = async (req: Request<{ userId: string }>, res: Response) => {
  try {
    const { userId } = req.params;
    const skills = await userSkillService.getByUser(userId);
    res.status(200).json(skills);
  } catch (err) {
    res.status(500).json({
      message: 'Error fetching user skills.',
    });
  }
};

/**
 * Update Skill Details (e.g., changed proficiency)
 * @route PUT /user-skills/:id
 */
const updateUserSkill = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const updates = req.body;

    const updatedSkill = await userSkillService.update(id, userId, updates);
    res.status(200).json(updatedSkill);
  } catch (err: any) {
    res.status(400).json({
      message: err.message,
    });
  }
};

/**
 * Remove Skill from Profile
 * @route DELETE /user-skills/:id
 */
const deleteUserSkill = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    await userSkillService.remove(id, userId);
    res.status(200).json({
      message: 'Skill removed successfully.',
    });
  } catch (err: any) {
    res.status(400).json({
      message: err.message,
    });
  }
};

export default {
  addUserSkill,
  getMySkills,
  getUserSkills,
  updateUserSkill,
  deleteUserSkill,
};
