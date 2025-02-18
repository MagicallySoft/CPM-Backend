"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Company = void 0;
// companyModel.ts
const mongoose_1 = require("mongoose");
const CompanySchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    subscriptionEnd: { type: Date, required: true },
    encryptionKey: { type: String, required: true, select: false },
    storageQuota: { type: Number, default: 1073741824 }, // 1GB default
    customFields: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'CustomField' }]
}, { timestamps: true });
exports.Company = (0, mongoose_1.model)('Company', CompanySchema);
