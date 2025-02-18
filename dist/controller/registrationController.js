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
const userModel_1 = __importDefault(require("../models/userModel"));
const employeeModel_1 = __importDefault(require("../models/employeeModel"));
const registretioncodeModel_1 = __importDefault(require("../models/registretioncodeModel"));
const AppError_1 = require("../utils/AppError");
const responseHandler_1 = require("../utils/responseHandler");
const registerWithCode = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password, registrationCode } = req.body;
    if (!username) {
        return (0, responseHandler_1.sendErrorResponse)(res, 400, "User Name is required!");
    }
    if (!registrationCode) {
        return (0, responseHandler_1.sendErrorResponse)(res, 400, "Registration code is required!");
    }
    try {
        const code = yield registretioncodeModel_1.default.findOne({ code: registrationCode });
        if (!code) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid or expired registration code.");
        }
        // if (code.used) {
        //   return sendErrorResponse(res, 400, "This registration code has already been used.");
        // }
        // Fetch the role of the user who created this code
        const creator = yield userModel_1.default.findById(code.createdBy);
        if (!creator) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid creator of this registration code.");
        }
        let newUser;
        if (creator.role === "admin") {
            const existingEmployee = yield employeeModel_1.default.findOne({ email });
            if (existingEmployee) {
                return (0, responseHandler_1.sendErrorResponse)(res, 400, "User with this email already exists.");
            }
            // Save as an Employee and assign designation
            newUser = new employeeModel_1.default({
                username,
                email,
                password,
                designation: code.designation || "Employee", // Assign designation dynamically
                role: code.role,
                adminId: code.createdBy,
                registrationCode: code.code,
            });
        }
        else if (creator.role === "superadmin") {
            const existingUser = yield userModel_1.default.findOne({ email });
            if (existingUser) {
                return (0, responseHandler_1.sendErrorResponse)(res, 400, "User with this email already exists.");
            }
            // Save as a User
            newUser = new userModel_1.default({
                username,
                email,
                password,
                role: code.role,
                adminId: code.createdBy,
                registrationCode: code.code,
            });
        }
        else {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid role in registration code.");
        }
        yield newUser.save();
        // Mark the code as used
        code.used = true;
        yield code.save();
        return (0, responseHandler_1.sendSuccessResponse)(res, 201, "User registered successfully!", {
            username,
            email,
            role: newUser.role,
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
