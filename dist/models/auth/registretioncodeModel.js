"use strict";
// // codeModel.ts
// import mongoose, { Schema, Document } from 'mongoose';
// import {ICode} from '../../utils/interfaces'
Object.defineProperty(exports, "__esModule", { value: true });
// const codeSchema: Schema<ICode> = new Schema(
//   {
//     code: { type: String, required: true, unique: true },
//     username: {type: String, required: true},
//     createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
//     assignedToRole: { type: String, enum: ["admin", "subadmin", "employee"], required: true },
//     expiresAt: { type: Date, required: false },
//     designation: { type: String, required: false },
//     used: { type: Boolean, default: false },
//   },
//   { timestamps: true }
// );
// const Code = mongoose.model<ICode>('Code', codeSchema);
// export default Code;
// codeModel.ts
const mongoose_1 = require("mongoose");
const CodeSchema = new mongoose_1.Schema({
    code: { type: String, required: true, unique: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedToRole: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Role' },
    company: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    usedAt: Date
});
// Auto-expire codes
CodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const Codee = (0, mongoose_1.model)('Codee', CodeSchema);
exports.default = Codee;
