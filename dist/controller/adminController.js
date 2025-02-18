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
exports.deleteUserByAdmin = exports.getUsersByAdmin = exports.userList = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
const employeeModel_1 = __importDefault(require("../models/employeeModel"));
const responseHandler_1 = require("../utils/responseHandler");
const userList = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch superadmins and admins from User table
        const users = yield userModel_1.default.find({ role: { $in: ["superadmin", "admin"] } }, "username email role adminId")
            .populate("adminId", "username email role")
            .lean();
        // Fetch users from Employee table
        const employees = yield employeeModel_1.default.find({}, "username email role adminId")
            .populate("adminId", "username email role")
            .lean();
        // Group users by role
        const groupedUsers = {
            superadmins: users.filter((user) => user.role === "superadmin"),
            admins: users.filter((user) => user.role === "admin"),
            users: employees, // All employees are considered "users"
        };
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Users and Employees retrieved successfully", groupedUsers);
    }
    catch (error) {
        console.error("Error in userList:", error);
        next(error);
    }
});
exports.userList = userList;
const getUsersByAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const id = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "admin" ? (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId : (_c = req.user) === null || _c === void 0 ? void 0 : _c.adminId;
        // Check if the logged-in user is an admin
        if (!id) {
            return (0, responseHandler_1.sendErrorResponse)(res, 403, "Access denied. Admins only.");
        }
        // Fetch users associated with the admin
        const users = yield employeeModel_1.default.find({ adminId: id }).select("username email role createdAt updatedAt designation");
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Users fetched successfully", users);
    }
    catch (error) {
        console.error(error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
    }
});
exports.getUsersByAdmin = getUsersByAdmin;
const deleteUserByAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params; // User ID to be deleted
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // Admin's ID from authenticated request
        // Check if user exists and belongs to the admin
        const user = yield employeeModel_1.default.findOne({ _id: id, adminId });
        if (!user) {
            return (0, responseHandler_1.sendErrorResponse)(res, 404, "User not found or unauthorized.");
        }
        // Delete the user
        yield employeeModel_1.default.findByIdAndDelete(id);
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "User deleted successfully.");
    }
    catch (error) {
        console.error(error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
    }
});
exports.deleteUserByAdmin = deleteUserByAdmin;
