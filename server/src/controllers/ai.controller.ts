import { Request, Response } from 'express';
import aiServie from '../services/ai.service';

/**
 * Get AI-generated trade matches for the current user
 * @route GET /ai/matches
 */
const getAIMatches = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const matches = await aiServie.generateMatches(userId);

    res.status(200).json(matches);
  } catch (err: any) {
    console.error('AI Matchmaking Controller Error:', err);
    if (err.message.includes('must add offering and seeking skills')) {
      return res.status(400).json({
        message: err.message,
      });
    }

    res.status(500).json({
      message: 'Failed to generate AI matches. Please try again later.',
    });
  }
};

export default {
  getAIMatches,
};
