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
exports.createRegistrationCode = void 0;
const codeModel_1 = __importDefault(require("../../models/auth/codeModel"));
const responseHandler_1 = require("../../utils/responseHandler");
// Unified API for generating registration codes
const createRegistrationCode = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // Ensure req.user is set by your authentication middleware
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const { username, designation, expiryDate } = req.body;
        // Validate basic required fields
        if (!username) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Username is required.");
        }
        if (!userId || !userRole) {
            return (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized: Missing user credentials.");
        }
        let assignedToRole;
        // Only admins can generate codes for subadmin or employee
        if (userRole === "admin") {
            // If a designation is provided, treat the code as for an employee; otherwise, subadmin.
            assignedToRole = designation ? "employee" : "subadmin";
        }
        else {
            return (0, responseHandler_1.sendErrorResponse)(res, 403, "Only admins are authorized to generate registration codes.");
        }
        // For employee codes, ensure a designation is provided
        if (assignedToRole === "employee" && !designation) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Designation is required for employee registration codes.");
        }
        // Optionally validate and convert expiryDate if provided
        let expiresAt;
        if (expiryDate) {
            expiresAt = new Date(expiryDate);
            if (isNaN(expiresAt.getTime())) {
                return (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid expiry date.");
            }
        }
        // Generate a unique registration code. (For production, consider using a robust package or collision check.)
        const code = Math.random().toString(36).substring(2, 15);
        // Create the registration code entry
        const registrationCode = new codeModel_1.default({
            username,
            code,
            createdBy: userId,
            assignedToRole,
            designation: assignedToRole === "employee" ? designation : undefined,
            expiresAt: expiresAt,
        });
        yield registrationCode.save();
        return (0, responseHandler_1.sendSuccessResponse)(res, 201, `${assignedToRole} registration code created successfully.`, { code, assignedToRole });
    }
    catch (error) {
        console.error("Error generating registration code:", error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal server error", { error: error.message });
    }
});
exports.createRegistrationCode = createRegistrationCode;
