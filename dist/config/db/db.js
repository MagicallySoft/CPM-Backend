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
