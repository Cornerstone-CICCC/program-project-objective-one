import { Router } from 'express';
import skillController from '../controllers/skill.controller';
import { protect } from '../middleware/auth.middleware';

const skillRouter = Router();

skillRouter.get('/', skillController.getSkills);

skillRouter.post('/', protect, skillController.createSkill);
skillRouter.put('/:id', protect, skillController.updateSkill);
skillRouter.delete('/:id', protect, skillController.deleteSkill);

export default skillRouter;
