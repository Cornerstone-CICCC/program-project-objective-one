import { Router } from 'express';
import locationController from '../controllers/location.controller';
import { protect } from '../middleware/auth.middleware';

const locationRouter = Router();

locationRouter.put('/update', protect, locationController.updateLocation);
locationRouter.get('/nearby', protect, locationController.getNearby);

export default locationRouter;
