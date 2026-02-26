"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trade_controller_1 = __importDefault(require("../controllers/trade.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const tradeRouter = (0, express_1.Router)();
tradeRouter.use(auth_middleware_1.protect);
tradeRouter.post('/', trade_controller_1.default.createTrade);
tradeRouter.get('/me', trade_controller_1.default.getMyTrades);
tradeRouter.get('/:id', trade_controller_1.default.getTradeById);
tradeRouter.put('/:id/status', trade_controller_1.default.updateTradeStatus);
exports.default = tradeRouter;
