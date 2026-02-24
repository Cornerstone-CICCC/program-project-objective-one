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
exports.protect = void 0;
const auth_utils_1 = require("../utils/auth.utils");
const user_model_1 = require("../models/user.model");
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = (0, auth_utils_1.verifyToken)(token);
            // Check if user still exists in DB
            const user = yield user_model_1.User.findById(decoded.id).select('-password');
            if (!user) {
                return res.status(401).json({
                    message: 'Not authorized, user not found.',
                });
            }
            req.user = user;
            next();
        }
        catch (err) {
            console.error('Auth middleware error:', err);
            res.status(401).json({
                message: 'Not authorized, token failed.',
            });
        }
    }
    if (!token) {
        res.status(401).json({
            message: 'Not authorized, no token.',
        });
    }
});
exports.protect = protect;
