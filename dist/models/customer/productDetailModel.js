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
// src/models/product/productDetailModel.ts
const mongoose_1 = __importStar(require("mongoose"));
const productDetailSchema = new mongoose_1.Schema({
    adminId: { type: mongoose_1.Schema.Types.ObjectId, ref: "AdminUser", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    link: { type: String },
    category: { type: String },
    tags: { type: [String], index: true },
    specifications: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed,
        default: () => new Map(),
    },
}, { timestamps: true });
// Create a full-text index for searching across name, description, and category.
productDetailSchema.index({ name: "text", description: "text", category: "text" }, { default_language: "english" });
// Index price for fast filtering and sorting.
productDetailSchema.index({ price: 1 });
const ProductDetail = mongoose_1.default.model("ProductDetail", productDetailSchema);
exports.default = ProductDetail;
