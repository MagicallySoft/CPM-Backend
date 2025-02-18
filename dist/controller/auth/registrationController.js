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
exports.registerWithCode = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userModel_1 = __importDefault(require("../../models/auth/userModel"));
const registretioncodeModel_1 = __importDefault(require("../../models/auth/registretioncodeModel"));
const AppError_1 = require("../../utils/AppError");
const responseHandler_1 = require("../../utils/responseHandler");
const registerWithCode = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password, registrationCode } = req.body;
    // Basic validation
    if (!username) {
        return (0, responseHandler_1.sendErrorResponse)(res, 400, "User Name is required!");
    }
    if (!registrationCode) {
        return (0, responseHandler_1.sendErrorResponse)(res, 400, "Registration code is required!");
    }
    try {
        // Check if the registration code is valid and exists in the DB
        const code = yield registretioncodeModel_1.default.findOne({ code: registrationCode });
        if (!code) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid or expired registration code.");
        }
        if (code.used == true) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Registration code has been used.");
        }
        // Fetch the creator details to understand the user's role
        const creator = yield userModel_1.default.findById(code.createdBy);
        if (!creator) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid creator of this registration code.");
        }
        // Check if the user already exists (to prevent duplicates)
        const existingUser = yield userModel_1.default.findOne({ email });
        if (existingUser) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "User with this email already exists.");
        }
        // Create the new user based on the role of the creator
        let newUser;
        if (creator.role === "admin") {
            // Assign designation if the role is employee
            newUser = new userModel_1.default({
                username,
                email,
                password,
                role: code.assignedToRole || "employee", // Default to employee role
                adminId: code.createdBy,
                designation: code.designation || null,
                registrationCode: code.code,
            });
        }
        else if (creator.role === "superadmin") {
            // Superadmins can create other users directly
            newUser = new userModel_1.default({
                username,
                email,
                password,
                role: code.assignedToRole,
                adminId: code.createdBy,
                registrationCode: code.code,
                renewDate: code.expiresAt
            });
        }
        else {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid role in registration code.");
        }
        // Encrypt the password
        newUser.password = yield bcryptjs_1.default.hash(newUser.password, 10);
        // Save the user
        yield newUser.save();
        // Mark the registration code as used
        code.used = true;
        yield code.save();
        // Generate a JWT token for the new user
        // const token = generateToken(newUser._id, newUser.role);
        // Send a successful response
        return (0, responseHandler_1.sendSuccessResponse)(res, 201, "User registered successfully!", {
            username,
            email,
            role: newUser.role,
            // token,
        });
    }
    catch (error) {
        if (error.name === "ValidationError") {
            const errorMessages = Object.values(error.errors).map((err) => err.message);
            return next(new AppError_1.AppError(errorMessages.join(", "), 400));
        }
        next(new AppError_1.AppError("Internal Server Error", 500));
    }
});
exports.registerWithCode = registerWithCode;
