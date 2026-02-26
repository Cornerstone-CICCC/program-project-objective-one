"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trade = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TradeSchema = new mongoose_1.Schema({
    initiator_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    offered_skill_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Skill',
        required: true,
    },
    sought_skill_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Skill',
        required: true,
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING',
        index: true,
    },
    completion_confirmed_initiator: {
        type: Boolean,
        default: false,
    },
    completion_confirmed_receiver: {
        type: Boolean,
        default: false,
    },
    completed_at: {
        type: Date,
    },
}, {
    timestamps: true,
});
TradeSchema.index({ initiator_id: 1, status: 1 });
TradeSchema.index({ receiver_id: 1, status: 1 });
exports.Trade = mongoose_1.default.model('Trade', TradeSchema);
