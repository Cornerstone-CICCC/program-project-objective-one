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
Object.defineProperty(exports, "__esModule", { value: true });
const trade_model_1 = require("../models/trade.model");
const user_model_1 = require("../models/user.model");
const userSkill_model_1 = require("../models/userSkill.model");
const skill_model_1 = require("../models/skill.model");
/**
 * Get Network
 * @route GET /network/pulse
 */
const getNetworkPulse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeSwapsThisWeek = yield trade_model_1.Trade.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
        const newNodesThisWeek = yield user_model_1.User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
        const totalSkillsInCirculation = yield skill_model_1.Skill.countDocuments();
        const skillStats = yield userSkill_model_1.UserSkill.aggregate([
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
    }
    catch (err) {
        console.error('Network pulse error:', err);
        res.status(500).json({
            message: 'Failed to retrieve network pulse data.',
        });
    }
});
exports.default = {
    getNetworkPulse,
};
