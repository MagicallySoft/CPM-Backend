"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const responseHandler_1 = require("../utils/responseHandler");
// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return (0, responseHandler_1.sendErrorResponse)(res, 403, "You are not authorized to add customer data");
    }
    next();
};
exports.isAdmin = isAdmin;
