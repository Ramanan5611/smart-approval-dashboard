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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var index_1 = require("../models/index");
var types_1 = require("../types");
var router = express_1.default.Router();
// Middleware to verify JWT token
var authenticateToken = function (req, res, next) {
    var authHeader = req.headers['authorization'];
    var token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.userId = decoded.userId;
        next();
    });
};
// Get requests for the current user
router.get('/', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, requests, _a, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 14, , 15]);
                return [4 /*yield*/, index_1.User.findById(req.userId)];
            case 1:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({ message: 'User not found' })];
                }
                requests = void 0;
                _a = user.role;
                switch (_a) {
                    case types_1.UserRole.STUDENT: return [3 /*break*/, 2];
                    case types_1.UserRole.FACULTY: return [3 /*break*/, 4];
                    case types_1.UserRole.HOD: return [3 /*break*/, 6];
                    case types_1.UserRole.STUDENT_AFFAIRS: return [3 /*break*/, 8];
                    case types_1.UserRole.ADMIN: return [3 /*break*/, 10];
                }
                return [3 /*break*/, 12];
            case 2: return [4 /*yield*/, index_1.Request.find({ studentId: user._id }).sort({ createdAt: -1 })];
            case 3:
                requests = _b.sent();
                return [3 /*break*/, 13];
            case 4: return [4 /*yield*/, index_1.Request.find({
                    currentStage: types_1.RequestStage.FACULTY_REVIEW,
                    status: types_1.RequestStatus.PENDING
                }).sort({ createdAt: -1 })];
            case 5:
                requests = _b.sent();
                return [3 /*break*/, 13];
            case 6: return [4 /*yield*/, index_1.Request.find({
                    currentStage: types_1.RequestStage.HOD_REVIEW,
                    status: types_1.RequestStatus.PENDING
                }).sort({ createdAt: -1 })];
            case 7:
                requests = _b.sent();
                return [3 /*break*/, 13];
            case 8: return [4 /*yield*/, index_1.Request.find({
                    currentStage: types_1.RequestStage.STUDENT_AFFAIRS_APPROVAL,
                    status: types_1.RequestStatus.PENDING
                }).sort({ createdAt: -1 })];
            case 9:
                requests = _b.sent();
                return [3 /*break*/, 13];
            case 10: return [4 /*yield*/, index_1.Request.find().sort({ createdAt: -1 })];
            case 11:
                requests = _b.sent();
                return [3 /*break*/, 13];
            case 12:
                requests = [];
                _b.label = 13;
            case 13:
                res.json(requests);
                return [3 /*break*/, 15];
            case 14:
                error_1 = _b.sent();
                console.error('Get requests error:', error_1);
                res.status(500).json({ message: 'Server error' });
                return [3 /*break*/, 15];
            case 15: return [2 /*return*/];
        }
    });
}); });
// Create a new request
router.post('/', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, _a, title, description, requestType, priority, studentIdNumber, needsFacultyApproval, needsHodApproval, needsOdApproval, needsLeaveApproval, needsMailIdUnblock, email, phone, mailIdReason, additionalNotes, documents, newRequest, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                return [4 /*yield*/, index_1.User.findById(req.userId)];
            case 1:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({ message: 'User not found' })];
                }
                if (user.role !== types_1.UserRole.STUDENT) {
                    return [2 /*return*/, res.status(403).json({ message: 'Only students can create requests' })];
                }
                _a = req.body, title = _a.title, description = _a.description, requestType = _a.requestType, priority = _a.priority, studentIdNumber = _a.studentIdNumber, needsFacultyApproval = _a.needsFacultyApproval, needsHodApproval = _a.needsHodApproval, needsOdApproval = _a.needsOdApproval, needsLeaveApproval = _a.needsLeaveApproval, needsMailIdUnblock = _a.needsMailIdUnblock, email = _a.email, phone = _a.phone, mailIdReason = _a.mailIdReason, additionalNotes = _a.additionalNotes, documents = _a.documents;
                if (!title || !description) {
                    return [2 /*return*/, res.status(400).json({ message: 'Title and description are required' })];
                }
                newRequest = new index_1.Request({
                    studentId: user._id,
                    studentName: user.name,
                    title: title,
                    description: description,
                    requestType: requestType,
                    priority: priority,
                    studentIdNumber: studentIdNumber,
                    needsFacultyApproval: needsFacultyApproval,
                    needsHodApproval: needsHodApproval,
                    needsOdApproval: needsOdApproval,
                    needsLeaveApproval: needsLeaveApproval,
                    needsMailIdUnblock: needsMailIdUnblock,
                    email: email,
                    phone: phone,
                    mailIdReason: mailIdReason,
                    additionalNotes: additionalNotes,
                    currentStage: types_1.RequestStage.FACULTY_REVIEW,
                    status: types_1.RequestStatus.PENDING,
                    logs: [{
                            date: new Date().toISOString(),
                            actorName: user.name,
                            action: 'Submitted Request'
                        }]
                });
                return [4 /*yield*/, newRequest.save()];
            case 2:
                _b.sent();
                res.status(201).json(newRequest);
                return [3 /*break*/, 4];
            case 3:
                error_2 = _b.sent();
                console.error('Create request error:', error_2);
                res.status(500).json({ message: 'Server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Update a request (approve/reject)
router.put('/:id', authenticateToken, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, _a, action, comment, requestId, request, canAct, nextStage, nextStatus, log, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                return [4 /*yield*/, index_1.User.findById(req.userId)];
            case 1:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({ message: 'User not found' })];
                }
                _a = req.body, action = _a.action, comment = _a.comment;
                requestId = req.params.id;
                if (!action || !['approve', 'reject'].includes(action)) {
                    return [2 /*return*/, res.status(400).json({ message: 'Action must be approve or reject' })];
                }
                return [4 /*yield*/, index_1.Request.findById(requestId)];
            case 2:
                request = _b.sent();
                if (!request) {
                    return [2 /*return*/, res.status(404).json({ message: 'Request not found' })];
                }
                canAct = (user.role === types_1.UserRole.FACULTY && request.currentStage === types_1.RequestStage.FACULTY_REVIEW) ||
                    (user.role === types_1.UserRole.HOD && request.currentStage === types_1.RequestStage.HOD_REVIEW) ||
                    (user.role === types_1.UserRole.STUDENT_AFFAIRS && request.currentStage === types_1.RequestStage.STUDENT_AFFAIRS_APPROVAL);
                if (!canAct) {
                    return [2 /*return*/, res.status(403).json({ message: 'You do not have permission to act on this request' })];
                }
                nextStage = request.currentStage;
                nextStatus = types_1.RequestStatus.PENDING;
                if (action === 'approve') {
                    // Custom Workflow Logic based on requestType
                    if (request.currentStage === types_1.RequestStage.FACULTY_REVIEW) {
                        if (request.requestType === 'leave' || request.requestType === 'mailid') {
                            // Leave and Mail ID only need Faculty approval
                            nextStage = types_1.RequestStage.COMPLETED;
                            nextStatus = types_1.RequestStatus.APPROVED;
                        }
                        else if (request.requestType === 'od') {
                            // OD needs Faculty -> HOD
                            nextStage = types_1.RequestStage.HOD_REVIEW;
                        }
                        else {
                            // Default fallback
                            nextStage = types_1.RequestStage.HOD_REVIEW;
                        }
                    }
                    else if (request.currentStage === types_1.RequestStage.HOD_REVIEW) {
                        if (request.requestType === 'od') {
                            // OD stops after HOD
                            nextStage = types_1.RequestStage.COMPLETED;
                            nextStatus = types_1.RequestStatus.APPROVED;
                        }
                        else {
                            // Default fallback
                            nextStage = types_1.RequestStage.STUDENT_AFFAIRS_APPROVAL;
                        }
                    }
                    else if (request.currentStage === types_1.RequestStage.STUDENT_AFFAIRS_APPROVAL) {
                        nextStage = types_1.RequestStage.COMPLETED;
                        nextStatus = types_1.RequestStatus.APPROVED;
                    }
                }
                else {
                    // Reject
                    nextStage = types_1.RequestStage.COMPLETED;
                    nextStatus = types_1.RequestStatus.REJECTED;
                }
                log = {
                    date: new Date().toISOString(),
                    actorName: user.name,
                    action: "".concat(action === 'approve' ? 'Approved' : 'Rejected', " (").concat(user.role, ")"),
                    comment: comment
                };
                request.currentStage = nextStage;
                request.status = nextStatus;
                request.logs.push(log);
                return [4 /*yield*/, request.save()];
            case 3:
                _b.sent();
                res.json(request);
                return [3 /*break*/, 5];
            case 4:
                error_3 = _b.sent();
                console.error('Update request error:', error_3);
                res.status(500).json({ message: 'Server error' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
