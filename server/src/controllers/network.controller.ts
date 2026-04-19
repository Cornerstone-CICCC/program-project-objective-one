import { Request, Response } from 'express';
import { Trade } from '../models/trade.model';
import { User } from '../models/user.model';
import { UserSkill } from '../models/userSkill.model';
import { Skill } from '../models/skill.model';

/**
 * Get Network
 * @route GET /network/pulse
 */
const getNetworkPulse = async (req: Request, res: Response) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeSwapsThisWeek = await Trade.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const newNodesThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const totalSkillsInCirculation = await Skill.countDocuments();

    const skillStats = await UserSkill.aggregate([
      {
        $group: {
          _id: '$skill_id',
          seeking: { $sum: { $cond: [{ $eq: ['$type', 'LEARN'] }, 1, 0] } },
          offering: { $sum: { $cond: [{ $eq: ['$type', 'TEACH'] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'skills',
          localField: '_id',
          foreignField: '_id',
          as: 'skillInfo',
        },
      },
      {
        $unwind: '$skillInfo',
      },
      {
        $project: {
          skill: '$skillInfo.name',
          seeking: 1,
          offering: 1,
          ratio: {
            $divide: ['$seeking', { $cond: [{ $eq: ['$offering', 0] }, 1, '$offering'] }],
          },
        },
      },
    ]);

    const arbitrageOpportunities = [...skillStats]
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 3)
      .map((stat) => ({
        skill: stat.skill,
        seeking: stat.seeking,
        offering: stat.offering,
        trend: 0,
      }));

    const trendingSkills = [...skillStats]
      .sort((a, b) => b.seeking - a.seeking)
      .slice(0, 4)
      .map((stat) => ({
        skill: stat.skill,
        seeking: stat.seeking,
        offering: stat.offering,
        trend: Math.min(stat.seeking * 2 + stat.skill.length, 99),
      }));

    res.status(200).json({
      networkStats: {
        activeSwapsThisWeek,
        newNodesThisWeek,
        totalSkillsInCirculation,
      },
      arbitrageOpportunities,
      trendingSkills,
    });
  } catch (err: any) {
    console.error('Network pulse error:', err);
    res.status(500).json({
      message: 'Failed to retrieve network pulse data.',
    });
  }
};

export default {
  getNetworkPulse,
};
