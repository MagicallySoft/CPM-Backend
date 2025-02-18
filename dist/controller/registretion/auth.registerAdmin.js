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
exports.registerAdmin = void 0;
const AdminUserModel_1 = __importDefault(require("../../models/registretion/AdminUserModel"));
const SubscriptionModel_1 = __importDefault(require("../../models/registretion/SubscriptionModel"));
const AuditLog_1 = __importDefault(require("../../models/registretion/AuditLog"));
const payment_1 = require("../../utils/payment"); // Your payment gateway integration
const responseHandler_1 = require("../../utils/responseHandler");
// Uncomment if you want to generate a JWT token later
// import jwt from "jsonwebtoken";
// const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const registerAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password, subscriptionPlan, paymentDetails } = req.body;
        // Validate required fields
        if (!username || !email || !password || !subscriptionPlan || !paymentDetails) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "All fields are required", {
                missingFields: {
                    username: !username,
                    email: !email,
                    password: !password,
                    subscriptionPlan: !subscriptionPlan,
                    paymentDetails: !paymentDetails,
                },
            });
        }
        // Additional validations (for example, validate email format or password strength) can be added here.
        // Check if the email already exists
        const existingAdmin = yield AdminUserModel_1.default.findOne({ email });
        if (existingAdmin) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Email is already registered");
        }
        // 1. Process Payment
        const paymentResult = yield (0, payment_1.processPayment)(paymentDetails, subscriptionPlan);
        if (!paymentResult.success) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Payment failed", paymentResult.error);
        }
        // 2. Calculate Subscription End Date Based on Plan
        const now = new Date();
        let endDate;
        if (subscriptionPlan === "monthly") {
            endDate = new Date(now);
            endDate.setMonth(endDate.getMonth() + 1);
        }
        else if (subscriptionPlan === "yearly") {
            endDate = new Date(now);
            endDate.setFullYear(endDate.getFullYear() + 1);
        }
        else {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid subscription plan");
        }
        // 3. Create AdminUser record (with Subscription field explicitly set to "active")
        const newAdmin = yield AdminUserModel_1.default.create({
            username,
            email,
            password,
            role: "admin",
            Subscription: "active", // Explicitly set subscription status to active
        });
        // 4. Create Subscription record for the admin
        const subscription = yield SubscriptionModel_1.default.create({
            adminId: newAdmin._id,
            plan: subscriptionPlan,
            startDate: now,
            endDate: endDate,
            status: "active", // Initially active; a scheduled job can later mark it as inactive/expired
            paymentInfo: paymentResult.transactionData,
        });
        // (Optional) Update AdminUser's Subscription field explicitly if needed
        newAdmin.Subscription = "active";
        yield newAdmin.save();
        // 5. Create Audit Log for registration
        yield AuditLog_1.default.create({
            action: "Admin Registration",
            userId: newAdmin._id,
            userType: "AdminUser",
            ipAddress: req.ip,
            userAgent: req.get("User-Agent") || "",
            timestamp: new Date(),
        });
        // 6. (Optional) Generate JWT token
        // const token = jwt.sign({ id: newAdmin._id, role: newAdmin.role }, JWT_SECRET, { expiresIn: "1h" });
        // const responseData = { token, newAdmin };
        // 7. Return success response
        return (0, responseHandler_1.sendSuccessResponse)(res, 201, "Registration successful", { newAdmin });
    }
    catch (error) {
        console.error("Register Admin Error: ", error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
});
exports.registerAdmin = registerAdmin;
