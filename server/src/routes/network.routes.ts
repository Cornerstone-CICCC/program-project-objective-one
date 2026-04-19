import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import networkController from '../controllers/network.controller';

const networkRouter = Router();

networkRouter.get('/pulse', protect, networkController.getNetworkPulse);

export default networkRouter;
