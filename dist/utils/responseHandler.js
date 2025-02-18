"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendErrorResponse = exports.sendSuccessResponse = void 0;
// Success Response
const sendSuccessResponse = (res, status, message, data = {}) => {
    return res.status(status).json({
        status,
        success: true,
        message,
        data,
    });
};
exports.sendSuccessResponse = sendSuccessResponse;
// Error Response
const sendErrorResponse = (res, status, message, errors = {}) => {
    return res.status(status).json({
        status,
        success: false,
        message,
        errors,
    });
};
exports.sendErrorResponse = sendErrorResponse;
