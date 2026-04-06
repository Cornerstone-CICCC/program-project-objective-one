import { Router } from 'express';
import tradeController from '../controllers/trade.controller';
import { protect } from '../middleware/auth.middleware';

const tradeRouter = Router();

tradeRouter.use(protect);

tradeRouter.post('/', tradeController.createTrade);
tradeRouter.get('/me', tradeController.getMyTrades);
tradeRouter.get('/user/:userId', tradeController.getUserTrades);
tradeRouter.get('/:id', tradeController.getTradeById);
tradeRouter.put('/:id/status', tradeController.updateTradeStatus);
tradeRouter.put('/:id/hide', tradeController.hideTrade);

export default tradeRouter;
