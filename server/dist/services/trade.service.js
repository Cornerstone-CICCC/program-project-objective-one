"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const trade_model_1 = require("../models/trade.model");
const user_model_1 = require("../models/user.model");
const userSkill_model_1 = require("../models/userSkill.model");
// Create a new Trade request
const create = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { initiator_id, receiver_id, offered_skill_id, received_skill_id, message, proposed_location, } = data;
    if (!initiator_id || !receiver_id || !offered_skill_id || !received_skill_id) {
        throw new Error('All the fields (initiator_id, receiver_id, offered_skill_id, received_skill_id) are required.');
    }
    // Prevent trading with yourself
    if (initiator_id.toString() === receiver_id.toString()) {
        throw new Error('You cannot trade with yourself.');
    }
    const newTrade = yield trade_model_1.Trade.create({
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
    return yield newTrade.populate([
        { path: 'initiator_id', select: 'firstname lastname username avatar_url' },
        { path: 'receiver_id', select: 'firstname lastname username avatar_url' },
        { path: 'offered_skill_id', select: 'name category' },
        { path: 'received_skill_id', select: 'name category' },
    ]);
});
// Update status
const updateStatus = (tradeId, userId, newStatus, reason) => __awaiter(void 0, void 0, void 0, function* () {
    const trade = yield trade_model_1.Trade.findById(tradeId);
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
        if (isInitiator)
            trade.completion_confirmed_initiator = true;
        if (isReceiver)
            trade.completion_confirmed_receiver = true;
        if (trade.completion_confirmed_initiator && trade.completion_confirmed_receiver) {
            trade.status = 'COMPLETED';
            trade.completed_at = new Date();
            yield user_model_1.User.updateMany({ _id: { $in: [trade.initiator_id, trade.receiver_id] } }, { $inc: { total_trades: 1 } });
        }
        else {
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
            throw new Error(`Cannot ${newStatus.toLowerCase()} a trade that is already ${trade.status.toLowerCase()}.`);
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
    yield trade.save();
    // Return the updated trade with full details for the UI
    return yield trade.populate([
        { path: 'initiator_id', select: 'firstname lastname username avatar_url' },
        { path: 'receiver_id', select: 'firstname lastname username avatar_url' },
        { path: 'offered_skill_id', select: 'name category' },
        { path: 'received_skill_id', select: 'name category' },
    ]);
});
// Get all Trades for User
const getUserTrades = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const trades = yield trade_model_1.Trade.find({
        $or: [{ initiator_id: userId }, { receiver_id: userId }],
    })
        .populate('initiator_id', 'firstname lastname username avatar_url')
        .populate('receiver_id', 'firstname lastname username avatar_url')
        .populate('offered_skill_id', 'name category')
        .populate('received_skill_id', 'name category')
        .sort({ updatedAt: -1 });
    return yield Promise.all(trades.map((trade) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const offeringUserSkill = yield userSkill_model_1.UserSkill.findOne({
            user_id: (_a = trade.initiator_id) === null || _a === void 0 ? void 0 : _a._id,
            skill_id: (_b = trade.offered_skill_id) === null || _b === void 0 ? void 0 : _b._id,
            type: 'TEACH',
        });
        const receivingUserSkill = yield userSkill_model_1.UserSkill.findOne({
            user_id: (_c = trade.receiver_id) === null || _c === void 0 ? void 0 : _c._id,
            skill_id: (_d = trade.received_skill_id) === null || _d === void 0 ? void 0 : _d._id,
            type: 'TEACH',
        });
        return Object.assign(Object.assign({}, trade.toObject()), { offeringProficiency: (offeringUserSkill === null || offeringUserSkill === void 0 ? void 0 : offeringUserSkill.proficiency) || 'Beginner', offeringDesc: (offeringUserSkill === null || offeringUserSkill === void 0 ? void 0 : offeringUserSkill.description) || '', receivingProficiency: (receivingUserSkill === null || receivingUserSkill === void 0 ? void 0 : receivingUserSkill.proficiency) || 'Beginner', receivingDesc: (receivingUserSkill === null || receivingUserSkill === void 0 ? void 0 : receivingUserSkill.description) || '' });
    })));
});
// Get sigle Trade details
const getById = (tradeId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const trade = yield trade_model_1.Trade.findById(tradeId)
        .populate('initiator_id', 'firstname lastname username email avatar_url')
        .populate('receiver_id', 'firstname lastname username email avatar_url')
        .populate('offered_skill_id', 'name category')
        .populate('received_skill_id', 'name category');
    if (!trade)
        return null;
    const tradeAny = trade;
    const offeringUserSkill = yield userSkill_model_1.UserSkill.findOne({
        user_id: (_a = tradeAny.initiator_id) === null || _a === void 0 ? void 0 : _a._id,
        skill_id: (_b = tradeAny.offered_skill_id) === null || _b === void 0 ? void 0 : _b._id,
        type: 'TEACH',
    });
    const receivingUserSkill = yield userSkill_model_1.UserSkill.findOne({
        user_id: (_c = tradeAny.receiver_id) === null || _c === void 0 ? void 0 : _c._id,
        skill_id: (_d = tradeAny.received_skill_id) === null || _d === void 0 ? void 0 : _d._id,
        type: 'TEACH',
    });
    return Object.assign(Object.assign({}, trade.toObject()), { offeringProficiency: (offeringUserSkill === null || offeringUserSkill === void 0 ? void 0 : offeringUserSkill.proficiency) || 'Beginner', offeringDesc: (offeringUserSkill === null || offeringUserSkill === void 0 ? void 0 : offeringUserSkill.description) || '', receivingProficiency: (receivingUserSkill === null || receivingUserSkill === void 0 ? void 0 : receivingUserSkill.proficiency) || 'Beginner', receivingDesc: (receivingUserSkill === null || receivingUserSkill === void 0 ? void 0 : receivingUserSkill.description) || '' });
});
const hideTrade = (tradeId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const trade = yield trade_model_1.Trade.findById(tradeId);
    if (!trade) {
        throw new Error('Trade not found.');
    }
    const isInitiator = trade.initiator_id.toString() === userId;
    const isReceiver = trade.receiver_id.toString() === userId;
    if (!isInitiator && !isReceiver) {
        throw new Error('You are not authorized to modify this trade.');
    }
    yield trade_model_1.Trade.updateOne({ _id: tradeId }, { $addToSet: { hidden_by: userId } });
    return { message: 'Conversation hidden successfully.' };
});
const getUserPublicTrades = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const trades = yield trade_model_1.Trade.find({
        $or: [{ initiator_id: userId }, { receiver_id: userId }],
        status: 'COMPLETED',
    })
        .populate('initiator_id', 'firstname lastname avatar_url')
        .populate('receiver_id', 'firstname lastname avatar_url')
        .populate('offered_skill_id', 'name category')
        .populate('received_skill_id', 'name category')
        .sort({ updatedAt: -1 });
    return yield Promise.all(trades.map((trade) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const offeringUserSkill = yield userSkill_model_1.UserSkill.findOne({
            user_id: (_a = trade.initiator_id) === null || _a === void 0 ? void 0 : _a._id,
            skill_id: (_b = trade.offered_skill_id) === null || _b === void 0 ? void 0 : _b._id,
            type: 'TEACH',
        });
        const receivingUserSkill = yield userSkill_model_1.UserSkill.findOne({
            user_id: (_c = trade.receiver_id) === null || _c === void 0 ? void 0 : _c._id,
            skill_id: (_d = trade.received_skill_id) === null || _d === void 0 ? void 0 : _d._id,
            type: 'TEACH',
        });
        return Object.assign(Object.assign({}, trade.toObject()), { offeringProficiency: (offeringUserSkill === null || offeringUserSkill === void 0 ? void 0 : offeringUserSkill.proficiency) || 'Beginner', offeringDesc: (offeringUserSkill === null || offeringUserSkill === void 0 ? void 0 : offeringUserSkill.description) || '', receivingProficiency: (receivingUserSkill === null || receivingUserSkill === void 0 ? void 0 : receivingUserSkill.proficiency) || 'Beginner', receivingDesc: (receivingUserSkill === null || receivingUserSkill === void 0 ? void 0 : receivingUserSkill.description) || '' });
    })));
});
exports.default = {
    create,
    updateStatus,
    getUserTrades,
    getById,
    hideTrade,
    getUserPublicTrades,
};
