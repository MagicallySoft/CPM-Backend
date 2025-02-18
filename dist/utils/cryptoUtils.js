"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeBlindIndex = computeBlindIndex;
const crypto_1 = __importDefault(require("crypto"));
const BLIND_INDEX_SECRET = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
function computeBlindIndex(value) {
    // Normalize input: trim and lower-case it
    const normalized = value.trim().toLowerCase();
    return crypto_1.default.createHmac("sha256", BLIND_INDEX_SECRET).update(normalized).digest("hex");
}
