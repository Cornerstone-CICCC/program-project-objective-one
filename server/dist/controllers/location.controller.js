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
const location_service_1 = __importDefault(require("../services/location.service"));
const userSkill_model_1 = require("../models/userSkill.model");
const user_model_1 = require("../models/user.model");
// Fetch a user's skills
const fetchUserSkills = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const userSkills = yield userSkill_model_1.UserSkill.find({ user_id: userId }).populate('skill_id');
    const offering = userSkills
        .filter((userSkill) => userSkill.type === 'TEACH')
        .map((userSkill) => userSkill.skill_id.name);
    const seeking = userSkills
        .filter((userSkill) => userSkill.type === 'LEARN')
        .map((userSkill) => userSkill.skill_id.name);
    return { offering, seeking };
});
/**
 * Update Current Location (GPS Ping)
 * @route PUT /locations/update
 * @desc Called when user moves or manually changes address
 */
const updateLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { lat, lng, address, city } = req.body;
    if (!userId) {
        return res.status(401).json({
            message: 'Not authorized',
        });
    }
    if (lat === undefined || lng === undefined || !address || !city) {
        return res.status(400).json({
            message: 'Missing location fields (lat, lng, address, city',
        });
    }
    try {
        const updatedLocation = yield location_service_1.default.update(userId, lat, lng, address, city);
        if (!updatedLocation) {
            return res.status(404).json({
                message: 'Location not found for this user',
            });
        }
        res.status(200).json({
            message: 'Location updated!',
            location: updatedLocation,
        });
    }
    catch (err) {
        res.status(500).json({
            message: 'Server error updating location',
        });
    }
});
/**
 * Get Nearby Swaps (Discovery Map)
 * @route GET /locations/nearby?lat=...&lng=...&radius=...
 * @desc MOVED here from User Controller for better organization
 */
const getNearby = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) {
        return res.status(400).json({
            message: 'Latitude and Longitude required',
        });
    }
    try {
        const distance = radius ? parseInt(radius) : 5000;
        const locations = yield location_service_1.default.findNearby(parseFloat(lng), parseFloat(lat), distance);
        const populatedLocations = yield user_model_1.User.populate(locations, {
            path: 'user_id',
            select: 'firstname lastname username avatar_url bio',
        });
        const mapReadyData = yield Promise.all(populatedLocations.map((location) => __awaiter(void 0, void 0, void 0, function* () {
            if (!location.user_id)
                return null;
            const { offering, seeking } = yield fetchUserSkills(location.user_id._id);
            return {
                id: location.user_id._id,
                name: `${location.user_id.firstname} ${location.user_id.lastname}`,
                username: location.user_id.username,
                avatar: location.user_id.avatar_url,
                bio: location.user_id.bio,
                lat: location.geo_location.coordinates[1],
                lng: location.geo_location.coordinates[0],
                city: location.city,
                offering,
                seeking,
            };
        })));
        const finalCleanData = mapReadyData.filter((item) => item !== null);
        res.status(200).json(finalCleanData);
    }
    catch (err) {
        res.status(500).json({
            message: 'Error calculating nearby user locations',
        });
    }
});
exports.default = {
    updateLocation,
    getNearby,
};
