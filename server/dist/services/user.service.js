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
const user_model_1 = require("../models/user.model");
const location_model_1 = require("../models/location.model");
const bcrypt_1 = __importDefault(require("bcrypt"));
const mongoose_1 = __importDefault(require("mongoose"));
// Get all users
const getAll = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield user_model_1.User.find().select('-password');
});
// Get user by ID
const getById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield user_model_1.User.findById(id).populate('location_id');
});
// Get user by email
const getByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    return yield user_model_1.User.findOne({ email }).select('+password').populate('location_id');
});
// Registration (User + Location)
const registerWithLocation = (userData, locationData) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstname, lastname, username, email, password } = userData;
    const existingUser = yield user_model_1.User.findOne({ $or: [{ email }, { username }] });
    if (existingUser)
        return null;
    const userId = new mongoose_1.default.Types.ObjectId();
    const locationId = new mongoose_1.default.Types.ObjectId();
    const hashedPassword = yield bcrypt_1.default.hash(password, 12);
    const newLocation = yield location_model_1.Location.create({
        _id: locationId,
        user_id: userId,
        geo_location: {
            type: 'Point',
            coordinates: [locationData.lng, locationData.lat],
        },
        address: locationData.address,
        city: locationData.city,
    });
    const newUser = yield user_model_1.User.create({
        _id: userId,
        firstname,
        lastname,
        username,
        email,
        password: hashedPassword,
        location_id: newLocation._id,
    });
    return newUser;
});
// Update user
const update = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield user_model_1.User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
});
// Increment trade stats
const updateTradeStats = (id, newRating) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(id);
    if (!user)
        return null;
    const currentTotal = user.average_rating * user.total_trades;
    const newTotalTrades = user.total_trades + 1;
    const newAverage = (currentTotal + newRating) / newTotalTrades;
    user.total_trades = newTotalTrades;
    user.average_rating = Number(newAverage.toFixed(2));
    return yield user.save();
});
// Login user
const login = (details) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = details;
    const foundUser = yield getByEmail(email);
    if (!foundUser)
        return null;
    const isMatch = yield bcrypt_1.default.compare(password, foundUser.password);
    if (!isMatch)
        return null;
    const userObj = foundUser.toObject();
    delete userObj.password;
    return {
        user: userObj,
    };
});
// Delete user
const remove = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield location_model_1.Location.findOneAndDelete({ user_id: id });
    const deleteUser = yield user_model_1.User.findByIdAndDelete(id);
    return deleteUser;
});
exports.default = {
    getAll,
    getById,
    getByEmail,
    registerWithLocation,
    update,
    updateTradeStats,
    login,
    remove,
};
