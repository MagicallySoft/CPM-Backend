"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/product/productModel.ts
const mongoose_1 = __importStar(require("mongoose"));
const productSchema = new mongoose_1.Schema({
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Customer", required: true },
    adminId: { type: mongoose_1.Schema.Types.ObjectId, ref: "AdminUser", required: true },
    // Link to product details – separate, immutable product info
    productDetailId: { type: mongoose_1.Schema.Types.ObjectId, ref: "ProductDetail", required: true },
    purchaseDate: { type: Date, required: true },
    renewalDate: { type: Date },
    details: { type: String },
    autoUpdated: { type: Boolean, default: false },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId },
    renewalCancelled: { type: Boolean, default: false },
}, { timestamps: true });
// Compound index to optimize queries by admin, renewal date, and product detail
productSchema.index({ adminId: 1, renewalDate: 1, productDetailId: 1 });
const Product = mongoose_1.default.model("Product", productSchema);
exports.default = Product;
