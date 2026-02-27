import { Router } from 'express';
import messageController from '../controllers/message.controller';
import { protect } from '../middleware/auth.middleware';

const messageRouter = Router();

messageRouter.use(protect);

messageRouter.post('/', messageController.sendMessage);
messageRouter.get('/:tradeId', messageController.getTradeMessages);
messageRouter.put('/:id', messageController.editMessage);
messageRouter.delete('/:id', messageController.deleteMessage);

export default messageRouter;
