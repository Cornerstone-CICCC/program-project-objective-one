import { Message, IMessage } from '../models/message.model';
import { Trade } from '../models/trade.model';
import { UserSkill } from '../models/userSkill.model';

// Get Inbox Conversations (Aggregates trades, last messages, and unread counts)
const getInboxConversations = async (userId: string) => {
  const trades = await Trade.find({
    $or: [{ initiator_id: userId }, { receiver_id: userId }],
    hidden_by: { $ne: userId },
  }).populate('initiator_id receiver_id offered_skill_id received_skill_id');

  const conversations = [];

  for (const trade of trades as any) {
    const lastMessage = await Message.findOne({ trade_id: trade._id }).sort({ createdAt: -1 });

    if (!lastMessage) continue;

    const unreadCount = await Message.countDocuments({
      trade_id: trade._id,
      sender_id: { $ne: userId },
      is_read: false,
    });

    if (!trade.initiator_id || !trade.receiver_id) {
      console.warn(`Trade ${trade._id} has a missing user. Skipping...`);
      continue;
    }

    const isInitiator = trade.initiator_id._id.toString() === userId.toString();
    const partner = isInitiator ? trade.receiver_id : trade.initiator_id;

    if (!partner) continue;

    const offeredSkill = trade.offered_skill_id;
    const receivedSkill = trade.received_skill_id || trade.sought_skill_id;

    const myOffering = isInitiator ? offeredSkill?.name : receivedSkill?.name;
    const myReceiving = isInitiator ? receivedSkill?.name : offeredSkill?.name;

    const offeringUserSkill = await UserSkill.findOne({
      user_id: isInitiator ? userId : partner._id,
      skill_id: isInitiator ? offeredSkill?._id : receivedSkill?._id,
      type: 'TEACH',
    });

    const receivingUserSkill = await UserSkill.findOne({
      user_id: isInitiator ? partner._id : userId,
      skill_id: isInitiator ? receivedSkill?._id : offeredSkill?._id,
      type: 'TEACH',
    });

    conversations.push({
      tradeId: trade._id,
      partnerId: partner.user_id || partner._id,
      partnerName: `${partner.firstname || ''} ${partner.lastname || ''}`.trim(),
      partnerAvatar: partner.avatar_url,
      lastMessage: lastMessage.content,
      timestamp: lastMessage.createdAt,
      unreadCount,
      offering: myOffering || 'Unknown Skill',
      receiving: myReceiving || 'Unknown Skill',
      tradeStatus: trade.status || 'ACTIVE',
      proposedLocation: trade.proposed_location || '',
      tradeMessage: trade.message || '',
      offeringProficiency: offeringUserSkill?.proficiency || 'Beginner',
      offeringDesc: offeringUserSkill?.description || '',
      receivingProficiency: receivingUserSkill?.proficiency || 'Beginner',
      receivingDesc: receivingUserSkill?.description || '',
    });
  }

  return conversations.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
};

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

  await Trade.findByIdAndUpdate(trade_id, {
    $set: { hidden_by: [] },
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

// Mark messages as read
const markMessagesAsRead = async (trade_id: string, userId: string) => {
  return await Message.updateMany(
    {
      trade_id: trade_id,
      sender_id: { $ne: userId },
      is_read: false,
    },
    { $set: { is_read: true } },
    { timestamps: false },
  );
};

// Update (Edit an existing message)
const updateMessage = async (message_id: string, sender_id: string, content: string) => {
  if (!content || content.trim() === '') {
    throw new Error('Message content cannot be empty.');
  }

  const updatedMessage = await Message.findOneAndUpdate(
    { _id: message_id, sender_id: sender_id },
    { content },
    { new: true, runValidators: true },
  ).populate('sender_id', 'firstname lastname username avatar_url');

  if (!updatedMessage) {
    throw new Error('Message not found or you do not have permission to edit it.');
  }

  return updatedMessage;
};

// Delete (Remove a message)
const deleteMessage = async (message_id: string, sender_id: string) => {
  const deletedMessage = await Message.findOneAndDelete({
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
  getInboxConversations,
  createMessage,
  getMessagesByTrade,
  markMessagesAsRead,
  updateMessage,
  deleteMessage,
};
