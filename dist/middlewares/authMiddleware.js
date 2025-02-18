"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authenticateUser = void 0;
const jwtUtils_1 = require("../utils/jwtUtils");
const responseHandler_1 = require("../utils/responseHandler");
// Middleware to verify token
const authenticateUser = (req, res, next) => {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    if (!token) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, 'Access denied. No token provided.');
        return;
    }
    try {
        const decoded = (0, jwtUtils_1.verifyToken)(token);
        // console.log("Decoded Tokrn \n",decoded);
        if (typeof decoded !== "object" || !decoded.id || !decoded.role) {
            (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid token payload.");
            return;
        }
        req.user = {
            id: decoded.id,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        // Send a 401 status code indicating that the token is invalid or expired.
        (0, responseHandler_1.sendErrorResponse)(res, 401, 'Invalid or expired token. Please re-login.');
    }
};
exports.authenticateUser = authenticateUser;
// Middleware to check user roles
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            (0, responseHandler_1.sendErrorResponse)(res, 403, "User authentication required.");
            return;
        }
        if (!roles.includes(req.user.role)) {
            (0, responseHandler_1.sendErrorResponse)(res, 403, "You do not have permission to access this resource.");
            return;
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
