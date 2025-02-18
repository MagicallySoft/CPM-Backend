"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
// Middleware to verify token
const verifyToken = (req, res, next) => {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!token) {
        res.status(401).json({ valid: false, message: "No token provided" });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ valid: false, message: "Invalid token" });
        }
        // Assuming decoded token contains IUser data, cast it as IUser
        req.user = decoded; // Ensure decoded is treated as IUser
        next();
    });
};
exports.verifyToken = verifyToken;
// Verify Token Endpoint
router.get("/verify-token", exports.verifyToken, (req, res) => {
    if (req.user) {
        res.json({ valid: true, user: req.user });
    }
    else {
        res
            .status(400)
            .json({ valid: false, message: "User data not available" });
    }
});
exports.default = router;
