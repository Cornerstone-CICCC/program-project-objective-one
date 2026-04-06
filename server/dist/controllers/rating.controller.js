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
const rating_service_1 = __importDefault(require("../services/rating.service"));
const trade_service_1 = __importDefault(require("../services/trade.service"));
const notification_service_1 = __importDefault(require("../services/notification.service"));
/**
 * Leave a Rating
 * @route POST /ratings
 */
const createRating = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const reviewer_id = req.user.id;
        const { trade_id, score, comment } = req.body;
        const newRating = yield rating_service_1.default.createRating(reviewer_id, {
            trade_id,
            score,
            comment,
        });
        const trade = yield trade_service_1.default.getById(trade_id);
        if (trade) {
            const initiatorId = ((_a = trade.initiator_id._id) === null || _a === void 0 ? void 0 : _a.toString()) || trade.initiator_id.toString();
            const receiverId = ((_b = trade.receiver_id._id) === null || _b === void 0 ? void 0 : _b.toString()) || trade.receiver_id.toString();
            const partnerId = initiatorId === reviewer_id.toString() ? receiverId : initiatorId;
            yield notification_service_1.default.createNotification({
                recipient_id: partnerId,
                type: 'NEW_EVALUATION',
                title: 'EVALUATION_RECEIVED',
                message: `Your swap partner submitted a ${score}-star post-trade report.`,
                trade_id: trade_id,
                partner_id: reviewer_id,
            });
            const io = req.app.get('io');
            if (io) {
                io.to(partnerId).emit('new_notification');
            }
        }
        res.status(201).json({
            message: 'Review submitted successfully!',
            rating: newRating,
        });
    }
    catch (err) {
        console.error('Create rating error:', err);
        res.status(400).json({
            message: err.message || 'Failed to submit review.',
        });
    }
});
/**
 * Get All Reviews for a Specific User
 * @route GET /ratings/user/:userId
 */
const getUserReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const reviews = yield rating_service_1.default.getReviewsForUser(userId);
        res.status(200).json(reviews);
    }
    catch (err) {
        res.status(500).json({
            message: 'Server error while fetching reviews.',
        });
    }
});
/**
 * Edit an Existing Review
 * @route PUT /ratings/:id
 */
const updateRating = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const reviewer_id = req.user.id;
        const rating_id = req.params.id;
        const { score, comment } = req.body;
        const updatedRating = yield rating_service_1.default.updateRating(rating_id, reviewer_id, {
            score,
            comment,
        });
        if (updatedRating && updatedRating.trade_id) {
            const trade = yield trade_service_1.default.getById(updatedRating.trade_id.toString());
            if (trade) {
                const initiatorId = ((_a = trade.initiator_id._id) === null || _a === void 0 ? void 0 : _a.toString()) || trade.initiator_id.toString();
                const receiverId = ((_b = trade.receiver_id._id) === null || _b === void 0 ? void 0 : _b.toString()) || trade.receiver_id.toString();
                const partnerId = initiatorId === reviewer_id.toString() ? receiverId : initiatorId;
                yield notification_service_1.default.createNotification({
                    recipient_id: partnerId,
                    type: 'NEW_EVALUATION',
                    title: 'EVALUATION_UPDATED',
                    message: `Your partner revised their evaluation to ${score} stars.`,
                    trade_id: updatedRating.trade_id,
                    partner_id: reviewer_id,
                });
                const io = req.app.get('io');
                if (io) {
                    io.to(partnerId).emit('new_notification');
                }
            }
        }
        res.status(200).json({
            message: 'Review updated successfully!',
            rating: updatedRating,
        });
    }
    catch (err) {
        res.status(400).json({
            message: err.message,
        });
    }
});
/**
 * Delete a Review
 * @route DELETE /ratings/:id
 */
const deleteRating = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reviewer_id = req.user.id;
        const rating_id = req.params.id;
        const result = yield rating_service_1.default.deleteRating(rating_id, reviewer_id);
        res.status(200).json(result);
    }
    catch (err) {
        res.status(400).json({
            message: err.message,
        });
    }
});
/**
 * Check if the logged-in user already reviewed a specific trade
 * @route GET /ratings/check/:tradeId
 */
const checkMyReviewStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reviewer_id = req.user.id;
        const { tradeId } = req.params;
        if (!tradeId) {
            return res.status(400).json({
                message: 'Trade ID is required.',
            });
        }
        const existingReview = yield rating_service_1.default.checkMyReview(tradeId, reviewer_id);
        if (existingReview) {
            res.status(200).json({
                hasReviewed: true,
                review: existingReview,
            });
        }
        else {
            res.status(200).json({
                hasReviewed: false,
            });
        }
    }
    catch (err) {
        res.status(500).json({
            message: 'Error checking review status.',
        });
    }
});
exports.default = {
    createRating,
    getUserReviews,
    updateRating,
    deleteRating,
    checkMyReviewStatus,
};
