import { Router } from 'express';
import userController from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';
import multer from 'multer';

const userRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });

userRouter.post('/signup', userController.signup);
userRouter.post('/login', userController.login);
userRouter.get('/', userController.getAllUsers);

userRouter.get('/me', protect, userController.getMe);
userRouter.put('/profile', protect, userController.updateAccount);
userRouter.delete('/delete', protect, userController.deleteAccount);

userRouter.get('/:id', userController.getUserById);

userRouter.post('/upload-avatar', protect, upload.single('image'), userController.uploadAvatar);

export default userRouter;
