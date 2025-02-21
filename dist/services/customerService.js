"use strict";
// // services/customerService.ts
// import Customer, { ICustomerData, ICustomer } from "../models/customer/customerModel";
// import { encryptData, decryptData } from "../utils/encryption";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptDeterministic = encryptDeterministic;
exports.decryptDeterministic = decryptDeterministic;
// /**
//  * Creates a new customer.
//  * The entire customer data is encrypted before saving.
//  */
// export async function createCustomer(adminId: string, data: ICustomerData): Promise<ICustomer> {
//   const plaintext = JSON.stringify(data);
//   const encrypted = await encryptData(plaintext); // returns a Binary (Buffer)
//   const customer = new Customer({
//     adminId,
//     encryptedData: encrypted
//   });
//   return customer.save();
// }
// /**
//  * Retrieves and decrypts the customer data.
//  */
// export async function getCustomer(customerId: string): Promise<ICustomerData | null> {
//   const customer = await Customer.findById(customerId);
//   if (!customer) return null;
//   const decryptedJson = await decryptData(customer.encryptedData);
//   return JSON.parse(decryptedJson);
// }
const crypto_1 = __importDefault(require("crypto"));
const algorithm = 'aes-256-cbc';
// Ensure your key is 32 bytes. In production, securely manage and rotate your key.
const key = Buffer.from(process.env.ENCRYPTION_KEY || 'defaultkeydefaultkeydefaultkey12', 'utf8');
// Fixed IV for deterministic encryption (not recommended for non-searchable data)
const deterministicIV = Buffer.alloc(16, 0);
function encryptDeterministic(plaintext) {
    const cipher = crypto_1.default.createCipheriv(algorithm, key, deterministicIV);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}
function decryptDeterministic(ciphertext) {
    const decipher = crypto_1.default.createDecipheriv(algorithm, key, deterministicIV);
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
