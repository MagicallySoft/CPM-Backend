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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/customer/customerModel.ts
const mongoose_1 = __importStar(require("mongoose"));
const customerSchema = new mongoose_1.Schema({
    adminId: { type: mongoose_1.Schema.Types.ObjectId, ref: "AdminUser", required: true },
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
        of: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    hasReference: { type: Boolean, default: false },
    referenceDetail: {
        referenceId: { type: mongoose_1.Schema.Types.ObjectId, ref: "StaffUser" },
        referenceName: { type: String },
        referenceContact: { type: String },
        remark: { type: String },
    },
}, { timestamps: true });
// Text index to boost full-text search performance
customerSchema.index({
    companyName: "text",
    contactPerson: "text",
    mobileNumber: "text",
    email: "text",
    tallySerialNo: "text",
}, { default_language: "english" });
// Index for filtering (and sharding if needed)
customerSchema.index({ adminId: 1 });
// Virtual populate: Link customer to its products (child documents)
customerSchema.virtual("products", {
    ref: "Product",
    localField: "_id",
    foreignField: "customerId",
});
// Instance method for bulk renewal updates
customerSchema.methods.updateRenewals = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const currentDate = new Date();
        const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59, 999);
        const Product = mongoose_1.default.model("Product");
        yield Product.updateMany({
            customerId: this._id,
            renewalDate: { $gte: startOfDay, $lte: endOfDay },
            renewalCancelled: false,
        }, [
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
        ]);
        return this.save();
    });
};
customerSchema.set("toJSON", { virtuals: true });
const Customer = mongoose_1.default.model("Customer", customerSchema);
exports.default = Customer;
