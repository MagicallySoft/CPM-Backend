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
const mongoose_1 = __importStar(require("mongoose"));
const customerSchema = new mongoose_1.Schema({
    adminId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
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
    tallySerialNo: { type: String, required: true },
    prime: { type: Boolean, default: false },
    blacklisted: { type: Boolean, default: false },
    remark: { type: String },
    dynamicFields: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed,
        default: () => new Map() // Ensures it is always initialized
    },
}, { timestamps: true });
customerSchema.pre("save", function (next) {
    if (this.dynamicFields) {
        for (const [key, value] of this.dynamicFields.entries()) {
            if (typeof value === "undefined") {
                this.dynamicFields.set(key, false);
            }
        }
    }
    next();
});
const Customer = mongoose_1.default.model("Customer", customerSchema);
exports.default = Customer;
