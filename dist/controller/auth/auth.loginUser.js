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
exports.logoutUser = exports.loginUser = void 0;
// controllers/auth/auth.controller.ts
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const StaffUserModel_1 = __importDefault(require("../../models/auth/StaffUserModel"));
const AdminUserModel_1 = __importDefault(require("../../models/auth/AdminUserModel"));
const SubscriptionModel_1 = __importDefault(require("../../models/auth/SubscriptionModel"));
const jwtUtils_1 = require("../../utils/jwtUtils");
const responseHandler_1 = require("../../utils/responseHandler");
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { email, password, mfaCode, isAdmin } = req.body;
        // console.log({ email, password, mfaCode, isAdmin });
        // Validate required fields
        if (!email || !password) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Email and password are required");
        }
        let user;
        let userType;
        // If isAdmin flag is true, look up in AdminUser; else, in StaffUser
        if (isAdmin === true || isAdmin === "true") {
            user = yield AdminUserModel_1.default.findOne({ email });
            userType = "AdminUser";
        }
        else {
            user = yield StaffUserModel_1.default.findOne({ email });
            userType = "StaffUser";
        }
        // console.log("user--->", user);
        if (!user) {
            return (0, responseHandler_1.sendErrorResponse)(res, 401, "Invalid credentials");
        }
        // Check if account is locked
        if (user.lockUntil && user.lockUntil > new Date()) {
            return (0, responseHandler_1.sendErrorResponse)(res, 403, "Account is temporarily locked. Please try again later.");
        }
        // Validate password
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            yield user.incrementLoginAttempts();
            return (0, responseHandler_1.sendErrorResponse)(res, 401, "Invalid credentials");
        }
        // Reset login attempts if necessary
        user.loginAttempts = 0;
        user.lockUntil = null;
        yield user.save();
        // Update login activity: mark as logged in and update lastLogin timestamp
        user.lastLogin = new Date();
        user.IsLogin = true;
        yield user.save();
        // For admin users, check subscription validity
        if (userType === "AdminUser") {
            const now = new Date();
            const subscription = yield SubscriptionModel_1.default.findOne({
                adminId: user._id,
                status: "active",
                startDate: { $lte: now },
                endDate: { $gte: now },
            });
            // console.log("subscription--->", subscription);
            if (!subscription) {
                return (0, responseHandler_1.sendErrorResponse)(res, 403, "Subscription expired or inactive. Please renew your subscription.");
            }
        }
        // Optionally check MFA if enabled (using a library like speakeasy)
        if (user.mfaSecret) {
            // if (!validateMfaCode(user.mfaSecret, mfaCode)) {
            //   return sendErrorResponse(res, 401, "Invalid MFA code");
            // }
        }
        // Generate JWT token
        const token = (0, jwtUtils_1.generateToken)(user._id.toString(), userType === "AdminUser" ? user.role : user.role.type, (_a = user.adminId) === null || _a === void 0 ? void 0 : _a.toString());
        // Audit log for the login event
        // await AuditLog.create({
        //   action: "User Login",
        //   userId: user._id,
        //   userType,
        //   ipAddress: req.ip,
        //   userAgent: req.get("User-Agent") || "",
        //   timestamp: new Date(),
        // });
        // console.log(user);
        const userData = {
            id: user._id,
            name: user.username,
            email: user.email,
            role: userType === "AdminUser" ? user.role : user.role.type,
            Subscription: user === null || user === void 0 ? void 0 : user.Subscription
        };
        // console.log({ token, userData });
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Login successful", { token, userData });
    }
    catch (error) {
        console.error("Login Error: ", error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
});
exports.loginUser = loginUser;
const logoutUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        console.log(user);
        if (!user) {
            return (0, responseHandler_1.sendErrorResponse)(res, 403, "Unauthorized access");
        }
        // Update user status to mark as logged out
        user.IsLogin = false;
        yield user.save();
        // Audit log for the logout event
        // await AuditLog.create({
        //   action: "User Logout",
        //   userId: user._id,
        //   userType: user.role === "admin" || user.role === "superadmin" ? "AdminUser" : "StaffUser",
        //   ipAddress: req.ip,
        //   userAgent: req.get("User-Agent") || "",
        //   timestamp: new Date(),
        // });
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Logout successful", {});
    }
    catch (error) {
        console.error("Logout Error: ", error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
});
exports.logoutUser = logoutUser;
