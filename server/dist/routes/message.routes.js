"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const message_controller_1 = __importDefault(require("../controllers/message.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const messageRouter = (0, express_1.Router)();
messageRouter.use(auth_middleware_1.protect);
messageRouter.post('/', message_controller_1.default.sendMessage);
messageRouter.get('/:tradeId', message_controller_1.default.getTradeMessages);
messageRouter.put('/:id', message_controller_1.default.editMessage);
messageRouter.delete('/:id', message_controller_1.default.deleteMessage);
exports.default = messageRouter;
