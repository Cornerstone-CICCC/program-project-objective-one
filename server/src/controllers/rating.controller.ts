import { Request, Response } from 'express';
import ratingService from '../services/rating.service';

/**
 * Leave a Rating
 * @route POST /ratings
 */
const createRating = async (req: Request, res: Response) => {
  try {
    const reviewer_id = (req as any).user.id;
    const { trade_id, score, comment } = req.body;

    const newRating = await ratingService.createRating(reviewer_id, {
      trade_id,
      score,
      comment,
    });

    res.status(201).json({
      message: 'Review submitted successfully!',
      rating: newRating,
    });
  } catch (err: any) {
    console.error('Create rating error:', err);
    res.status(400).json({
      message: err.message || 'Failed to submit review.',
    });
  }
};

/**
 * Get All Reviews for a Specific User
 * @route GET /ratings/user/:userId
 */
const getUserReviews = async (req: Request<{ userId: string }>, res: Response) => {
  try {
    const { userId } = req.params;
    const reviews = await ratingService.getReviewsForUser(userId);

    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({
      message: 'Server error while fetching reviews.',
    });
  }
};

/**
 * Edit an Existing Review
 * @route PUT /ratings/:id
 */
const updateRating = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const reviewer_id = (req as any).user.id;
    const rating_id = req.params.id;
    const { score, comment } = req.body;

    const updatedRating = await ratingService.updateRating(rating_id, reviewer_id, {
      score,
      comment,
    });

    res.status(200).json({
      message: 'Review updated successfully!',
      rating: updateRating,
    });
  } catch (err: any) {
    res.status(400).json({
      message: err.message,
    });
  }
};

/**
 * Delete a Review
 * @route DELETE /ratings/:id
 */
const deleteRating = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const reviewer_id = (req as any).user.id;
    const rating_id = req.params.id;

    const result = await ratingService.deleteRating(rating_id, reviewer_id);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({
      message: err.message,
    });
  }
};

/**
 * Check if the logged-in user already reviewed a specific trade
 * @route GET /ratings/check/:tradeId
 */
const checkMyReviewStatus = async (req: Request<{ trade_id: string }>, res: Response) => {
  try {
    const reviewer_id = (req as any).user.id;
    const { trade_id } = req.params;

    const existingReview = await ratingService.checkMyReview(trade_id, reviewer_id);

    if (existingReview) {
      res.status(200).json({
        hasReviewed: true,
        review: existingReview,
      });
    } else {
      res.status(200).json({
        hasReviewed: false,
      });
    }
  } catch (err) {
    res.status(500).json({
      message: 'Error checking review status.',
    });
  }
};

export default {
  createRating,
  getUserReviews,
  updateRating,
  deleteRating,
  checkMyReviewStatus,
};
