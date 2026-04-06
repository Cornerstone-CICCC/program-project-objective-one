import { Trade, ITrade } from '../models/trade.model';
import { User } from '../models/user.model';
import { UserSkill } from '../models/userSkill.model';

// Create a new Trade request
const create = async (data: Partial<ITrade>) => {
  const {
    initiator_id,
    receiver_id,
    offered_skill_id,
    received_skill_id,
    message,
    proposed_location,
  } = data;

  if (!initiator_id || !receiver_id || !offered_skill_id || !received_skill_id) {
    throw new Error(
      'All the fields (initiator_id, receiver_id, offered_skill_id, received_skill_id) are required.',
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
    received_skill_id,
    message,
    proposed_location,
    status: 'PENDING',
    completion_confirmed_initiator: false,
    completion_confirmed_receiver: false,
  });

  return await newTrade.populate([
    { path: 'initiator_id', select: 'firstname lastname username avatar_url' },
    { path: 'receiver_id', select: 'firstname lastname username avatar_url' },
    { path: 'offered_skill_id', select: 'name category' },
    { path: 'received_skill_id', select: 'name category' },
  ]);
};

// Update status
const updateStatus = async (
  tradeId: string,
  userId: string,
  newStatus: 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED',
  reason?: string,
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

      await User.updateMany(
        { _id: { $in: [trade.initiator_id, trade.receiver_id] } },
        { $inc: { total_trades: 1 } },
      );
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

    if (newStatus === 'REJECTED' && reason) {
      trade.cancellation_reason = reason;
    }
  }

  // CANCELLING (Either Party)
  else if (newStatus === 'CANCELLED') {
    // You cannot cancel a trade that is already finished
    if (trade.status === 'COMPLETED') {
      throw new Error('Cannot cancel a completed trade.');
    }

    trade.status = newStatus;

    if (reason) {
      trade.cancellation_reason = reason;
    }
  }

  // Save changes to DB
  await trade.save();

  // Return the updated trade with full details for the UI
  return await trade.populate([
    { path: 'initiator_id', select: 'firstname lastname username avatar_url' },
    { path: 'receiver_id', select: 'firstname lastname username avatar_url' },
    { path: 'offered_skill_id', select: 'name category' },
    { path: 'received_skill_id', select: 'name category' },
  ]);
};

// Get all Trades for User
const getUserTrades = async (userId: string) => {
  const trades = await Trade.find({
    $or: [{ initiator_id: userId }, { receiver_id: userId }],
  })
    .populate('initiator_id', 'firstname lastname username avatar_url')
    .populate('receiver_id', 'firstname lastname username avatar_url')
    .populate('offered_skill_id', 'name category')
    .populate('received_skill_id', 'name category')
    .sort({ updatedAt: -1 });

  return await Promise.all(
    trades.map(async (trade: any) => {
      const offeringUserSkill = await UserSkill.findOne({
        user_id: trade.initiator_id?._id,
        skill_id: trade.offered_skill_id?._id,
        type: 'TEACH',
      });

      const receivingUserSkill = await UserSkill.findOne({
        user_id: trade.receiver_id?._id,
        skill_id: trade.received_skill_id?._id,
        type: 'TEACH',
      });

      return {
        ...trade.toObject(),
        offeringProficiency: offeringUserSkill?.proficiency || 'Beginner',
        offeringDesc: offeringUserSkill?.description || '',
        receivingProficiency: receivingUserSkill?.proficiency || 'Beginner',
        receivingDesc: receivingUserSkill?.description || '',
      };
    }),
  );
};

// Get sigle Trade details
const getById = async (tradeId: string) => {
  const trade = await Trade.findById(tradeId)
    .populate('initiator_id', 'firstname lastname username email avatar_url')
    .populate('receiver_id', 'firstname lastname username email avatar_url')
    .populate('offered_skill_id', 'name category')
    .populate('received_skill_id', 'name category');

  if (!trade) return null;

  const tradeAny = trade as any;

  const offeringUserSkill = await UserSkill.findOne({
    user_id: tradeAny.initiator_id?._id,
    skill_id: tradeAny.offered_skill_id?._id,
    type: 'TEACH',
  });

  const receivingUserSkill = await UserSkill.findOne({
    user_id: tradeAny.receiver_id?._id,
    skill_id: tradeAny.received_skill_id?._id,
    type: 'TEACH',
  });

  return {
    ...trade.toObject(),
    offeringProficiency: offeringUserSkill?.proficiency || 'Beginner',
    offeringDesc: offeringUserSkill?.description || '',
    receivingProficiency: receivingUserSkill?.proficiency || 'Beginner',
    receivingDesc: receivingUserSkill?.description || '',
  };
};

const hideTrade = async (tradeId: string, userId: string) => {
  const trade = await Trade.findById(tradeId);

  if (!trade) {
    throw new Error('Trade not found.');
  }

  const isInitiator = trade.initiator_id.toString() === userId;
  const isReceiver = trade.receiver_id.toString() === userId;

  if (!isInitiator && !isReceiver) {
    throw new Error('You are not authorized to modify this trade.');
  }

  await Trade.updateOne({ _id: tradeId }, { $addToSet: { hidden_by: userId } });

  return { message: 'Conversation hidden successfully.' };
};

const getUserPublicTrades = async (userId: string) => {
  const trades = await Trade.find({
    $or: [{ initiator_id: userId }, { receiver_id: userId }],
    status: 'COMPLETED',
  })
    .populate('initiator_id', 'firstname lastname avatar_url')
    .populate('receiver_id', 'firstname lastname avatar_url')
    .populate('offered_skill_id', 'name category')
    .populate('received_skill_id', 'name category')
    .sort({ updatedAt: -1 });

  return await Promise.all(
    trades.map(async (trade: any) => {
      const offeringUserSkill = await UserSkill.findOne({
        user_id: trade.initiator_id?._id,
        skill_id: trade.offered_skill_id?._id,
        type: 'TEACH',
      });

      const receivingUserSkill = await UserSkill.findOne({
        user_id: trade.receiver_id?._id,
        skill_id: trade.received_skill_id?._id,
        type: 'TEACH',
      });

      return {
        ...trade.toObject(),
        offeringProficiency: offeringUserSkill?.proficiency || 'Beginner',
        offeringDesc: offeringUserSkill?.description || '',
        receivingProficiency: receivingUserSkill?.proficiency || 'Beginner',
        receivingDesc: receivingUserSkill?.description || '',
      };
    }),
  );
};

export default {
  create,
  updateStatus,
  getUserTrades,
  getById,
  hideTrade,
  getUserPublicTrades,
};
