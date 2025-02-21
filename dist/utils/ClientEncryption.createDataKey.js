"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDataKey = createDataKey;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const { ClientEncryption } = require("mongodb-client-encryption/lib/client_encryption");
const mongoURI = "mongodb+srv://magicallysoft:wBACzhSdKs02aVG9@magicallysoft.gxlqx.mongodb.net/?retryWrites=true&w=majority&appName=magicallySoft";
const keyVaultNamespace = "encryption.__keyVault";
// Decode your local master key from the environment.
const localMasterKey = Buffer.from("66pnAP1mnstrxM3vebwCof1y7LccXhMKYPrVrXZa3EUWz9IxV04P/0GvXnDVnXFeVs7pLzi7yQnCUQGWI6By7B4gbX0GI3Okqvxg1vb/+wzPOb1NK9a4594HiiRSIufP", "base64");
if (localMasterKey.length !== 96) {
    throw new Error("LOCAL_MASTER_KEY_BASE64 must decode to exactly 96 bytes.");
}
const kmsProviders = {
    local: {
        key: localMasterKey,
    },
};
function createDataKey() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new mongodb_1.MongoClient(mongoURI);
        yield client.connect();
        const encryption = new ClientEncryption(client, {
            keyVaultNamespace,
            kmsProviders,
        });
        const keyId = yield encryption.createDataKey("local", {
            keyAltNames: ["myDataKey"],
        });
        console.log("Data Key ID (binary):", keyId);
        console.log("Data Key ID (hex):", keyId.toString("hex"));
        yield client.close();
    });
}
createDataKey().catch(console.error);
