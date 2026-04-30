import { Request, Response } from 'express';
import ratingService from '../services/rating.service';
import tradeService from '../services/trade.service';
import notificationService from '../services/notification.service';

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

    const trade = await tradeService.getById(trade_id);
    if (trade) {
      const initiatorId = trade.initiator_id._id?.toString() || trade.initiator_id.toString();
      const receiverId = trade.receiver_id._id?.toString() || trade.receiver_id.toString();
      const partnerId = initiatorId === reviewer_id.toString() ? receiverId : initiatorId;

      await notificationService.createNotification({
        recipient_id: partnerId as any,
        type: 'NEW_EVALUATION',
        title: 'EVALUATION_RECEIVED',
        message: `Your swap partner submitted a ${score}-star post-trade report.`,
        trade_id: trade_id as any,
        partner_id: reviewer_id as any,
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

    if (updatedRating && updatedRating.trade_id) {
      const trade = await tradeService.getById(updatedRating.trade_id.toString());
      if (trade) {
        const initiatorId = trade.initiator_id._id?.toString() || trade.initiator_id.toString();
        const receiverId = trade.receiver_id._id?.toString() || trade.receiver_id.toString();
        const partnerId = initiatorId === reviewer_id.toString() ? receiverId : initiatorId;

        await notificationService.createNotification({
          recipient_id: partnerId as any,
          type: 'NEW_EVALUATION',
          title: 'EVALUATION_UPDATED',
          message: `Your partner revised their evaluation to ${score} stars.`,
          trade_id: updatedRating.trade_id as any,
          partner_id: reviewer_id as any,
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
const checkMyReviewStatus = async (req: Request<{ tradeId: string }>, res: Response) => {
  try {
    const reviewer_id = (req as any).user.id;
    const { tradeId } = req.params;

    if (!tradeId) {
      return res.status(400).json({
        message: 'Trade ID is required.',
      });
    }

    const existingReview = await ratingService.checkMyReview(tradeId, reviewer_id);

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
