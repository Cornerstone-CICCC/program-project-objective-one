import { Trade, ITrade } from '../models/trade.model';

// Create a new Trade request
const create = async (data: Partial<ITrade>) => {
  const { initiator_id, receiver_id, offered_skill_id, sought_skill_id } = data;

  if (!initiator_id || !receiver_id || !offered_skill_id || !sought_skill_id) {
    throw new Error(
      'All the fields (initiator_id, receiver_id, offered_skill_id, sought_skill_id) are required.',
    );
  }

  // Prevent trading with yourself
  if (initiator_id.toString() === receiver_id.toString()) {
    throw new Error('You cannot trade with yourself.');
  }

  const newTrade = await Trade.create({
    initiator_id,
    receiver_id,
    offered_skill_id,
    sought_skill_id,
    status: 'PENDING',
    completion_confirmed_initiator: false,
    completion_confirmed_receiver: false,
  });

  return await newTrade.populate([
    { path: 'initiator_id', select: 'firstname lastname username avatar_url' },
    { path: 'receiver_id', select: 'firstname lastname username avatar_url' },
    { path: 'offered_skill_id', select: 'name category' },
    { path: 'sought_skill_id', select: 'name category' },
  ]);
};

// Update status
const updateStatus = async (
  tradeId: string,
  userId: string,
  newStatus: 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED',
) => {
  const trade = await Trade.findById(tradeId);

  if (!trade) {
    throw new Error('Trade not found.');
  }

  // Helper booleans to identify who is acting
  const isInitiator = trade.initiator_id.toString() === userId;
  const isReceiver = trade.receiver_id.toString() === userId;

  // Security check
  if (!isInitiator && !isReceiver) {
    throw new Error('You are not authorized to modify this trade.');
  }

  // Marking as COMPLETED
  if (newStatus === 'COMPLETED') {
    if (isInitiator) trade.completion_confirmed_initiator = true;
    if (isReceiver) trade.completion_confirmed_receiver = true;

    if (trade.completion_confirmed_initiator && trade.completion_confirmed_receiver) {
      trade.status = 'COMPLETED';
      trade.completed_at = new Date();
    } else {
      // Only one agreed
      console.log(`Trade ${tradeId}: One side confirmed. Waiting for the other.`);
    }
  }

  // ACCEPTING or REJECTING (Receiver Only)
  else if (newStatus === 'ACCEPTED' || newStatus === 'REJECTED') {
    // Only the person receiving the request can decide
    if (!isReceiver) {
      throw new Error('Only the receiver can accept or reject this trade request.');
    }

    // Can only accept/reject if it's currently pending
    if (trade.status !== 'PENDING') {
      throw new Error(
        `Cannot ${newStatus.toLowerCase()} a trade that is already ${trade.status.toLowerCase()}.`,
      );
    }

    trade.status = newStatus;
  }

  // CANCELLING (Either Party)
  else if (newStatus === 'CANCELLED') {
    // You cannot cancel a trade that is already finished
    if (trade.status === 'COMPLETED') {
      throw new Error('Cannot cancel a completed trade.');
    }

    trade.status = newStatus;
  }

  // Save changes to DB
  await trade.save();

  // Return the updated trade with full details for the UI
  return await trade.populate([
    { path: 'initiator_id', select: 'firstname lastname username avatar_url' },
    { path: 'receiver_id', select: 'firstname lastname username avatar_url' },
    { path: 'offered_skill_id', select: 'name category' },
    { path: 'sought_skill_id', select: 'name category' },
  ]);
};

// Get all Trades for User
const getUserTrades = async (userId: string) => {
  return await Trade.find({
    $or: [{ initiator_id: userId }, { receiver_id: userId }],
  })
    .populate('initiator_id', 'firstname lastname username avatar_url')
    .populate('receiver_id', 'firstname lastname username avatar_url')
    .populate('offered_skill_id', 'name category')
    .populate('sought_skill_id', 'name category')
    .sort({ updated_at: -1 });
};

// Get sigle Trade details
const getById = async (tradeId: string) => {
  return await Trade.findById(tradeId)
    .populate('initiator_id', 'firstname lastname username email avatar_url')
    .populate('receiver_id', 'firstname lastname username email avatar_url')
    .populate('offered_skill_id', 'name category')
    .populate('sought_skill_id', 'name category');
};

export default {
  create,
  updateStatus,
  getUserTrades,
  getById,
};
