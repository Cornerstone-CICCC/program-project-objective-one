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
const location_model_1 = require("../models/location.model");
// Create new location
const add = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield location_model_1.Location.create(data);
});
// Get location by User ID
const getByUserId = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield location_model_1.Location.findOne({ user_id: userId });
});
// Update location
const update = (userId, lat, lng, address, city) => __awaiter(void 0, void 0, void 0, function* () {
    return yield location_model_1.Location.findOneAndUpdate({ user_id: userId }, {
        geo_location: {
            type: 'Point',
            coordinates: [lng, lat],
        },
        address,
        city,
    }, { new: true });
});
// Find users within a radius
const findNearby = (lng_1, lat_1, ...args_1) => __awaiter(void 0, [lng_1, lat_1, ...args_1], void 0, function* (lng, lat, maxDistanceInMeters = 5000) {
    return yield location_model_1.Location.find({
        geo_location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat],
                },
                $maxDistance: maxDistanceInMeters,
            },
        },
    }).populate('user_id', 'firstname lastname username avatar_url skillsOffering');
});
exports.default = {
    add,
    getByUserId,
    update,
    findNearby,
};
