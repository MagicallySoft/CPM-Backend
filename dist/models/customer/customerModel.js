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
// models/Customer.ts
const mongoose_1 = __importStar(require("mongoose"));
const encryption_1 = require("../../utils/encryption");
const CustomerSchema = new mongoose_1.Schema({
    adminId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    keyId: { type: mongoose_1.Schema.Types.ObjectId, required: false },
    encryptedData: { type: String, required: true },
    mobileNumberIndex: { type: String, required: true, index: true },
    contactPersonIndex: { type: String, required: true, index: true },
    companyNameIndex: { type: String, required: true, index: true },
    emailIndex: { type: String, required: true, index: true },
    tallySerialNoIndex: { type: String, required: true, index: true },
    nextRenewalDate: { type: Date, index: true },
}, { timestamps: true });
// Virtual field "data" handles encryption on set and decryption on get.
CustomerSchema.virtual("data")
    .get(function () {
    try {
        return JSON.parse((0, encryption_1.decryptData)(this.encryptedData));
    }
    catch (error) {
        console.error("Decryption error:", error);
        throw new Error("Failed to decrypt customer data.");
    }
})
    .set(function (value) {
    this.encryptedData = (0, encryption_1.encryptData)(JSON.stringify(value));
    this.mobileNumberIndex = (0, encryption_1.computeBlindIndex)(value.mobileNumber);
    this.contactPersonIndex = (0, encryption_1.computeBlindIndex)(value.contactPerson);
    this.companyNameIndex = (0, encryption_1.computeBlindIndex)(value.companyName);
    this.emailIndex = (0, encryption_1.computeBlindIndex)(value.email);
    this.tallySerialNoIndex = (0, encryption_1.computeBlindIndex)(value.tallySerialNo);
});
// Pre-save hook to recalc blind indexes and compute next renewal date
CustomerSchema.pre("save", function (next) {
    try {
        const data = JSON.parse((0, encryption_1.decryptData)(this.encryptedData));
        this.mobileNumberIndex = (0, encryption_1.computeBlindIndex)(data.mobileNumber);
        this.contactPersonIndex = (0, encryption_1.computeBlindIndex)(data.contactPerson);
        this.companyNameIndex = (0, encryption_1.computeBlindIndex)(data.companyName);
        this.emailIndex = (0, encryption_1.computeBlindIndex)(data.email);
        this.tallySerialNoIndex = (0, encryption_1.computeBlindIndex)(data.tallySerialNo);
        // If products have a renewalDate, set the nextRenewalDate for faster queries.
        if (data.products && Array.isArray(data.products)) {
            const renewalDates = data.products
                .filter((p) => p.renewalDate)
                .map((p) => new Date(p.renewalDate).getTime());
            if (renewalDates.length > 0) {
                this.nextRenewalDate = new Date(Math.min(...renewalDates));
            }
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
const Customer = mongoose_1.default.model("Customer", CustomerSchema);
exports.default = Customer;
