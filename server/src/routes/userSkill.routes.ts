import { Router } from 'express';
import userSkillController from '../controllers/userSkill.controller';
import { protect } from '../middleware/auth.middleware';

const userSkillRouter = Router();

userSkillRouter.post('/', protect, userSkillController.addUserSkill);
userSkillRouter.get('/me', protect, userSkillController.getMySkills);
userSkillRouter.put('/:id', protect, userSkillController.updateUserSkill);
userSkillRouter.delete('/:id', protect, userSkillController.deleteUserSkill);

userSkillRouter.get('/user/:userId', userSkillController.getUserSkills);

export default userSkillRouter;
