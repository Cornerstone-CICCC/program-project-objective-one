"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rating_controller_1 = __importDefault(require("../controllers/rating.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const ratingRouter = (0, express_1.Router)();
ratingRouter.get('/user/:userId', rating_controller_1.default.getUserReviews);
ratingRouter.post('/', auth_middleware_1.protect, rating_controller_1.default.createRating);
ratingRouter.get('/check/:tradeId', auth_middleware_1.protect, rating_controller_1.default.checkMyReviewStatus);
ratingRouter.put('/:id', auth_middleware_1.protect, rating_controller_1.default.updateRating);
ratingRouter.delete('/:id', auth_middleware_1.protect, rating_controller_1.default.deleteRating);
exports.default = ratingRouter;
