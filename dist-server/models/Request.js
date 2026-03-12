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
var mongoose_1 = __importStar(require("mongoose"));
var types_1 = require("../types");
var LogEntrySchema = new mongoose_1.Schema({
    date: {
        type: String,
        required: true
    },
    actorName: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    comment: {
        type: String
    }
}, { _id: false });
var RequestSchema = new mongoose_1.Schema({
    studentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studentName: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    currentStage: {
        type: String,
        enum: Object.values(types_1.RequestStage),
        required: true
    },
    status: {
        type: String,
        enum: Object.values(types_1.RequestStatus),
        required: true
    },
    logs: [LogEntrySchema],
    complianceScore: {
        type: Number,
        min: 0,
        max: 100
    },
    complianceReason: {
        type: String
    },
    requestType: { type: String },
    priority: { type: String },
    studentIdNumber: { type: String },
    needsFacultyApproval: { type: Boolean, default: false },
    needsHodApproval: { type: Boolean, default: false },
    needsOdApproval: { type: Boolean, default: false },
    needsLeaveApproval: { type: Boolean, default: false },
    needsMailIdUnblock: { type: Boolean, default: false },
    email: { type: String },
    phone: { type: String },
    mailIdReason: { type: String },
    additionalNotes: { type: String }
}, {
    timestamps: true
});
// Add a virtual for formatted ID
RequestSchema.virtual('id').get(function () {
    return this._id.toHexString();
});
// Ensure virtuals are serialized
RequestSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});
exports.default = mongoose_1.default.model('Request', RequestSchema);
