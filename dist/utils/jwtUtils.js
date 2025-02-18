"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Generate JWT token
const generateToken = (userId, role, adminId = null) => {
    // You can adjust the payload based on your requirements
    const payload = {
        id: userId,
        role: role,
    };
    // If adminId is provided, add it to the payload
    if (adminId) {
        payload.adminId = adminId;
    }
    const secretKey = process.env.JWT_SECRET_KEY || "CPM@shivansh@123"; // JWT secret key
    // Generate the token with 1-hour expiration
    const token = jsonwebtoken_1.default.sign(payload, secretKey, { expiresIn: "12h" });
    return token;
};
exports.generateToken = generateToken;
// Verify JWT token
const verifyToken = (token) => {
    const secretKey = process.env.JWT_SECRET_KEY || "your-secret-key";
    return jsonwebtoken_1.default.verify(token, secretKey);
};
exports.verifyToken = verifyToken;
