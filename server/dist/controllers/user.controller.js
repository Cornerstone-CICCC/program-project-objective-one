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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_utils_1 = require("../utils/auth.utils");
const user_model_1 = require("../models/user.model");
const user_service_1 = __importDefault(require("../services/user.service"));
const zxcvbn_1 = __importDefault(require("zxcvbn"));
const userSkill_model_1 = require("../models/userSkill.model");
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
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
 * Sign up (Register User + Location)
 * @route POST /users/signup
 */
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstname, lastname, username, email, password, lat, lng, address, city, province, country, } = req.body;
    // Validate basic fields
    if (!(firstname === null || firstname === void 0 ? void 0 : firstname.trim()) ||
        !(lastname === null || lastname === void 0 ? void 0 : lastname.trim()) ||
        !(username === null || username === void 0 ? void 0 : username.trim()) ||
        !(email === null || email === void 0 ? void 0 : email.trim()) ||
        !(password === null || password === void 0 ? void 0 : password.trim())) {
        return res.status(400).json({
            message: 'Missing required registration fields!',
        });
    }
    // Validate location fields
    if (lat === undefined || lng === undefined || !city || !province || !country) {
        return res.status(400).json({
            message: 'Location data (lat, lng, city, province, country) is required!',
        });
    }
    // Password strength check
    const strength = (0, zxcvbn_1.default)(password);
    if (strength.score < 3) {
        return res.status(400).json({
            message: 'Password is too weak.',
            feedback: strength.feedback.warning || 'Avoid common patterns and names.',
            suggestions: strength.feedback.suggestions,
        });
    }
    // Duplicate check
    const existingUser = yield user_model_1.User.findOne({
        $or: [{ email: email }, { username: username }],
    });
    if (existingUser) {
        if (existingUser.email === email) {
            return res.status(409).json({
                message: 'Email is already registered.',
            });
        }
        if (existingUser.username === username) {
            return res.status(409).json({
                message: 'Username is already taken.',
            });
        }
    }
    try {
        const newUser = yield user_service_1.default.registerWithLocation({ firstname, lastname, username, email, password }, { lat, lng, address, city, province, country });
        if (!newUser) {
            return res.status(409).json({
                message: 'Failed to create user.',
            });
        }
        yield newUser.populate('location_id');
        // Generate token
        const token = (0, auth_utils_1.generateToken)(newUser._id.toString());
        res.status(201).json({
            message: 'User successfully registered!',
            token,
            user: {
                id: newUser._id,
                firstname: newUser.firstname,
                lastname: newUser.lastname,
                username: newUser.username,
                email: newUser.email,
                avatar_url: newUser.avatar_url,
                bio: newUser.bio,
                location: newUser.location_id,
                average_rating: newUser.average_rating,
                total_reviews: newUser.total_reviews,
            },
        });
    }
    catch (err) {
        console.error('Signup Error:', err);
        res.status(500).json({
            message: 'Server error.',
        });
    }
});
/**
 * Log in
 * @route POST /users/login
 */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!(email === null || email === void 0 ? void 0 : email.trim()) || !(password === null || password === void 0 ? void 0 : password.trim())) {
        return res.status(400).json({
            message: 'Email and password are required!',
        });
    }
    try {
        const result = yield user_service_1.default.login({ email, password });
        if (!result) {
            return res.status(401).json({
                message: 'Incorrect email or password!',
            });
        }
        const { user } = result;
        const token = (0, auth_utils_1.generateToken)(user._id.toString());
        const { offering, seeking } = yield fetchUserSkills(user._id);
        res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                username: user.username,
                avatar_url: user.avatar_url,
                bio: user.bio,
                location: user.location_id,
                average_rating: user.average_rating,
                total_reviews: user.total_reviews,
                offering,
                seeking,
            },
        });
    }
    catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({
            message: 'Unable to login.',
        });
    }
});
/**
 * Get All Users
 * @route GET /users
 */
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_service_1.default.getAll();
        yield user_model_1.User.populate(users, { path: 'location_id' });
        const usersWithSkills = yield Promise.all(users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            const { offering, seeking } = yield fetchUserSkills(user._id);
            return Object.assign(Object.assign({}, user.toObject()), { location: user.location_id, offering,
                seeking });
        })));
        res.status(200).json(usersWithSkills);
    }
    catch (err) {
        console.error('Get all users error:', err);
        res.status(500).json({
            messsage: 'Server error while fetching users.',
        });
    }
});
/**
 * Get User by ID
 * @route GET /users/:id
 */
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield user_service_1.default.getById(id);
        if (!user) {
            return res.status(404).json({
                message: 'User not found.',
            });
        }
        const _a = user.toObject(), { email, password } = _a, publicUser = __rest(_a, ["email", "password"]);
        const { offering, seeking } = yield fetchUserSkills(user._id);
        res.status(200).json(Object.assign(Object.assign({}, publicUser), { location: user.location_id, offering,
            seeking }));
    }
    catch (err) {
        console.error('Get user by ID error:', err);
        res.status(500).json({
            message: 'Server error while fetching user details.',
        });
    }
});
/**
 * Get Current User Info
 * @route GET /users/me
 */
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
    if (!userId) {
        return res.status(401).json({
            message: 'Not authorized.',
        });
    }
    const user = yield user_service_1.default.getById(userId);
    if (!user) {
        return res.status(404).json({
            message: 'User not found.',
        });
    }
    const { offering, seeking } = yield fetchUserSkills(user._id);
    res.status(200).json(Object.assign(Object.assign({}, user.toObject()), { location: user.location_id, offering,
        seeking }));
});
/**
 * Update Profile
 * @route PUT /users/profile
 */
const updateAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
    const { firstname, lastname, username, email, currPassword, newPassword, bio, avatar_url } = req.body;
    try {
        const user = yield user_model_1.User.findById(userId).select('+password');
        if (!user)
            return res.status(404).json({
                message: 'User not found.',
            });
        // Password update
        let finalPassword = user.password;
        if (newPassword) {
            if (!currPassword) {
                return res.status(400).json({
                    message: 'Current password is required to set a new one.',
                });
            }
            const isMatch = yield bcrypt_1.default.compare(currPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    message: 'Incorrect current password.',
                });
            }
            const strength = (0, zxcvbn_1.default)(newPassword);
            if (strength.score < 3) {
                return res.status(400).json({
                    message: 'New password is too weak.',
                    suggestions: strength.feedback.suggestions,
                });
            }
            finalPassword = yield bcrypt_1.default.hash(newPassword, 12);
        }
        // Duplicate check
        if (email && email !== user.email) {
            const emailExists = yield user_model_1.User.findOne({ email, _id: { $ne: userId } });
            if (emailExists)
                return res.status(409).json({
                    message: 'Email already in use.',
                });
        }
        if (username && username !== user.username) {
            const usernameExists = yield user_model_1.User.findOne({ username, _id: { $ne: userId } });
            if (usernameExists)
                return res.status(409).json({
                    message: 'Username already taken.',
                });
        }
        const updateData = {
            firstname: firstname || user.firstname,
            lastname: lastname || user.lastname,
            username: username || user.username,
            email: email || user.email,
            bio: bio || user.bio,
            avatar_url: avatar_url || user.avatar_url,
            password: finalPassword,
        };
        const updatedUser = yield user_service_1.default.update(userId, updateData);
        yield (updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.populate('location_id'));
        const { offering, seeking } = yield fetchUserSkills(userId);
        res.status(200).json({
            message: 'Profile updated successfully!',
            user: Object.assign(Object.assign({}, updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.toObject()), { location: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.location_id, offering,
                seeking }),
        });
    }
    catch (err) {
        console.error('Update Error', err);
        res.status(500).json({
            message: 'Server error during update.',
        });
    }
});
/**
 * Delete Account
 * @route DELETE /users/delete
 */
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
    const deleted = yield user_service_1.default.remove(userId);
    if (!deleted) {
        return res.status(400).json({
            message: 'Failed to delete user!',
        });
    }
    res.status(200).json({
        message: 'Account deleted successfully!',
    });
});
/**
 * Upload Avatar to Cloudinary
 * @route POST /users/upload-avatar
 */
const uploadAvatar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        cloudinary_1.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        if (!req.file) {
            return res.status(400).json({
                message: 'No image file provided.',
            });
        }
        const uploadResult = yield new Promise((resolve, reject) => {
            var _a;
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder: 'swappa_avatars',
                transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }],
            }, (error, result) => {
                if (error)
                    return reject(error);
                resolve(result);
            });
            const bufferStream = new stream_1.PassThrough();
            bufferStream.end((_a = req.file) === null || _a === void 0 ? void 0 : _a.buffer);
            bufferStream.pipe(uploadStream);
        });
        res.status(200).json({
            message: 'Image uploaded successfully',
            secure_url: uploadResult.secure_url,
        });
    }
    catch (err) {
        console.error('Cloudinary backend error:', err);
        res.status(500).json({
            message: 'Failed to upload image securely.',
        });
    }
});
exports.default = {
    signup,
    login,
    getAllUsers,
    getUserById,
    getMe,
    updateAccount,
    deleteAccount,
    uploadAvatar,
};
