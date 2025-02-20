// models/auth/StaffUserModel.ts
import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IStaffUser extends Document {
  username: string;
  email: string;
  password: string;
  // Embedded role information with permissions.
  role: {
    type: "subadmin" | "employee";  // This defines the user type.
    designation: string; // For example, "Sales Manager" or "Support Staff"
    permissions: {
      canAddCustomer: boolean;
      canUpdateCustomer: boolean;
      canDeleteCustomer: boolean;
      canPartialUpdateCustomer: boolean;
      // Add additional permissions as needed.
    };
  };
  adminId: mongoose.Types.ObjectId; // Reference to the parent admin.
  registrationCode?: string;
  lastLogin?: Date;
  IsLogin?: boolean;
  mfaSecret?: string;
  loginAttempts: number;
  lockUntil?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StaffUserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: {
        type: String,
        enum: ["subadmin", "employee"],
        required: true,
      },
      designation: { type: String, default: null },
      permissions: {
        canAddCustomer: { type: Boolean, default: false },
        canUpdateCustomer: { type: Boolean, default: false },
        canDeleteCustomer: { type: Boolean, default: false },
        canPartialUpdateCustomer: { type: Boolean, default: false },
      },
    },
    adminId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    registrationCode: { type: String, default: null },
    lastLogin: { type: Date, default: null },
    IsLogin: { type: Boolean, default: false },
    mfaSecret: { type: String, default: null },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null, index: true },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

// 🔹 Hash password before saving.
StaffUserSchema.pre<IStaffUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔹 Method to track login attempts & lock account if necessary.
StaffUserSchema.methods.incrementLoginAttempts = async function () {
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

const StaffUser = mongoose.model<IStaffUser>(
  "StaffUser",
  StaffUserSchema
);
export default StaffUser;
