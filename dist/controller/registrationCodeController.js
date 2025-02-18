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
exports.createUserRegistrationCode = exports.createAdminRegistrationCode = void 0;
const registretioncodeModel_1 = __importDefault(require("../models/registretioncodeModel"));
const AppError_1 = require("../utils/AppError");
const responseHandler_1 = require("../utils/responseHandler");
const createAdminRegistrationCode = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const superAdminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { username } = req.body;
        // Ensure the user is a super admin
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== "superadmin") {
            return (0, responseHandler_1.sendErrorResponse)(res, 403, "Only super admins can generate admin registration codes.");
        }
        const code = Math.random().toString(36).substring(2, 15); // Generate a random code
        // Create a registration code for an admin
        const registrationCode = new registretioncodeModel_1.default({
            username,
            code,
            createdBy: superAdminId,
            role: "admin",
        });
        yield registrationCode.save();
        return (0, responseHandler_1.sendSuccessResponse)(res, 201, "Admin registration code created successfully.", { code });
    }
    catch (error) {
        next(new AppError_1.AppError("Internal Server Error", 500));
    }
});
exports.createAdminRegistrationCode = createAdminRegistrationCode;
const createUserRegistrationCode = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { username, designation } = req.body;
        console.log({ username, designation });
        // Ensure the user is an admin
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== "admin") {
            return (0, responseHandler_1.sendErrorResponse)(res, 403, "Only admins can generate user registration codes.");
        }
        if (!designation) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Designation is required.");
        }
        const code = Math.random().toString(36).substring(2, 15); // Generate a random code
        // Create a registration code for a user
        const registrationCode = new registretioncodeModel_1.default({
            username,
            code,
            createdBy: adminId,
            role: "user",
            designation
        });
        yield registrationCode.save();
        return (0, responseHandler_1.sendSuccessResponse)(res, 201, "User registration code created successfully.", { code });
    }
    catch (error) {
        next(new AppError_1.AppError("Internal Server Error", 500));
    }
});
exports.createUserRegistrationCode = createUserRegistrationCode;
