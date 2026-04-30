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
const message_model_1 = require("../models/message.model");
const trade_model_1 = require("../models/trade.model");
const userSkill_model_1 = require("../models/userSkill.model");
// Get Inbox Conversations (Aggregates trades, last messages, and unread counts)
const getInboxConversations = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const trades = yield trade_model_1.Trade.find({
        $or: [{ initiator_id: userId }, { receiver_id: userId }],
        hidden_by: { $ne: userId },
    }).populate('initiator_id receiver_id offered_skill_id received_skill_id');
    const conversations = [];
    for (const trade of trades) {
        const lastMessage = yield message_model_1.Message.findOne({ trade_id: trade._id }).sort({ createdAt: -1 });
        if (!lastMessage)
            continue;
        const unreadCount = yield message_model_1.Message.countDocuments({
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
        if (!partner)
            continue;
        const offeredSkill = trade.offered_skill_id;
        const receivedSkill = trade.received_skill_id || trade.sought_skill_id;
        const myOffering = isInitiator ? offeredSkill === null || offeredSkill === void 0 ? void 0 : offeredSkill.name : receivedSkill === null || receivedSkill === void 0 ? void 0 : receivedSkill.name;
        const myReceiving = isInitiator ? receivedSkill === null || receivedSkill === void 0 ? void 0 : receivedSkill.name : offeredSkill === null || offeredSkill === void 0 ? void 0 : offeredSkill.name;
        const offeringUserSkill = yield userSkill_model_1.UserSkill.findOne({
            user_id: isInitiator ? userId : partner._id,
            skill_id: isInitiator ? offeredSkill === null || offeredSkill === void 0 ? void 0 : offeredSkill._id : receivedSkill === null || receivedSkill === void 0 ? void 0 : receivedSkill._id,
            type: 'TEACH',
        });
        const receivingUserSkill = yield userSkill_model_1.UserSkill.findOne({
            user_id: isInitiator ? partner._id : userId,
            skill_id: isInitiator ? receivedSkill === null || receivedSkill === void 0 ? void 0 : receivedSkill._id : offeredSkill === null || offeredSkill === void 0 ? void 0 : offeredSkill._id,
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
            offeringProficiency: (offeringUserSkill === null || offeringUserSkill === void 0 ? void 0 : offeringUserSkill.proficiency) || 'Beginner',
            offeringDesc: (offeringUserSkill === null || offeringUserSkill === void 0 ? void 0 : offeringUserSkill.description) || '',
            receivingProficiency: (receivingUserSkill === null || receivingUserSkill === void 0 ? void 0 : receivingUserSkill.proficiency) || 'Beginner',
            receivingDesc: (receivingUserSkill === null || receivingUserSkill === void 0 ? void 0 : receivingUserSkill.description) || '',
        });
    }
    return conversations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
});
// Check if a user is part of a trade
const verifyTradeParticipant = (tradeId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const trade = yield trade_model_1.Trade.findById(tradeId);
    if (!trade) {
        throw new Error('Trade not found.');
    }
    const isInitiator = trade.initiator_id.toString() === userId;
    const isReceiver = trade.receiver_id.toString() === userId;
    if (!isInitiator && !isReceiver) {
        throw new Error('You are not a participant in this trade.');
    }
    return trade;
});
// Create (Send a Message)
const createMessage = (sender_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const { trade_id, content } = data;
    if (!trade_id || !content) {
        throw new Error('Trade ID and message content are required.');
    }
    // Verify they are allowed to chat here
    yield verifyTradeParticipant(trade_id.toString(), sender_id);
    const newMessage = yield message_model_1.Message.create({
        trade_id,
        sender_id,
        content,
    });
    yield trade_model_1.Trade.findByIdAndUpdate(trade_id, {
        $set: { hidden_by: [] },
    });
    return yield newMessage.populate('sender_id', 'firstname lastname username avatar_url');
});
// Get full chat history for a trade
const getMessagesByTrade = (trade_id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Verify they are allowed to read this chat
    yield verifyTradeParticipant(trade_id, userId);
    return yield message_model_1.Message.find({ trade_id })
        .populate('sender_id', 'firstname lastname username avatar_url')
        .sort({ createdAt: 1 });
});
// Mark messages as read
const markMessagesAsRead = (trade_id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield message_model_1.Message.updateMany({
        trade_id: trade_id,
        sender_id: { $ne: userId },
        is_read: false,
    }, { $set: { is_read: true } }, { timestamps: false });
});
// Update (Edit an existing message)
const updateMessage = (message_id, sender_id, content) => __awaiter(void 0, void 0, void 0, function* () {
    if (!content || content.trim() === '') {
        throw new Error('Message content cannot be empty.');
    }
    const updatedMessage = yield message_model_1.Message.findOneAndUpdate({ _id: message_id, sender_id: sender_id }, { content }, { new: true, runValidators: true }).populate('sender_id', 'firstname lastname username avatar_url');
    if (!updatedMessage) {
        throw new Error('Message not found or you do not have permission to edit it.');
    }
    return updatedMessage;
});
// Delete (Remove a message)
const deleteMessage = (message_id, sender_id) => __awaiter(void 0, void 0, void 0, function* () {
    const deletedMessage = yield message_model_1.Message.findOneAndDelete({
        _id: message_id,
        sender_id: sender_id,
    });
    if (!deletedMessage) {
        throw new Error('Message not found or you do not have permission to delete it.');
    }
    return {
        message: 'Message deleted successfully.',
    };
});
exports.default = {
    getInboxConversations,
    createMessage,
    getMessagesByTrade,
    markMessagesAsRead,
    updateMessage,
    deleteMessage,
};
