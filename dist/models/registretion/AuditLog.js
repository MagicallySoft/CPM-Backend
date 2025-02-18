"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// models/AuditLog.ts
const mongoose_1 = require("mongoose");
const AuditLogSchema = new mongoose_1.Schema({
    action: { type: String, required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    userType: { type: String, enum: ["AdminUser", "StaffUser"], required: true },
    ipAddress: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now },
});
// 🔹 Automatically remove logs after 90 days
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
const AuditLog = (0, mongoose_1.model)("AuditLog", AuditLogSchema);
exports.default = AuditLog;
