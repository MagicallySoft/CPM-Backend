// src/models/customer/customerModel.ts
import mongoose, { Schema, Document } from "mongoose";
import { ICustomer } from "../../utils/interfaces";

const customerSchema = new Schema<ICustomer>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
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
      required: true,
      unique: true,
      match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    },
    tallySerialNo: {
      type: String,
      required: true,
      match: [/^[0-9]{9}$/, "Tally Serial No. must be 9 digits"],
    },
    prime: { type: Boolean, default: false },
    blacklisted: { type: Boolean, default: false },
    remark: { type: String },
    dynamicFields: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    hasReference: {type: Boolean, default: false},
    referenceDetail: {
      referenceId: { type: Schema.Types.ObjectId, ref: "StaffUser" },
      referenceName: { type: String },
      referenceContact: { type: String },
      remark: { type: String },
    },
  },
  { timestamps: true }
);

// Text index to boost full-text search performance
customerSchema.index(
  {
    companyName: "text",
    contactPerson: "text",
    mobileNumber: "text",
    email: "text",
    tallySerialNo: "text",
  },
  { default_language: "english" }
);

// Index for filtering (and sharding if needed)
customerSchema.index({ adminId: 1 });

// Virtual populate: Link customer to its products (child documents)
customerSchema.virtual("products", {
  ref: "Product",
  localField: "_id",
  foreignField: "customerId",
});

// Instance method for bulk renewal updates
customerSchema.methods.updateRenewals = async function () {
  const currentDate = new Date();
  const startOfDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  );
  const endOfDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
    23,
    59,
    59,
    999
  );

  const Product = mongoose.model("Product");
  await Product.updateMany(
    {
      customerId: this._id,
      renewalDate: { $gte: startOfDay, $lte: endOfDay },
      renewalCancelled: false,
    },
    [
      {
        $set: {
          purchaseDate: "$renewalDate",
          autoUpdated: true,
          // Example logic: push the renewal date forward by the interval between purchase and renewal dates.
          renewalDate: {
            $add: ["$renewalDate", { $subtract: ["$renewalDate", "$purchaseDate"] }],
          },
        },
      },
    ]
  );
  return this.save();
};

customerSchema.set("toJSON", { virtuals: true });

const Customer = mongoose.model<ICustomer>("Customer", customerSchema);
export default Customer;
