import { Router } from 'express';
import ratingController from '../controllers/rating.controller';
import { protect } from '../middleware/auth.middleware';

const ratingRouter = Router();

ratingRouter.get('/user/:userId', ratingController.getUserReviews);

ratingRouter.post('/', protect, ratingController.createRating);
ratingRouter.get('/check/:tradeId', protect, ratingController.checkMyReviewStatus);
ratingRouter.put('/:id', protect, ratingController.updateRating);
ratingRouter.delete('/:id', protect, ratingController.deleteRating);

export default ratingRouter;
