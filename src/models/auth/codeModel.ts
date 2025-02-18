// models/auth/codeModel.ts
import mongoose, { Schema, Document } from "mongoose";
import { ICode } from "../../utils/interfaces"; // Your ICode interface

const codeSchema: Schema<ICode> = new Schema(
  {
    code: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    assignedToRole: {
      type: String,
      enum: ["subadmin", "employee"],
      required: true,
    },
    expiresAt: { type: Date },
    designation: { type: String },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Code = mongoose.model<ICode>("Code", codeSchema);
export default Code;
