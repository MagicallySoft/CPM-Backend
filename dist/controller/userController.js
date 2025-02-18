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
exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userModel_1 = __importDefault(require("../models/userModel"));
const AppError_1 = require("../utils/AppError");
const responseHandler_1 = require("../utils/responseHandler");
const jwtUtils_1 = require("../utils/jwtUtils");
// Register User
const registerUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password, role } = req.body;
    const requiredFields = ['username', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
        return next(new AppError_1.AppError(`${missingFields.join(', ')} ${missingFields.length > 1 ? 'are' : 'is'} required!`, 400));
    }
    try {
        const existingUser = yield userModel_1.default.findOne({ email });
        if (existingUser) {
            return next(new AppError_1.AppError("User with this email already exists!", 400));
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        const newUser = new userModel_1.default({
            username,
            email,
            password,
            role,
            lastLogin: null,
        });
        yield newUser.save();
        return (0, responseHandler_1.sendSuccessResponse)(res, 201, "User registered successfully!", {
            username: newUser.username,
            email: newUser.email,
            role: newUser.role
        });
    }
    catch (error) {
        console.log(error);
        // Handle MongoDB Duplicate Key Error (E11000)
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern)[0];
            return (0, responseHandler_1.sendErrorResponse)(res, 400, `The ${duplicateField} '${error.keyValue[duplicateField]}' is already taken!`);
        }
        // Handle Mongoose Validation Errors
        if (error.name === "ValidationError") {
            const validationErrors = {};
            Object.keys(error.errors).forEach((key) => {
                validationErrors[key] = error.errors[key].message;
            });
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Validation failed", validationErrors);
        }
        next(new AppError_1.AppError("Internal Server Error", 500));
    }
});
exports.registerUser = registerUser;
const loginUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    console.log(email, password);
    if (!email || !password) {
        return (0, responseHandler_1.sendErrorResponse)(res, 400, "Email and password are required!");
    }
    try {
        // Find user by email
        const user = yield userModel_1.default.findOne({ email });
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
        const token = (0, jwtUtils_1.generateToken)(user._id.toString(), user.role);
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Login successful!", {
            token,
            user: {
                id: user._id,
                username: user.username,
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
