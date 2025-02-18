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
const registretioncodeModel_1 = __importDefault(require("../../models/auth/registretioncodeModel"));
const responseHandler_1 = require("../../utils/responseHandler");
// Unified API for generating registration codes
const createRegistrationCode = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const { username, designation, expiryDate } = req.body;
        // console.log({ username, designation, expiryDate })
        // console.log("userId",userId)
        // console.log("userRole",userRole)
        let assignedToRole = null;
        // Super Admin can create Admin codes with expiry date
        if (userRole === "superadmin") {
            assignedToRole = "admin";
            if (!expiryDate) {
                return (0, responseHandler_1.sendErrorResponse)(res, 400, "Expiry date is required for admin code.");
            }
        }
        // Admin can create codes for Subadmin or Employee
        else if (userRole === "admin") {
            if (designation) {
                assignedToRole = "employee"; // If designation exists, it's for Employee
            }
            else {
                assignedToRole = "subadmin"; // Default is Subadmin if no designation
            }
        }
        else {
            return (0, responseHandler_1.sendErrorResponse)(res, 403, "Unauthorized to generate codes.");
        }
        // Ensure designation is provided for employees
        if (assignedToRole === "employee" && !designation) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Designation is required for employees.");
        }
        // Generate a unique registration code
        const code = Math.random().toString(36).substring(2, 15);
        // Create the registration code entry
        const registrationCode = new registretioncodeModel_1.default({
            username,
            code,
            createdBy: userId,
            assignedToRole,
            designation: assignedToRole === "employee" ? designation : undefined,
            expiresAt: assignedToRole === "admin" ? new Date(expiryDate) : undefined, // Only add expiry date for Admin codes
        });
        yield registrationCode.save();
        return (0, responseHandler_1.sendSuccessResponse)(res, 201, `${assignedToRole} registration code created successfully.`, { code, assignedToRole });
    }
    catch (error) {
        console.error("Error in Code:", error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal server error");
    }
});
exports.createRegistrationCode = createRegistrationCode;
