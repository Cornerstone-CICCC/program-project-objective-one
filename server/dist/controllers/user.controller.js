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
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_utils_1 = require("../utils/auth.utils");
const user_model_1 = require("../models/user.model");
const user_service_1 = __importDefault(require("../services/user.service"));
const zxcvbn_1 = __importDefault(require("zxcvbn"));
/**
 * Sign up (Register User + Location)
 * @route POST /users/signup
 */
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstname, lastname, username, email, password, lat, lng, address, city } = req.body;
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
    if (lat === undefined || lng === undefined || !address || !city) {
        return res.status(400).json({
            message: 'Location data (lat, lng, address, city) is required!',
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
        const newUser = yield user_service_1.default.registerWithLocation({ firstname, lastname, username, email, password }, { lat, lng, address, city });
        if (!newUser) {
            return res.status(409).json({
                message: 'Failed to create user.',
            });
        }
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
                location_id: newUser.location_id,
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
                location_id: user.location_id,
            },
        });
    }
    catch (err) {
        res.status(500).json({
            message: 'Unable to login.',
        });
    }
});
/**
 * Get Current User Info
 * @route GET /users/me
 */
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
    res.status(200).json(user);
});
/**
 * Update Profile
 * @route PUT /users/profile
 */
const updateAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
            const isMatch = yield bcrypt_1.default.compare(currPassword, newPassword);
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
        res.status(200).json({
            message: 'Profile updated successfully!',
            user: updatedUser,
        });
    }
    catch (err) {
        (console.error('Update Error'),
            res.status(500).json({
                message: 'Server error during update.',
            }));
    }
});
/**
 * Delete Account
 * @route DELETE /users/delete
 */
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
exports.default = {
    signup,
    login,
    getMe,
    updateAccount,
    deleteAccount,
};
