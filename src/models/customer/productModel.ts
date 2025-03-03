// src/models/product/productModel.ts
import mongoose, { Schema, Document } from "mongoose";
import { IProduct } from "../../utils/interfaces";

const renewalHistorySchema = new Schema(
  {
    renewalDate: { type: Date, required: true },
    autoRenewed: { type: Boolean, default: false },
    renewedBy: { type: Schema.Types.ObjectId },
    notes: { type: String },
  },
  { _id: false } 
);

const productSchema = new Schema<IProduct>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    adminId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    // Link to product details – separate, immutable product info
    productDetailId: { type: Schema.Types.ObjectId, ref: "ProductDetail", required: true },
    purchaseDate: { type: Date, required: true },
    renewalDate: { type: Date },
    details: { type: String },
    autoUpdated: { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId},
    renewalCancelled: { type: Boolean, default: false },
    renewalHistory: [renewalHistorySchema],
  },
  { timestamps: true }
);

// Compound index to optimize queries by admin, renewal date, and product detail
productSchema.index({ adminId: 1, renewalDate: 1, productDetailId: 1 });

const Product = mongoose.model<IProduct>("Product", productSchema);
export default Product;
