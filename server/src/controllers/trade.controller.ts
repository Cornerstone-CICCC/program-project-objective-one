import { Request, Response } from 'express';
import tradeService from '../services/trade.service';
import notificationService from '../services/notification.service';

/**
 * Create a new Trade Request
 * @route POST /trades
 */
const createTrade = async (req: Request, res: Response) => {
  try {
    const initiator_id = (req as any).user.id;
    const { receiver_id, offered_skill_id, received_skill_id, message, proposed_location } =
      req.body;

    const trade = await tradeService.create({
      initiator_id,
      receiver_id,
      offered_skill_id,
      received_skill_id,
      message,
      proposed_location,
    });

    await notificationService.createNotification({
      recipient_id: receiver_id,
      type: 'SWAP_REQUESTED',
      title: 'INCOMING_REQUEST',
      message: 'A new skill swap proposal has arrived.',
      trade_id: trade._id as any,
      partner_id: initiator_id,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(receiver_id.toString()).emit('new_swap_received');
      io.to(receiver_id.toString()).emit('new_notification');
    }

    res.status(201).json({
      message: 'Trade request sent successfully!',
      trade,
    });
  } catch (err: any) {
    console.error('Create trade error:', err);
    res.status(400).json({
      message: err.message || 'Failed to create trade.',
    });
  }
};

/**
 * Update Trade Status (Accept, Reject, Complete, Cancel)
 * @route PUT /trades/:id/status
 */
const updateTradeStatus = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const tradeId = req.params.id;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        message: 'Status is required.',
      });
    }

    const updatedTrade = await tradeService.updateStatus(tradeId, userId, status, reason);

    const initiatorId =
      updatedTrade.initiator_id._id?.toString() || updatedTrade.initiator_id.toString();
    const receiverId =
      updatedTrade.receiver_id._id?.toString() || updatedTrade.receiver_id.toString();

    const partnerId = initiatorId === userId.toString() ? receiverId : initiatorId;

    let notifType: any = null;
    let notifTitle = '';
    let notifMessage = '';

    if (status === 'ACCEPTED') {
      notifType = 'SWAP_ACCEPTED';
      notifTitle = 'SWAP_AUTHORIZED';
      notifMessage = 'Your swap proposal has been authorized. Comm-link is now open.';
    } else if (status === 'REJECTED' || status === 'CANCELLED') {
      notifType = 'SWAP_CANCELLED';
      notifTitle = 'SWAP_TERMINATED';
      notifMessage = reason
        ? `A swap request has been declined or cancelled. Reason: ${reason}`
        : 'A swap request has been declined or cancelled.';
    } else if (status === 'COMPLETED') {
      if (updatedTrade.status !== 'COMPLETED') {
        notifType = 'PARTNER_COMPLETED';
        notifTitle = 'ACTION_REQUIRED';
        notifMessage = 'Your partner marked the trade as complete. Please confirm completion.';
      } else {
        notifType = 'SWAP_COMPLETED';
        notifTitle = 'SWAP_COMPLETED';
        notifMessage = 'Trade fully completed! You can now leave an evaluation.';
      }
    }

    if (notifType) {
      await notificationService.createNotification({
        recipient_id: partnerId as any,
        type: notifType,
        title: notifTitle,
        message: notifMessage,
        trade_id: updatedTrade._id as any,
        partner_id: userId as any,
      });
    }

    const io = req.app.get('io');
    if (io && updatedTrade) {
      io.to(partnerId).emit('swap_status_updated');
      if (notifType) {
        io.to(partnerId).emit('new_notification');
      }
    }

    let message = `Trade marked as ${status}.`;
    if (status === 'COMPLETED' && updatedTrade.status !== 'COMPLETED') {
      message = 'Completion confirmed. Waiting for partner to confirm.';
    }

    res.status(200).json({
      message,
      trade: updatedTrade,
    });
  } catch (err: any) {
    res.status(400).json({
      message: err.message || 'Failed to update status.',
    });
  }
};

/**
 * Get All Trades for the Logged-in User
 * @route GET /trades/me
 */
const getMyTrades = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const trades = await tradeService.getUserTrades(userId);

    res.status(200).json(trades);
  } catch (err) {
    console.error('Get trades error:', err);
    res.status(500).json({
      message: 'Server error while fetching trades.',
    });
  }
};

/**
 * Get Single Trade Details
 * @route GET /trades/:id
 */
const getTradeById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const tradeId = req.params.id;
    const trade = await tradeService.getById(tradeId);

    if (!trade) {
      return res.status(404).json({
        message: 'Trade not found.',
      });
    }

    // Check if the requesting user is parf of the trade
    const userId = (req as any).user.id;
    const isInitiator = trade.initiator_id._id.toString() === userId;
    const isReceiver = trade.receiver_id._id.toString() === userId;

    if (!isInitiator && !isReceiver) {
      return res.status(403).json({
        message: 'You are not authorized to view this trade.',
      });
    }

    res.status(200).json(trade);
  } catch (err) {
    res.status(500).json({
      message: 'Server error while fetching trade details.',
    });
  }
};

/**
 * Hide Trade from Inbox
 * @route PUT /trades/:id/hide
 */
const hideTrade = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const tradeId = req.params.id;

    const result = await tradeService.hideTrade(tradeId, userId);

    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({
      message: err.message || 'Failed to hide trade.',
    });
  }
};

/**
 * Get Public Trades for a Specific User
 * @route GET /trades/user/:userId
 */
const getUserTrades = async (req: Request<{ userId: string }>, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        message: 'User ID is required.',
      });
    }

    const trades = await tradeService.getUserPublicTrades(userId);

    res.status(200).json(trades);
  } catch (err) {
    console.error('Get user public trades error:', err);
    res.status(500).json({
      message: 'Servere error while fetching public trade history.',
    });
  }
};

export default {
  createTrade,
  updateTradeStatus,
  getMyTrades,
  getTradeById,
  hideTrade,
  getUserTrades,
};
