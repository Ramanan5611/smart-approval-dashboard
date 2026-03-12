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
var dotenv_1 = __importDefault(require("dotenv"));
var dns_1 = __importDefault(require("dns"));
dns_1.default.setServers(['8.8.8.8', '8.8.4.4']);
var database_1 = require("../config/database");
var index_1 = require("../models/index");
var types_1 = require("../types");
// Load environment variables
dotenv_1.default.config();
var seedUsers = [
    {
        username: 'student_user',
        password: 'stud123',
        role: types_1.UserRole.STUDENT,
        name: 'Alice Student'
    },
    {
        username: 'faculty_adv',
        password: 'fac123',
        role: types_1.UserRole.FACULTY,
        name: 'Dr. Smith (Advisor)'
    },
    {
        username: 'hod_dept',
        password: 'hod123',
        role: types_1.UserRole.HOD,
        name: 'Prof. Jones (HOD)'
    },
    {
        username: 'student_admin',
        password: 'sa123',
        role: types_1.UserRole.STUDENT_AFFAIRS,
        name: 'Student Affairs Admin'
    },
    {
        username: 'admin_system',
        password: 'admin123',
        role: types_1.UserRole.ADMIN,
        name: 'System Admin'
    }
];
var seedRequests = [
    {
        studentName: 'Alice Student',
        title: 'Research Grant for AI Project',
        description: 'Requesting $500 for cloud GPU credits to train a neural network model for the senior thesis project.',
        currentStage: types_1.RequestStage.FACULTY_REVIEW,
        status: types_1.RequestStatus.PENDING,
        logs: [
            { date: new Date().toISOString(), actorName: 'Alice Student', action: 'Submitted Request' }
        ]
    },
    {
        studentName: 'Alice Student',
        title: 'Conference Travel Approval',
        description: 'Permission to travel to NYC for the Tech 2024 conference.',
        currentStage: types_1.RequestStage.COMPLETED,
        status: types_1.RequestStatus.APPROVED,
        logs: [
            { date: new Date(Date.now() - 86400000 * 5).toISOString(), actorName: 'Alice Student', action: 'Submitted Request' },
            { date: new Date(Date.now() - 86400000 * 4).toISOString(), actorName: 'Dr. Smith', action: 'Approved (Faculty)' },
            { date: new Date(Date.now() - 86400000 * 3).toISOString(), actorName: 'Prof. Jones', action: 'Approved (HOD)' },
            { date: new Date(Date.now() - 86400000 * 2).toISOString(), actorName: 'Student Affairs Admin', action: 'Final Approval' },
        ]
    }
];
var seedDatabase = function () { return __awaiter(void 0, void 0, void 0, function () {
    var createdUsers, _i, seedUsers_1, userData, user, studentUser_1, requestsWithStudentId, createdRequests, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 10, 11, 13]);
                console.log('Connecting to database...');
                return [4 /*yield*/, (0, database_1.connectDB)()];
            case 1:
                _a.sent();
                // Clear existing data
                console.log('Clearing existing data...');
                return [4 /*yield*/, index_1.Request.deleteMany({})];
            case 2:
                _a.sent();
                return [4 /*yield*/, index_1.User.deleteMany({})];
            case 3:
                _a.sent();
                console.log('Seeding users...');
                createdUsers = [];
                _i = 0, seedUsers_1 = seedUsers;
                _a.label = 4;
            case 4:
                if (!(_i < seedUsers_1.length)) return [3 /*break*/, 7];
                userData = seedUsers_1[_i];
                user = new index_1.User(userData);
                return [4 /*yield*/, user.save()];
            case 5:
                _a.sent();
                createdUsers.push(user);
                _a.label = 6;
            case 6:
                _i++;
                return [3 /*break*/, 4];
            case 7:
                console.log("Created ".concat(createdUsers.length, " users:"));
                createdUsers.forEach(function (user) {
                    console.log("  ".concat(user.username, " / [HIDDEN] (").concat(user.role, ")"));
                });
                studentUser_1 = createdUsers.find(function (u) { return u.role === types_1.UserRole.STUDENT; });
                if (!studentUser_1) return [3 /*break*/, 9];
                // Seed requests with student ID
                console.log('Seeding requests...');
                requestsWithStudentId = seedRequests.map(function (req) { return (__assign(__assign({}, req), { studentId: studentUser_1._id })); });
                return [4 /*yield*/, index_1.Request.create(requestsWithStudentId)];
            case 8:
                createdRequests = _a.sent();
                console.log("Created ".concat(createdRequests.length, " requests"));
                _a.label = 9;
            case 9:
                console.log('Database seeded successfully!');
                console.log('\nDemo credentials:');
                seedUsers.forEach(function (user) {
                    console.log("  ".concat(user.username, " / ").concat(user.password, " (").concat(user.role, ")"));
                });
                return [3 /*break*/, 13];
            case 10:
                error_1 = _a.sent();
                console.error('Error seeding database:', error_1.message);
                if (error_1.errors) {
                    console.error('Validation Errors:', error_1.errors);
                }
                return [3 /*break*/, 13];
            case 11: return [4 /*yield*/, (0, database_1.disconnectDB)()];
            case 12:
                _a.sent();
                process.exit(0);
                return [7 /*endfinally*/];
            case 13: return [2 /*return*/];
        }
    });
}); };
seedDatabase();
