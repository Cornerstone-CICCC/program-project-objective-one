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
/**
 * Create a new Trade Request
 * @route POST /trades
 */
const createTrade = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const initiator_id = req.user.id;
        const { receiver_id, offered_skill_id, sought_skill_id } = req.body;
        const trade = yield trade_service_1.default.create({
            initiator_id,
            receiver_id,
            offered_skill_id,
            sought_skill_id,
        });
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
    try {
        const userId = req.user.id;
        const tradeId = req.params.id;
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({
                message: 'Status is required.',
            });
        }
        const updatedTrade = yield trade_service_1.default.updateStatus(tradeId, userId, status);
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
exports.default = {
    createTrade,
    updateTradeStatus,
    getMyTrades,
    getTradeById,
};
