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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const message_service_1 = __importDefault(require("../services/message.service"));
/**
 * Send a Message
 * @route POST /messages
 */
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sender_id = req.user.id;
        const { trade_id, content } = req.body;
        const newMessage = yield message_service_1.default.createMessage(sender_id, {
            trade_id,
            content,
        });
        res.status(201).json(newMessage);
    }
    catch (err) {
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
});
/**
 * Get Chat History for a Trade
 * @route GET /messages/:tradeId
 */
const getTradeMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { tradeId } = req.params;
        const messsages = yield message_service_1.default.getMessagesByTrade(tradeId, userId);
        res.status(200).json(messsages);
    }
    catch (err) {
        if (err.message.includes('not a participant')) {
            return res.status(403).json({
                message: err.message,
            });
        }
        res.status(400).json({
            message: err.message || 'Failed to fetch messages.',
        });
    }
});
/**
 * Edit a Message
 * @route PUT /messages/:id
 */
const editMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sender_id = req.user.id;
        const message_id = req.params.id;
        const { content } = req.body;
        const updatedMessage = yield message_service_1.default.updateMessage(message_id, sender_id, content);
        res.status(200).json({
            message: 'Message updated successfully.',
            data: updatedMessage,
        });
    }
    catch (err) {
        res.status(400).json({
            message: err.message,
        });
    }
});
/**
 * Delete a Message
 * @route DELETE /messages/:id
 */
const deleteMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sender_id = req.user.id;
        const message_id = req.params.id;
        const result = yield message_service_1.default.deleteMessage(message_id, sender_id);
        res.status(200).json(result);
    }
    catch (err) {
        res.status(400).json({
            message: err.message,
        });
    }
});
exports.default = {
    sendMessage,
    getTradeMessages,
    editMessage,
    deleteMessage,
};
