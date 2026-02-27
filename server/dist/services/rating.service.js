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
const mongoose_1 = __importDefault(require("mongoose"));
const rating_model_1 = require("../models/rating.model");
const trade_model_1 = require("../models/trade.model");
const user_model_1 = require("../models/user.model");
// Calculate & Update User Average
const recalculateUserAverage = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield rating_model_1.Rating.aggregate([
        { $match: { reviewee_id: new mongoose_1.default.Types.ObjectId(userId) } },
        {
            $group: {
                _id: '$reviewee_id',
                averageRating: { $avg: '$score' },
                numberOfReviews: { $sum: 1 },
            },
        },
    ]);
    if (stats.length > 0) {
        const roundedAverage = Math.round(stats[0].averageRating * 10) / 10;
        yield user_model_1.User.findByIdAndUpdate(userId, { average_rating: roundedAverage });
    }
    else {
        // If they deleted their ONLY review, reset the average to 0
        yield user_model_1.User.findByIdAndUpdate(userId, { average_rating: 0 });
    }
});
// Leaving a Rating & Review (Create)
const createRating = (reviewer_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const { trade_id, score, comment } = data;
    if (!trade_id || !score) {
        throw new Error('Trade ID and Score are required.');
    }
    // Verify the Trade exists and is COMPLETED
    const trade = yield trade_model_1.Trade.findById(trade_id);
    if (!trade) {
        throw new Error('Trade not found.');
    }
    if (trade.status !== 'COMPLETED') {
        throw new Error('You can only review a completed trade.');
    }
    // Figure out who the Reviewee is (The OTHER person in the trade)
    const isInitiator = trade.initiator_id.toString() === reviewer_id;
    const isReceiver = trade.receiver_id.toString() === reviewer_id;
    if (!isInitiator && !isReceiver) {
        throw new Error('You were not part of this trade.');
    }
    // If I am the initiator, the reviewee is the receiver (and vice versa)
    const reviewee_id = isInitiator ? trade.receiver_id : trade.initiator_id;
    // Check if a review already exists to prevent duplicates
    const existingReview = yield rating_model_1.Rating.findOne({ trade_id, reviewer_id });
    if (existingReview) {
        throw new Error('You have already reviewed this trade.');
    }
    const newRating = yield rating_model_1.Rating.create({
        trade_id,
        reviewee_id,
        reviewer_id,
        score,
        comment,
    });
    yield recalculateUserAverage(reviewee_id.toString());
    return newRating;
});
// Get All Reviews FOR a User
const getReviewsForUser = (reviewee_id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield rating_model_1.Rating.find({ reviewee_id })
        .populate('reviewer_id', 'firstname lastname username avatar_url')
        .populate({
        path: 'trade_id',
        populate: [
            { path: 'offered_skill_id', select: 'name category' },
            { path: 'sought_skill_id', select: 'name category' },
        ],
    })
        .sort({ created_at: -1 });
});
// Update (Edit an existing review)
const updateRating = (rating_id, reviewer_id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    // Prevent changing who the review is for or what trade it belongs to
    delete updates.trade_id;
    delete updates.reviewer_id;
    delete updates.reviewee_id;
    const rating = yield rating_model_1.Rating.findByIdAndUpdate({ _id: rating_id, reviewer_id: reviewer_id }, updates, { new: true });
    if (!rating) {
        throw new Error('Review not found or you do not have permission to edit it.');
    }
    yield recalculateUserAverage(rating === null || rating === void 0 ? void 0 : rating.reviewee_id.toString());
    return rating;
});
// Delete (Remove a review)
const deleteRating = (rating_id, reviewer_id) => __awaiter(void 0, void 0, void 0, function* () {
    const rating = yield rating_model_1.Rating.findByIdAndDelete({
        _id: rating_id,
        reviewer_id: reviewer_id,
    });
    if (!rating) {
        throw new Error('Review not found or you do not have permission to delete it.');
    }
    yield recalculateUserAverage(rating.reviewee_id.toString());
    return {
        message: 'Review deleted successfully.',
    };
});
// Check if I already reviewed a specific trade
const checkMyReview = (trade_id, reviewer_id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield rating_model_1.Rating.findOne({ trade_id, reviewer_id });
});
exports.default = {
    createRating,
    getReviewsForUser,
    updateRating,
    deleteRating,
    checkMyReview,
};
