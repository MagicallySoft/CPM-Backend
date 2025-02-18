"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.success = false;
        // Ensure the correct prototype chain is maintained
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
