// utils/encryption.ts
import crypto from "crypto";

// You can set these keys via environment variables or a secure configuration file.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "12345678901234567890123456789012"; // 32 characters (32 bytes)
const HMAC_KEY = process.env.HMAC_KEY || "your-hmac-secret-key"; // Change as needed

const IV_LENGTH = 16; // AES block size

/**
 * Encrypts the given text using AES-256-GCM.
 * Returns a string containing the iv, auth tag, and encrypted text (all in hex).
 */
export function encryptData(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY, "utf8"), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  // Combine iv, auth tag and encrypted text with a delimiter
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts data produced by encryptData.
 */
export function decryptData(data: string): string {
  const parts = data.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid data format for decryption.");
  }
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encryptedText = parts[2];

  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY, "utf8"), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Computes a blind index for the given text using HMAC-SHA256.
 */
export function computeBlindIndex(text: string): string {
  return crypto
    .createHmac("sha256", HMAC_KEY)
    .update(text)
    .digest("hex");
}
