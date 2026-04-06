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
exports.setupSockets = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const message_service_1 = __importDefault(require("../services/message.service"));
const trade_model_1 = require("../models/trade.model");
const setupSockets = (io) => {
    // Socket auth middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.token;
        if (!token) {
            return next(new Error('Authentication error: No token provided.'));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.data.user = decoded;
            next();
        }
        catch (err) {
            next(new Error('Authentication error: Invalid token.'));
        }
    });
    // Handle connections
    io.on('connection', (socket) => {
        const userId = socket.data.user.id;
        console.log(`User conneted to sockets: ${userId}`);
        socket.join(userId.toString());
        // Join a chat room (Trade ID)
        socket.on('join_trade', (trade_id) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // Security check
                const trade = yield trade_model_1.Trade.findById(trade_id);
                if (!trade)
                    return socket.emit('error', {
                        message: 'Trade not found.',
                    });
                const isParticipant = trade.initiator_id.toString() === userId || trade.receiver_id.toString() === userId;
                if (isParticipant) {
                    socket.join(trade_id);
                    console.log(`User ${userId} joined room: ${trade_id}`);
                }
                else {
                    socket.emit('error', {
                        message: 'Not authorized to join this chat.',
                    });
                }
            }
            catch (err) {
                console.error('Room join error:', err);
            }
        }));
        // Handle incoming messages
        socket.on('send_message', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // Save it to MongoDB
                const savedMessage = yield message_service_1.default.createMessage(userId, {
                    trade_id: new mongoose_1.default.Types.ObjectId(data.trade_id),
                    content: data.content,
                });
                // Broadcast the fully populated message to everyone in the room (including the sender)
                io.to(data.trade_id).emit('receive_message', savedMessage);
                const trade = yield trade_model_1.Trade.findById(data.trade_id);
                if (trade) {
                    const initiatorId = trade.initiator_id.toString();
                    const receiverId = trade.receiver_id.toString();
                    const partnerId = initiatorId === userId ? receiverId : initiatorId;
                    io.to(partnerId).emit('new_message');
                    io.to(partnerId).emit('new_notification');
                }
            }
            catch (err) {
                socket.emit('error', {
                    message: err.message,
                });
            }
        }));
        // Handle editing messages
        socket.on('edit_message', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // Update to DB
                const updatedMessage = yield message_service_1.default.updateMessage(data.message_id, userId, data.content);
                // Tell everyone in the room that a message changed, and send the new version
                io.to(data.trade_id).emit('message_updated', updatedMessage);
                const trade = yield trade_model_1.Trade.findById(data.trade_id);
                if (trade) {
                    const partnerId = trade.initiator_id.toString() === userId
                        ? trade.receiver_id.toString()
                        : trade.initiator_id.toString();
                    io.to(partnerId).emit('new_message');
                }
            }
            catch (err) {
                socket.emit('error', {
                    message: err.message,
                });
            }
        }));
        // Handle deleting messages
        socket.on('delete_message', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // Delete from DB
                yield message_service_1.default.deleteMessage(data.message_id, userId);
                // Tell everyone in the room which message ID needs to be removed from their screens
                io.to(data.trade_id).emit('message_deleted', {
                    message_id: data.message_id,
                });
                const trade = yield trade_model_1.Trade.findById(data.trade_id);
                if (trade) {
                    const partnerId = trade.initiator_id.toString() === userId
                        ? trade.receiver_id.toString()
                        : trade.initiator_id.toString();
                    io.to(partnerId).emit('new_message');
                }
            }
            catch (err) {
                socket.emit('error', {
                    message: err.message,
                });
            }
        }));
        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${userId}`);
        });
    });
};
exports.setupSockets = setupSockets;
