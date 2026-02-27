import { Request, Response } from 'express';
import messageService from '../services/message.service';

/**
 * Send a Message
 * @route POST /messages
 */
const sendMessage = async (req: Request, res: Response) => {
  try {
    const sender_id = (req as any).user.id;
    const { trade_id, content } = req.body;

    const newMessage = await messageService.createMessage(sender_id, {
      trade_id,
      content,
    });

    res.status(201).json(newMessage);
  } catch (err: any) {
    console.error('Send message error:', err);

    if (err.message.includes('not a participant')) {
      return res.status(403).json({
        message: err.message,
      });
    }

    res.status(400).json({
      message: err.message || 'Failed to send message.',
    });
  }
};

/**
 * Get Chat History for a Trade
 * @route GET /messages/:tradeId
 */
const getTradeMessages = async (req: Request<{ tradeId: string }>, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { tradeId } = req.params;

    const messsages = await messageService.getMessagesByTrade(tradeId, userId);
    res.status(200).json(messsages);
  } catch (err: any) {
    if (err.message.includes('not a participant')) {
      return res.status(403).json({
        message: err.message,
      });
    }

    res.status(400).json({
      message: err.message || 'Failed to fetch messages.',
    });
  }
};

/**
 * Edit a Message
 * @route PUT /messages/:id
 */
const editMessage = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const sender_id = (req as any).user.id;
    const message_id = req.params.id;
    const { content } = req.body;

    const updatedMessage = await messageService.updateMessage(message_id, sender_id, content);
    res.status(200).json({
      message: 'Message updated successfully.',
      data: updatedMessage,
    });
  } catch (err: any) {
    res.status(400).json({
      message: err.message,
    });
  }
};

/**
 * Delete a Message
 * @route DELETE /messages/:id
 */
const deleteMessage = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const sender_id = (req as any).user.id;
    const message_id = req.params.id;

    const result = await messageService.deleteMessage(message_id, sender_id);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({
      message: err.message,
    });
  }
};

export default {
  sendMessage,
  getTradeMessages,
  editMessage,
  deleteMessage,
};
