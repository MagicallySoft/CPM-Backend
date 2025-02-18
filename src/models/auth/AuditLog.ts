// models/AuditLog.ts
import { Schema, model } from "mongoose";
// import { IAuditLog } from "../../utils/interfaces"; // Your IAuditLog interface

export interface IAuditLog extends Document {
    action: string;
    userId: { type: Schema.Types.ObjectId, required: true },
    userType: string | "AdminUser" | "StaffUser";
    ipAddress: String,
    userAgent: String,
    timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  action: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, required: true },
  userType: { type: String, enum: ["AdminUser", "StaffUser"], required: true },
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now },
});

// 🔹 Automatically remove logs after 90 days
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

const AuditLog = model<IAuditLog>("AuditLog", AuditLogSchema);
export default AuditLog;
