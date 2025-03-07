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
exports.loginUser = void 0;
// controllers/auth.controller.ts
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const StaffUserModel_1 = __importDefault(require("../../models/registretion/StaffUserModel"));
const AdminUserModel_1 = __importDefault(require("../../models/registretion/AdminUserModel"));
const AuditLog_1 = __importDefault(require("../../models/registretion/AuditLog"));
const SubscriptionModel_1 = __importDefault(require("../../models/registretion/SubscriptionModel"));
const jwtUtils_1 = require("../../utils/jwtUtils");
const responseHandler_1 = require("../../utils/responseHandler");
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        // For admin users, check subscription validity
        if (userType === "AdminUser") {
            const now = new Date();
            const subscription = yield SubscriptionModel_1.default.findOne({
                adminId: user._id,
                status: "active",
                startDate: { $lte: now },
                endDate: { $gte: now },
            });
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
        const token = (0, jwtUtils_1.generateToken)(user._id.toString(), userType === "AdminUser" ? user.role : user.role.type);
        // Audit log for the login event
        yield AuditLog_1.default.create({
            action: "User Login",
            userId: user._id,
            userType,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent") || "",
            timestamp: new Date(),
        });
        // console.log(user);
        const userData = {
            id: user._id,
            name: user.username,
            email: user.email,
            role: user.role,
            Subscription: user.Subscription
        };
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Login successful", { token, userData });
    }
    catch (error) {
        console.error("Login Error: ", error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
});
exports.loginUser = loginUser;
