"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
// auditModel.ts
const mongoose_1 = require("mongoose");
const AuditLogSchema = new mongoose_1.Schema({
    action: { type: String, required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    ipAddress: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now }
});
// Automated Log Retention (90 days)
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
exports.AuditLog = (0, mongoose_1.model)('AuditLog', AuditLogSchema);
