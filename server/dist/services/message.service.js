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
// Update (Edit an existing message)
const updateMessage = (message_id, sender_id, content) => __awaiter(void 0, void 0, void 0, function* () {
    if (!content || content.trim() === '') {
        throw new Error('Message content cannot be empty.');
    }
    const updatedMessage = yield message_model_1.Message.findByIdAndUpdate({ _id: message_id, sender_id: sender_id }, { content }, { new: true, runValidators: true }).populate('sender_id', 'firstname lastname username avatar_url');
    if (!updateMessage) {
        throw new Error('Message not found or you do not have permission to edit it.');
    }
    return updatedMessage;
});
// Delete (Remove a message)
const deleteMessage = (message_id, sender_id) => __awaiter(void 0, void 0, void 0, function* () {
    const deletedMessage = yield message_model_1.Message.findByIdAndDelete({
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
    createMessage,
    getMessagesByTrade,
    updateMessage,
    deleteMessage,
};
