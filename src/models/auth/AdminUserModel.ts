// models/auth/AdminUserModel.ts
import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IAdminUser extends Document {
  username: string;
  email: string;
  password: string;
  role: "superadmin" | "admin";
  Subscription?: "active" | "expired" | "cancelled";
  lastLogin?: Date;
  mfaSecret?: string;
  loginAttempts: number;
  lockUntil?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["superadmin", "admin"],
      required: true,
    },
    Subscription: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    lastLogin: { type: Date, default: null },
    mfaSecret: { type: String, default: null },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null, index: true },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

// 🔹 Hash password before saving
AdminUserSchema.pre<IAdminUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔹 Method to track login attempts & lock account if necessary
AdminUserSchema.methods.incrementLoginAttempts = async function () {
  const updates: {
    $inc: { loginAttempts: number };
    $set?: { lockUntil: Date };
  } = {
    $inc: { loginAttempts: 1 },
  };

  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: new Date(Date.now() + 15 * 60 * 1000) };
  }
  return this.updateOne(updates);
};

const AdminUser = mongoose.model<IAdminUser>("AdminUser", AdminUserSchema);
export default AdminUser;
