import mongoose, { Schema, Document } from "mongoose";

interface IAdminCustomField extends Document {
  adminId: mongoose.Types.ObjectId;
  fieldName: string;
  fieldType: string;  
  isRequired: boolean;
  options: string[];
  isMultiSelect: boolean;
}

const adminCustomFieldSchema: Schema<IAdminCustomField> = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fieldName: { type: String, required: true },
    fieldType: { type: String, required: true },
    isRequired: { type: Boolean, default: false },
    options: { type: [String], default: [] }, // Store dropdown options
    isMultiSelect: { type: Boolean, default: false }, // Multi-select flag
  },
  { timestamps: true }
);

const AdminCustomField = mongoose.model<IAdminCustomField>("AdminCustomField", adminCustomFieldSchema);

export default AdminCustomField;
