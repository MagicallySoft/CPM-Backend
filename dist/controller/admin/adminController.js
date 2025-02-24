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
const AdminUserModel_1 = __importDefault(require("../../models/auth/AdminUserModel"));
const StaffUserModel_1 = __importDefault(require("../../models/auth/StaffUserModel"));
const responseHandler_1 = require("../../utils/responseHandler");
const userList = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch all relevant users from User table
        const users = yield AdminUserModel_1.default.find({ role: { $in: ["superadmin", "admin", "subadmin", "employee"] } }, "username email role adminId")
            .populate("adminId", "username email role")
            .lean();
        // Group users by role
        const groupedUsers = {
            superadmins: users.filter((user) => user.role === "superadmin"),
            admins: users.filter((user) => user.role === "admin"),
            subadmins: users.filter((user) => user.role),
            employees: users.filter((user) => user.role),
        };
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Users retrieved successfully", groupedUsers);
    }
    catch (error) {
        console.error("Error in userList:", error);
        next(error);
    }
});
exports.userList = userList;
const getUsersByAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        // console.log("User",user)
        if (!user) {
            return (0, responseHandler_1.sendErrorResponse)(res, 403, "Unauthorized access.");
        }
        let adminId;
        // Determine the appropriate adminId based on the role of the logged-in user.
        if (user.role === "admin") {
            adminId = user.id; // Admin fetching their own staff
        }
        else if (user.role === "subadmin") {
            adminId = user.adminId; // Subadmin fetching staff under their parent admin
        }
        else {
            return (0, responseHandler_1.sendErrorResponse)(res, 403, "Access denied. Only admins or subadmins can access this.");
        }
        // Fetch staff users for the given adminId, filtering by role type.
        const staffUsers = yield StaffUserModel_1.default.find({ adminId, "role.type": { $in: ["subadmin", "employee"] } }, "username email role createdAt updatedAt ").lean();
        // console.log("staffUsers--->", staffUsers)
        // Group the fetched staff users by their role.
        const groupedUsers = {
            subadmins: staffUsers.filter((u) => u.role.type === "subadmin"),
            employees: staffUsers.filter((u) => u.role.type === "employee"),
        };
        // console.log("groupedUsers",groupedUsers)
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Users fetched successfully", groupedUsers);
    }
    catch (error) {
        console.error("Error in getUsersByAdmin:", error);
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
        const user = yield StaffUserModel_1.default.findOne({ _id: id, adminId });
        if (!user) {
            return (0, responseHandler_1.sendErrorResponse)(res, 404, "User not found or unauthorized.");
        }
        // Delete the user
        yield StaffUserModel_1.default.findByIdAndDelete(id);
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "User deleted successfully.");
    }
    catch (error) {
        console.error(error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
    }
});
exports.deleteUserByAdmin = deleteUserByAdmin;
