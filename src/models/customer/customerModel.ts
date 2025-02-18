import mongoose, { Schema, Document } from "mongoose";
import { IProduct, ICustomer } from "../../utils/interfaces";

const productSchema = new Schema<IProduct>(
  {
    productName: { type: String, required: true },
    purchaseDate: { type: Date, required: true },
    renewalDate: { type: Date },
    details: { type: String },
    reference: { type: Boolean, default: false },
    referenceDetail: {
      referenceId: { type: Schema.Types.ObjectId, ref: "User", required: false },
      referenceName: { type: String, required: false },
      referenceContact: { type: String, required: false },
      remark: { type: String, required: false },
    },
  },
  { _id: false }
);

const customerSchema: Schema<ICustomer> = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      match: /^[0-9]{10}$/,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email address",
      ],
    },
    tallySerialNo: { type: String, required: true, match:[/^[0-9]{9}$/,"Tally Serial No. is must be 9 digit"], },
    prime: { type: Boolean, default: false },
    blacklisted: { type: Boolean, default: false },
    remark: { type: String },
    products: { type: [productSchema], default: [] },
    dynamicFields: { 
      type: Map, 
      of: Schema.Types.Mixed, 
      default: () => new Map(), // Ensures it is always initialized
    },
  },
  { timestamps: true }
);

// Compound index for product searches
customerSchema.index({ "products.renewalDate": 1, "products.productName": 1, "products.referenceDetail.referenceId": 1 }); 

// Full-text search support
customerSchema.index({
  companyName: "text",
  contactPerson: "text",
  mobileNumber: "text",
  email: "text",
}, { default_language: "english" });

// Index for dynamic fields if needed
customerSchema.index({ "dynamicFields.someField": 1 });



const Customer = mongoose.model<ICustomer>("Customer", customerSchema);
export default Customer;
