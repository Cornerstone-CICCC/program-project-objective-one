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
const trade_service_1 = __importDefault(require("../services/trade.service"));
const notification_service_1 = __importDefault(require("../services/notification.service"));
/**
 * Create a new Trade Request
 * @route POST /trades
 */
const createTrade = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const initiator_id = req.user.id;
        const { receiver_id, offered_skill_id, received_skill_id, message, proposed_location } = req.body;
        const trade = yield trade_service_1.default.create({
            initiator_id,
            receiver_id,
            offered_skill_id,
            received_skill_id,
            message,
            proposed_location,
        });
        yield notification_service_1.default.createNotification({
            recipient_id: receiver_id,
            type: 'SWAP_REQUESTED',
            title: 'INCOMING_REQUEST',
            message: 'A new skill swap proposal has arrived.',
            trade_id: trade._id,
            partner_id: initiator_id,
        });
        const io = req.app.get('io');
        if (io) {
            io.to(receiver_id.toString()).emit('new_swap_received');
            io.to(receiver_id.toString()).emit('new_notification');
        }
        res.status(201).json({
            message: 'Trade request sent successfully!',
            trade,
        });
    }
    catch (err) {
        console.error('Create trade error:', err);
        res.status(400).json({
            message: err.message || 'Failed to create trade.',
        });
    }
});
/**
 * Update Trade Status (Accept, Reject, Complete, Cancel)
 * @route PUT /trades/:id/status
 */
const updateTradeStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = req.user.id;
        const tradeId = req.params.id;
        const { status, reason } = req.body;
        if (!status) {
            return res.status(400).json({
                message: 'Status is required.',
            });
        }
        const updatedTrade = yield trade_service_1.default.updateStatus(tradeId, userId, status, reason);
        const initiatorId = ((_a = updatedTrade.initiator_id._id) === null || _a === void 0 ? void 0 : _a.toString()) || updatedTrade.initiator_id.toString();
        const receiverId = ((_b = updatedTrade.receiver_id._id) === null || _b === void 0 ? void 0 : _b.toString()) || updatedTrade.receiver_id.toString();
        const partnerId = initiatorId === userId.toString() ? receiverId : initiatorId;
        let notifType = null;
        let notifTitle = '';
        let notifMessage = '';
        if (status === 'ACCEPTED') {
            notifType = 'SWAP_ACCEPTED';
            notifTitle = 'SWAP_AUTHORIZED';
            notifMessage = 'Your swap proposal has been authorized. Comm-link is now open.';
        }
        else if (status === 'REJECTED' || status === 'CANCELLED') {
            notifType = 'SWAP_CANCELLED';
            notifTitle = 'SWAP_TERMINATED';
            notifMessage = reason
                ? `A swap request has been declined or cancelled. Reason: ${reason}`
                : 'A swap request has been declined or cancelled.';
        }
        else if (status === 'COMPLETED') {
            if (updatedTrade.status !== 'COMPLETED') {
                notifType = 'PARTNER_COMPLETED';
                notifTitle = 'ACTION_REQUIRED';
                notifMessage = 'Your partner marked the trade as complete. Please confirm completion.';
            }
            else {
                notifType = 'SWAP_COMPLETED';
                notifTitle = 'SWAP_COMPLETED';
                notifMessage = 'Trade fully completed! You can now leave an evaluation.';
            }
        }
        if (notifType) {
            yield notification_service_1.default.createNotification({
                recipient_id: partnerId,
                type: notifType,
                title: notifTitle,
                message: notifMessage,
                trade_id: updatedTrade._id,
                partner_id: userId,
            });
        }
        const io = req.app.get('io');
        if (io && updatedTrade) {
            io.to(partnerId).emit('swap_status_updated');
            if (notifType) {
                io.to(partnerId).emit('new_notification');
            }
        }
        let message = `Trade marked as ${status}.`;
        if (status === 'COMPLETED' && updatedTrade.status !== 'COMPLETED') {
            message = 'Completion confirmed. Waiting for partner to confirm.';
        }
        res.status(200).json({
            message,
            trade: updatedTrade,
        });
    }
    catch (err) {
        res.status(400).json({
            message: err.message || 'Failed to update status.',
        });
    }
});
/**
 * Get All Trades for the Logged-in User
 * @route GET /trades/me
 */
const getMyTrades = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const trades = yield trade_service_1.default.getUserTrades(userId);
        res.status(200).json(trades);
    }
    catch (err) {
        console.error('Get trades error:', err);
        res.status(500).json({
            message: 'Server error while fetching trades.',
        });
    }
});
/**
 * Get Single Trade Details
 * @route GET /trades/:id
 */
const getTradeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tradeId = req.params.id;
        const trade = yield trade_service_1.default.getById(tradeId);
        if (!trade) {
            return res.status(404).json({
                message: 'Trade not found.',
            });
        }
        // Check if the requesting user is parf of the trade
        const userId = req.user.id;
        const isInitiator = trade.initiator_id._id.toString() === userId;
        const isReceiver = trade.receiver_id._id.toString() === userId;
        if (!isInitiator && !isReceiver) {
            return res.status(403).json({
                message: 'You are not authorized to view this trade.',
            });
        }
        res.status(200).json(trade);
    }
    catch (err) {
        res.status(500).json({
            message: 'Server error while fetching trade details.',
        });
    }
});
/**
 * Hide Trade from Inbox
 * @route PUT /trades/:id/hide
 */
const hideTrade = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const tradeId = req.params.id;
        const result = yield trade_service_1.default.hideTrade(tradeId, userId);
        res.status(200).json(result);
    }
    catch (err) {
        res.status(400).json({
            message: err.message || 'Failed to hide trade.',
        });
    }
});
/**
 * Get Public Trades for a Specific User
 * @route GET /trades/user/:userId
 */
const getUserTrades = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({
                message: 'User ID is required.',
            });
        }
        const trades = yield trade_service_1.default.getUserPublicTrades(userId);
        res.status(200).json(trades);
    }
    catch (err) {
        console.error('Get user public trades error:', err);
        res.status(500).json({
            message: 'Servere error while fetching public trade history.',
        });
    }
});
exports.default = {
    createTrade,
    updateTradeStatus,
    getMyTrades,
    getTradeById,
    hideTrade,
    getUserTrades,
};
