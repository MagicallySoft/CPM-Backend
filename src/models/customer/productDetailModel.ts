// src/models/product/productDetailModel.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IProductDetail extends Document {
  adminId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  description?: string;
  link?: string;
  category?: string;
  tags?: string[];
  specifications?: Map<string, any>;
}

const productDetailSchema: Schema<IProductDetail> = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    link: { type: String },
    category: { type: String },
    tags: { type: [String], index: true },
    specifications: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => new Map(),
    },
  },
  { timestamps: true }
);

// Create a full-text index for searching across name, description, and category.
productDetailSchema.index(
  { name: "text", description: "text", category: "text" },
  { default_language: "english" }
);

// Index price for fast filtering and sorting.
productDetailSchema.index({ price: 1 });

const ProductDetail =  mongoose.model<IProductDetail>("ProductDetail", productDetailSchema);
export default ProductDetail;
