"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const auth_register_1 = require("../../controller/auth/auth.register");
const auth_code_1 = require("../../controller/auth/auth.code");
const auth_loginUser_1 = require("../../controller/auth/auth.loginUser");
// Wrapper function to catch async errors
const asyncHandler = (fn) => (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
};
const router = express_1.default.Router();
router.post("/generatecode", authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)("superadmin", "admin"), asyncHandler(auth_code_1.createRegistrationCode));
router.post("/registeradmin", asyncHandler(auth_register_1.registerAdmin));
router.post("/register", asyncHandler(auth_register_1.registerStaff));
router.post('/login', asyncHandler(auth_loginUser_1.loginUser));
router.post('/logout', authMiddleware_1.authenticateUser, asyncHandler(auth_loginUser_1.logoutUser));
// router.post('/forgot-password', asyncHandler(forgotPassword));
// router.post('/reset-password', asyncHandler(resetPassword));
exports.default = router;
