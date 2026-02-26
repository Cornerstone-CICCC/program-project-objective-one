import { Request, Response } from 'express';
import tradeService from '../services/trade.service';

/**
 * Create a new Trade Request
 * @route POST /trades
 */
const createTrade = async (req: Request, res: Response) => {
  try {
    const initiator_id = (req as any).user.id;
    const { receiver_id, offered_skill_id, sought_skill_id } = req.body;

    const trade = await tradeService.create({
      initiator_id,
      receiver_id,
      offered_skill_id,
      sought_skill_id,
    });

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
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: 'Status is required.',
      });
    }

    const updatedTrade = await tradeService.updateStatus(tradeId, userId, status);

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

export default {
  createTrade,
  updateTradeStatus,
  getMyTrades,
  getTradeById,
};
