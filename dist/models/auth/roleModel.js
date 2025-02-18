"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
// roleModel.ts
const mongoose_1 = require("mongoose");
const RoleSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    permissions: [{ type: String, enum: [
                'customer:create',
                'customer:update',
                'customer:delete',
                'task:create',
                'task:assign',
                'report:generate'
            ] }],
    company: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
    isDefault: { type: Boolean, default: false }
});
exports.Role = (0, mongoose_1.model)('Role', RoleSchema);
