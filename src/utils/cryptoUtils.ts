import crypto from "crypto";

const BLIND_INDEX_SECRET = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"

export function computeBlindIndex(value: string): string {
    // Normalize input: trim and lower-case it
    const normalized = value.trim().toLowerCase();
    return crypto.createHmac("sha256", BLIND_INDEX_SECRET).update(normalized).digest("hex");
  }
  