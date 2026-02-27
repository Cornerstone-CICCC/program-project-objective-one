import mongoose from 'mongoose';
import { Rating, IRating } from '../models/rating.model';
import { Trade } from '../models/trade.model';
import { User } from '../models/user.model';

// Calculate & Update User Average
const recalculateUserAverage = async (userId: string) => {
  const stats = await Rating.aggregate([
    { $match: { reviewee_id: new mongoose.Types.ObjectId(userId) } },
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
    await User.findByIdAndUpdate(userId, { average_rating: roundedAverage });
  } else {
    // If they deleted their ONLY review, reset the average to 0
    await User.findByIdAndUpdate(userId, { average_rating: 0 });
  }
};

// Leaving a Rating & Review (Create)
const createRating = async (reviewer_id: string, data: Partial<IRating>) => {
  const { trade_id, score, comment } = data;

  if (!trade_id || !score) {
    throw new Error('Trade ID and Score are required.');
  }

  // Verify the Trade exists and is COMPLETED
  const trade = await Trade.findById(trade_id);
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
  const existingReview = await Rating.findOne({ trade_id, reviewer_id });
  if (existingReview) {
    throw new Error('You have already reviewed this trade.');
  }

  const newRating = await Rating.create({
    trade_id,
    reviewee_id,
    reviewer_id,
    score,
    comment,
  });

  await recalculateUserAverage(reviewee_id.toString());

  return newRating;
};

// Get All Reviews FOR a User
const getReviewsForUser = async (reviewee_id: string) => {
  return await Rating.find({ reviewee_id })
    .populate('reviewer_id', 'firstname lastname username avatar_url')
    .populate({
      path: 'trade_id',
      populate: [
        { path: 'offered_skill_id', select: 'name category' },
        { path: 'sought_skill_id', select: 'name category' },
      ],
    })
    .sort({ created_at: -1 });
};

// Update (Edit an existing review)
const updateRating = async (rating_id: string, reviewer_id: string, updates: Partial<IRating>) => {
  // Prevent changing who the review is for or what trade it belongs to
  delete updates.trade_id;
  delete updates.reviewer_id;
  delete updates.reviewee_id;

  const rating = await Rating.findByIdAndUpdate(
    { _id: rating_id, reviewer_id: reviewer_id },
    updates,
    { new: true },
  );

  if (!rating) {
    throw new Error('Review not found or you do not have permission to edit it.');
  }

  await recalculateUserAverage(rating?.reviewee_id.toString());

  return rating;
};

// Delete (Remove a review)
const deleteRating = async (rating_id: string, reviewer_id: string) => {
  const rating = await Rating.findByIdAndDelete({
    _id: rating_id,
    reviewer_id: reviewer_id,
  });

  if (!rating) {
    throw new Error('Review not found or you do not have permission to delete it.');
  }

  await recalculateUserAverage(rating.reviewee_id.toString());

  return {
    message: 'Review deleted successfully.',
  };
};

// Check if I already reviewed a specific trade
const checkMyReview = async (trade_id: string, reviewer_id: string) => {
  return await Rating.findOne({ trade_id, reviewer_id });
};

export default {
  createRating,
  getReviewsForUser,
  updateRating,
  deleteRating,
  checkMyReview,
};
