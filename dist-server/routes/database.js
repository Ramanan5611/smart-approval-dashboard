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
var mongoose_1 = __importDefault(require("mongoose"));
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
// Apply middlewares to all routes in this router
router.use(authenticateToken);
router.use(isAdmin);
// GET all database collections
router.get('/collections', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var db, collections, collectionNames, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (mongoose_1.default.connection.readyState !== 1) {
                    return [2 /*return*/, res.status(500).json({ message: 'Database not connected' })];
                }
                db = mongoose_1.default.connection.db;
                // Safety check; type system isn't strictly aware if 'db' exists right after state=1 check
                if (!db) {
                    return [2 /*return*/, res.status(500).json({ message: 'Database reference undefined' })];
                }
                return [4 /*yield*/, db.listCollections().toArray()];
            case 1:
                collections = _a.sent();
                collectionNames = collections.map(function (col) { return col.name; });
                res.json(collectionNames);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('List collections error:', error_2);
                res.status(500).json({ message: 'Server error fetching collections' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET dynamic data from a specific collection
router.get('/collections/:name', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var collectionName, db, data, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                collectionName = req.params.name;
                if (mongoose_1.default.connection.readyState !== 1) {
                    return [2 /*return*/, res.status(500).json({ message: 'Database not connected' })];
                }
                db = mongoose_1.default.connection.db;
                if (!db) {
                    return [2 /*return*/, res.status(500).json({ message: 'Database reference undefined' })];
                }
                return [4 /*yield*/, db.collection(collectionName).find({}).sort({ _id: -1 }).toArray()];
            case 1:
                data = _a.sent();
                // Filter out passwords manually if looking at users table to avoid leaking hashes even to admin UI
                if (collectionName === 'users') {
                    data.forEach(function (doc) { return delete doc.password; });
                }
                res.json(data);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error("Get collection ".concat(req.params.name, " error:"), error_3);
                res.status(500).json({ message: "Server error fetching ".concat(req.params.name) });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// DELETE a document dynamically from any collection
router.delete('/collections/:name/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var collectionName, documentId, db, result, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                collectionName = req.params.name;
                documentId = req.params.id;
                if (mongoose_1.default.connection.readyState !== 1) {
                    return [2 /*return*/, res.status(500).json({ message: 'Database not connected' })];
                }
                db = mongoose_1.default.connection.db;
                if (!db) {
                    return [2 /*return*/, res.status(500).json({ message: 'Database reference undefined' })];
                }
                // Check if valid ObjectId format
                if (!mongoose_1.default.Types.ObjectId.isValid(documentId)) {
                    return [2 /*return*/, res.status(400).json({ message: 'Invalid Document ID format' })];
                }
                return [4 /*yield*/, db.collection(collectionName).deleteOne({ _id: new mongoose_1.default.Types.ObjectId(documentId) })];
            case 1:
                result = _a.sent();
                if (result.deletedCount === 0) {
                    return [2 /*return*/, res.status(404).json({ message: 'Document not found' })];
                }
                res.json({ message: 'Document deleted successfully' });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error("Delete from ".concat(req.params.name, " error:"), error_4);
                res.status(500).json({ message: "Server error deleting from ".concat(req.params.name) });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
