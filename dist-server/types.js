"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestStatus = exports.RequestStage = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["STUDENT"] = "STUDENT";
    UserRole["FACULTY"] = "FACULTY";
    UserRole["HOD"] = "HOD";
    UserRole["STUDENT_AFFAIRS"] = "STUDENT_AFFAIRS";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var RequestStage;
(function (RequestStage) {
    RequestStage["SUBMITTED"] = "SUBMITTED";
    RequestStage["FACULTY_REVIEW"] = "FACULTY_REVIEW";
    RequestStage["HOD_REVIEW"] = "HOD_REVIEW";
    RequestStage["STUDENT_AFFAIRS_APPROVAL"] = "STUDENT_AFFAIRS_APPROVAL";
    RequestStage["COMPLETED"] = "COMPLETED";
})(RequestStage || (exports.RequestStage = RequestStage = {}));
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["PENDING"] = "PENDING";
    RequestStatus["APPROVED"] = "APPROVED";
    RequestStatus["REJECTED"] = "REJECTED";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
