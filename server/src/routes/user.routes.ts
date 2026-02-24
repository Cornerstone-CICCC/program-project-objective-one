import { Router } from 'express';
import userController from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';

const userRouter = Router();

userRouter.post('/signup', userController.signup);
userRouter.post('/login', userController.login);

userRouter.get('/me', protect, userController.getMe);
userRouter.put('/profile', protect, userController.updateAccount);
userRouter.delete('/delete', protect, userController.deleteAccount);

export default userRouter;
