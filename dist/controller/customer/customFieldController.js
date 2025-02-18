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
exports.deleteCustomField = exports.updateCustomField = exports.getCustomFields = exports.addCustomField = void 0;
const customFieldModel_1 = __importDefault(require("../../models/customer/customFieldModel"));
const responseHandler_1 = require("../../utils/responseHandler");
const addCustomField = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { fieldName, fieldType, isRequired, options, isMultiSelect } = req.body;
        if (!fieldName || !fieldType) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Field name and type are required!");
        }
        const newCustomField = new customFieldModel_1.default({
            adminId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId, // Admin adding the custom field
            fieldName,
            fieldType,
            isRequired,
            options,
            isMultiSelect,
        });
        yield newCustomField.save();
        return (0, responseHandler_1.sendSuccessResponse)(res, 201, "Custom field added successfully", newCustomField);
    }
    catch (error) {
        console.error(error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
    }
});
exports.addCustomField = addCustomField;
const getCustomFields = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const customFields = yield customFieldModel_1.default.find({
            adminId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId,
        });
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Custom fields fetched successfully", customFields);
    }
    catch (error) {
        console.error(error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
    }
});
exports.getCustomFields = getCustomFields;
const updateCustomField = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params; // Get field ID from request params
    const { fieldName, fieldType, isRequired, options } = req.body;
    // console.log({ fieldName, fieldType, isRequired, options });
    try {
        // Validate options if fieldType is 'select'
        if (fieldType === "select" && (!options || !Array.isArray(options))) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Options are required for select fields.");
        }
        const updateData = { fieldName, fieldType, isRequired, options };
        // Include options only if fieldType is 'select'
        if (fieldType === "select") {
            updateData.options = options;
        }
        const updatedField = yield customFieldModel_1.default.findOneAndUpdate({ _id: id, adminId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId }, // Ensure only admin's fields are updated
        updateData, { new: true, runValidators: true });
        if (!updatedField) {
            return (0, responseHandler_1.sendErrorResponse)(res, 404, "Custom field not found or unauthorized.");
        }
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Custom field updated successfully", updatedField);
    }
    catch (error) {
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
    }
});
exports.updateCustomField = updateCustomField;
const deleteCustomField = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params; // Get field ID from request params
    // console.log("ID",id);
    try {
        const deletedField = yield customFieldModel_1.default.findOneAndDelete({
            _id: id,
            adminId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId, // Ensure admin can only delete their own fields
        });
        if (!deletedField) {
            return (0, responseHandler_1.sendErrorResponse)(res, 404, "Custom field not found or unauthorized");
        }
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Custom field deleted successfully");
    }
    catch (error) {
        console.error(error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
    }
});
exports.deleteCustomField = deleteCustomField;
