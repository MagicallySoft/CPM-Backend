import { MongoClient, AutoEncryptionOptions } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const DB_URI = process.env.MONGO_URI;
const LOCAL_KEY = process.env.LOCAL_KEY;

if (!DB_URI) {
  throw new Error("❌ MONGO_URI is missing from .env file!");
}

if (!LOCAL_KEY) {
  throw new Error("❌ LOCAL_KEY is missing from .env file!");
}

const KEY_VAULT_NS = "encryption.__keyVault"; // MongoDB Key Vault Collection
const ENC_DB = "customerDB"; // Encrypted database name
const ENC_COLL = "customers"; // Collection name

const encryptionOptions: AutoEncryptionOptions = {
  keyVaultNamespace: KEY_VAULT_NS,
  kmsProviders: {
    local: {
      key: Buffer.from(LOCAL_KEY, "base64"),
    },
  },
  // Schema map defines field-level encryption (optional if you use your own encryption as above)
  schemaMap: {
    [`${ENC_DB}.${ENC_COLL}`]: {
      bsonType: "object",
      encryptMetadata: { keyId: "/keyId" },
      properties: {
        companyName: { encrypt: { bsonType: "string", algorithm: "Equality" } },
        contactPerson: { encrypt: { bsonType: "string", algorithm: "Equality" } },
        mobileNumber: { encrypt: { bsonType: "string", algorithm: "Equality" } },
        email: { encrypt: { bsonType: "string", algorithm: "Equality" } },
        tallySerialNo: { encrypt: { bsonType: "string", algorithm: "RangePreview" } },
      },
    },
  },
};

// const client = new MongoClient(DB_URI, { autoEncryption: encryptionOptions });
const client = new MongoClient(DB_URI);
export default client;
