import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import aiController from '../controllers/ai.controller';

const aiRouter = Router();

aiRouter.get('/matches', protect, aiController.getAIMatches);

export default aiRouter;
