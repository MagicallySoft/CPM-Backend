"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/CPM';
mongoose_1.default.connect(mongoURI)
    .then(() => {
    console.log('Database connected successfully!');
})
    .catch((err) => {
    console.error(`Database connection error: ${err.message}`);
    process.exit(1);
});
// Handle connection events
const db = mongoose_1.default.connection;
// Connection success
db.on('connected', () => {
    console.log('Mongoose connection established.');
});
// Handle connection errors
db.on('error', (err) => {
    console.error(`Mongoose connection error: ${err.message}`);
});
// Handle connection disconnection
db.on('disconnected', () => {
    console.log('Mongoose connection disconnected.');
});
exports.default = db;
// // config/db/db.ts
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// dotenv.config();
// const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/CPM-test';
// // Even though we supply autoEncryption options, we disable automatic encryption.
// mongoose.connect(mongoURI, {
//   autoEncryption: {
//     keyVaultNamespace: 'encryption.__keyVault',
//     kmsProviders: { 
//       local: { 
//         key: Buffer.from(process.env.LOCAL_MASTER_KEY_BASE64!, 'base64') 
//       } 
//     },
//     bypassAutoEncryption: true
//   }
// })
//   .then(() => {
//     console.log('Database connected successfully!');
//   })
//   .catch((err: Error) => {
//     console.error(`Database connection error: ${err.message}`);
//     process.exit(1); 
//   });
// // Handle connection events
// const db = mongoose.connection;
// db.on('connected', () => {
//   console.log('Mongoose connection established.');
// });
// db.on('error', (err: Error) => {
//   console.error(`Mongoose connection error: ${err.message}`);
// });
// db.on('disconnected', () => {
//   console.log('Mongoose connection disconnected.');
// });
// export default db;
