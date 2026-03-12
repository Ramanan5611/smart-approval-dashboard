"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var passwordValidation_1 = require("../utils/passwordValidation");
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
// Middleware to check if user is an ADMIN
var isAdmin = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var user, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.User.findById(req.userId)];
            case 1:
                user = _a.sent();
                if (!user || user.role !== types_1.UserRole.ADMIN) {
                    return [2 /*return*/, res.status(403).json({ message: 'Admin access required' })];
                }
                next();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Admin verification error:', error_1);
                res.status(500).json({ message: 'Server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
// GET all users
router.get('/', authenticateToken, isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var users, formattedUsers, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, index_1.User.find().select('-password').sort({ createdAt: -1 })];
            case 1:
                users = _a.sent();
                formattedUsers = users.map(function (user) {
                    var obj = user.toObject();
                    return __assign(__assign({}, obj), { id: obj._id });
                });
                res.json(formattedUsers);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Get all users error:', error_2);
                res.status(500).json({ message: 'Server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST new user
router.post('/', authenticateToken, isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, role, name_1, passwordCheck, existingUser, user, userObject, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, username = _a.username, password = _a.password, role = _a.role, name_1 = _a.name;
                if (!username || !password || !role || !name_1) {
                    return [2 /*return*/, res.status(400).json({ message: 'All fields are required' })];
                }
                passwordCheck = (0, passwordValidation_1.validatePassword)(password);
                if (!passwordCheck.isValid) {
                    return [2 /*return*/, res.status(400).json({ message: passwordCheck.message })];
                }
                return [4 /*yield*/, index_1.User.findOne({ username: username })];
            case 1:
                existingUser = _b.sent();
                if (existingUser) {
                    return [2 /*return*/, res.status(400).json({ message: 'Username already exists' })];
                }
                user = new index_1.User({
                    username: username,
                    password: password,
                    role: role,
                    name: name_1
                });
                return [4 /*yield*/, user.save()];
            case 2:
                _b.sent();
                userObject = user.toObject();
                delete userObject.password;
                res.status(201).json(__assign(__assign({}, userObject), { id: userObject._id }));
                return [3 /*break*/, 4];
            case 3:
                error_3 = _b.sent();
                console.error('Create user error:', error_3);
                res.status(500).json({ message: 'Server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// PUT (update) existing user
router.put('/:id', authenticateToken, isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, role, name_2, userId, user, existingUser, userObject, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = req.body, username = _a.username, role = _a.role, name_2 = _a.name;
                userId = req.params.id;
                return [4 /*yield*/, index_1.User.findById(userId)];
            case 1:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({ message: 'User not found' })];
                }
                if (!(username && username !== user.username)) return [3 /*break*/, 3];
                return [4 /*yield*/, index_1.User.findOne({ username: username })];
            case 2:
                existingUser = _b.sent();
                if (existingUser) {
                    return [2 /*return*/, res.status(400).json({ message: 'Username already exists' })];
                }
                user.username = username;
                _b.label = 3;
            case 3:
                if (role)
                    user.role = role;
                if (name_2)
                    user.name = name_2;
                return [4 /*yield*/, user.save()];
            case 4:
                _b.sent();
                userObject = user.toObject();
                delete userObject.password;
                res.json(__assign(__assign({}, userObject), { id: userObject._id }));
                return [3 /*break*/, 6];
            case 5:
                error_4 = _b.sent();
                console.error('Update user error:', error_4);
                res.status(500).json({ message: 'Server error' });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// DELETE a user
router.delete('/:id', authenticateToken, isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, result, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.params.id;
                // Prevent admin from deleting themselves
                if (userId === req.userId) {
                    return [2 /*return*/, res.status(400).json({ message: 'Cannot delete your own admin account' })];
                }
                return [4 /*yield*/, index_1.User.findByIdAndDelete(userId)];
            case 1:
                result = _a.sent();
                if (!result) {
                    return [2 /*return*/, res.status(404).json({ message: 'User not found' })];
                }
                res.json({ message: 'User deleted successfully' });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                console.error('Delete user error:', error_5);
                res.status(500).json({ message: 'Server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST to reset a user's password
router.post('/:id/reset-password', authenticateToken, isAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var newPassword, userId, passwordCheck, user, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                newPassword = req.body.newPassword;
                userId = req.params.id;
                if (!newPassword) {
                    return [2 /*return*/, res.status(400).json({ message: 'New password is required' })];
                }
                passwordCheck = (0, passwordValidation_1.validatePassword)(newPassword);
                if (!passwordCheck.isValid) {
                    return [2 /*return*/, res.status(400).json({ message: passwordCheck.message })];
                }
                return [4 /*yield*/, index_1.User.findById(userId)];
            case 1:
                user = _a.sent();
                if (!user) {
                    return [2 /*return*/, res.status(404).json({ message: 'User not found' })];
                }
                user.password = newPassword;
                return [4 /*yield*/, user.save()];
            case 2:
                _a.sent();
                res.json({ message: 'Password reset successfully' });
                return [3 /*break*/, 4];
            case 3:
                error_6 = _a.sent();
                console.error('Reset password error:', error_6);
                res.status(500).json({ message: 'Server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
