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
exports.resetPassword = exports.forgotPassword = exports.logoutUser = exports.loginUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const userModel_1 = __importDefault(require("../../models/auth/userModel"));
const responseHandler_1 = require("../../utils/responseHandler");
const jwtUtils_1 = require("../../utils/jwtUtils");
const emailService_1 = require("../../utils/emailService"); // Utility to send emails
// Temporary token storage (Use Redis or Database in production)
const blacklistedTokens = new Set();
const loginUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email, password } = req.body;
    if (!email || !password) {
        return (0, responseHandler_1.sendErrorResponse)(res, 400, "Email and password are required!");
    }
    try {
        // Try finding the user in both User and Employee collections
        let user = yield userModel_1.default.findOne({ email });
        if (!user) {
            return (0, responseHandler_1.sendErrorResponse)(res, 404, "User not found!");
        }
        // Compare password
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return (0, responseHandler_1.sendErrorResponse)(res, 401, "Invalid credentials!");
        }
        // Update last login timestamp
        user.lastLogin = new Date();
        yield user.save();
        // Generate JWT token
        const token = (0, jwtUtils_1.generateToken)(user._id.toString(), user.role, ((_a = user.adminId) === null || _a === void 0 ? void 0 : _a.toString()) || null // Handle cases where adminId might be undefined
        );
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Login successful!", {
            token,
            user: {
                id: user._id,
                username: user.username || user.name, // Handle different field names
                email: user.email,
                role: user.role,
                lastLogin: user.lastLogin,
            },
        });
    }
    catch (error) {
        console.error("Error in loginUser:", error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal server error");
    }
});
exports.loginUser = loginUser;
//  Logout API (Token Blacklisting)
const logoutUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.header("Authorization")) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
    if (!token) {
        return (0, responseHandler_1.sendErrorResponse)(res, 400, "No token provided.");
    }
    blacklistedTokens.add(token); // Add token to blacklist (Consider Redis for real-world apps)
    return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Logout successful!");
});
exports.logoutUser = logoutUser;
//  Forgot Password API (Send Reset Link via Email)
const forgotPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        return (0, responseHandler_1.sendErrorResponse)(res, 400, "Email is required!");
    }
    try {
        const user = yield userModel_1.default.findOne({ email });
        if (!user) {
            return (0, responseHandler_1.sendErrorResponse)(res, 404, "User not found!");
        }
        // Generate a password reset token (valid for 15 minutes)
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        const hashedResetToken = crypto_1.default
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
        user.resetPasswordToken = hashedResetToken;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiration
        yield user.save();
        // Send reset email
        const resetUrl = `http://yourfrontend.com/reset-password/${resetToken}`;
        yield (0, emailService_1.sendEmail)(user.email, "Password Reset Request", `Click here to reset your password: ${resetUrl}`);
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Password reset link sent to your email!");
    }
    catch (error) {
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal server error");
    }
});
exports.forgotPassword = forgotPassword;
//  Reset Password API (After User Clicks Reset Link)
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return (0, responseHandler_1.sendErrorResponse)(res, 400, "Token and new password are required!");
    }
    try {
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        const user = yield userModel_1.default.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() }, // Check if token is still valid
        });
        if (!user) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid or expired reset token!");
        }
        // Hash new password
        const salt = yield bcryptjs_1.default.genSalt(10);
        user.password = yield bcryptjs_1.default.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        yield user.save();
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Password reset successful!");
    }
    catch (error) {
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal server error");
    }
});
exports.resetPassword = resetPassword;
