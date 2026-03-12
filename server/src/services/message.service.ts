import { Message, IMessage } from '../models/message.model';
import { Trade } from '../models/trade.model';

// Check if a user is part of a trade
const verifyTradeParticipant = async (tradeId: string, userId: string) => {
  const trade = await Trade.findById(tradeId);
  if (!trade) {
    throw new Error('Trade not found.');
  }

  const isInitiator = trade.initiator_id.toString() === userId;
  const isReceiver = trade.receiver_id.toString() === userId;

  if (!isInitiator && !isReceiver) {
    throw new Error('You are not a participant in this trade.');
  }

  return trade;
};

// Create (Send a Message)
const createMessage = async (sender_id: string, data: Partial<IMessage>) => {
  const { trade_id, content } = data;

  if (!trade_id || !content) {
    throw new Error('Trade ID and message content are required.');
  }

  // Verify they are allowed to chat here
  await verifyTradeParticipant(trade_id.toString(), sender_id);

  const newMessage = await Message.create({
    trade_id,
    sender_id,
    content,
  });

  return await newMessage.populate('sender_id', 'firstname lastname username avatar_url');
};

// Get full chat history for a trade
const getMessagesByTrade = async (trade_id: string, userId: string) => {
  // Verify they are allowed to read this chat
  await verifyTradeParticipant(trade_id, userId);

  return await Message.find({ trade_id })
    .populate('sender_id', 'firstname lastname username avatar_url')
    .sort({ createdAt: 1 });
};

// Update (Edit an existing message)
const updateMessage = async (message_id: string, sender_id: string, content: string) => {
  if (!content || content.trim() === '') {
    throw new Error('Message content cannot be empty.');
  }

  const updatedMessage = await Message.findByIdAndUpdate(
    { _id: message_id, sender_id: sender_id },
    { content },
    { new: true, runValidators: true },
  ).populate('sender_id', 'firstname lastname username avatar_url');

  if (!updateMessage) {
    throw new Error('Message not found or you do not have permission to edit it.');
  }

  return updatedMessage;
};

// Delete (Remove a message)
const deleteMessage = async (message_id: string, sender_id: string) => {
  const deletedMessage = await Message.findByIdAndDelete({
    _id: message_id,
    sender_id: sender_id,
  });

  if (!deletedMessage) {
    throw new Error('Message not found or you do not have permission to delete it.');
  }

  return {
    message: 'Message deleted successfully.',
  };
};

export default {
  createMessage,
  getMessagesByTrade,
  updateMessage,
  deleteMessage,
};
