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
exports.deleteCustomer = exports.updateCustomer = exports.searchCustomer = exports.addCustomer = void 0;
const customerModel_1 = __importDefault(require("../models/customerModel"));
const customFieldModel_1 = __importDefault(require("../models/customFieldModel"));
const responseHandler_1 = require("../utils/responseHandler");
const addCustomer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { companyName, contactPerson, mobileNumber, email, tallySerialNo, prime, blacklisted, remark, dynamicFields, // Dynamic fields to be added to the customer
         } = req.body;
        const sanitizedDynamicFields = dynamicFields && typeof dynamicFields === "object" ? dynamicFields : {};
        // Fetch the admin's custom fields
        const customFields = yield customFieldModel_1.default.find({
            adminId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId,
        });
        // Validate dynamic fields according to admin's custom fields
        const dynamicFieldKeys = Object.keys(dynamicFields);
        for (let key of dynamicFieldKeys) {
            const field = customFields.find((f) => f.fieldName === key);
            if (!field) {
                return (0, responseHandler_1.sendErrorResponse)(res, 400, `Field '${key}' is not a valid custom field for your admin.`);
            }
        }
        const newCustomer = new customerModel_1.default({
            companyName,
            contactPerson,
            mobileNumber,
            email,
            tallySerialNo,
            remark,
            prime,
            blacklisted,
            adminId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId, // Save the admin's ID who is creating the customer
            dynamicFields: sanitizedDynamicFields, // Store the dynamic fields
        });
        yield newCustomer.save();
        return (0, responseHandler_1.sendSuccessResponse)(res, 201, "Customer added successfully", newCustomer);
    }
    catch (error) {
        console.log(error);
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((err) => err.message);
            (0, responseHandler_1.sendErrorResponse)(res, 400, messages.join(", "));
        }
        // Handle duplicate key errors (code 11000)
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            (0, responseHandler_1.sendErrorResponse)(res, 400, `The ${field} '${error.keyValue[field]}' is already in use.`);
        }
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
    }
});
exports.addCustomer = addCustomer;
const searchCustomer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { companyName, mobileNumber, contactPerson, tallySerialNo } = req.query;
    const id = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "admin" ? (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId : (_c = req.user) === null || _c === void 0 ? void 0 : _c.adminId;
    const query = { adminId: id };
    if (companyName)
        query.companyName = { $regex: companyName, $options: "i" };
    if (tallySerialNo)
        query.tallySerialNo = { $regex: tallySerialNo, $options: "i" };
    if (mobileNumber)
        query.mobileNumber = { $regex: mobileNumber, $options: "i" };
    if (contactPerson)
        query.contactPerson = { $regex: contactPerson, $options: "i" };
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Fetch total count for pagination metadata
        const totalCount = yield customerModel_1.default.countDocuments(query);
        // Fetch paginated customers
        const customers = yield customerModel_1.default.find(query).skip(skip).limit(limit);
        if (customers.length === 0) {
            return (0, responseHandler_1.sendErrorResponse)(res, 404, "No customers found!");
        }
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Customers found", {
            customers,
            pagination: {
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page,
                pageSize: limit,
            },
        });
    }
    catch (error) {
        console.error(error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
    }
});
exports.searchCustomer = searchCustomer;
const updateCustomer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params; // Get customer ID from route parameter
    const updates = req.body; // Get the fields to be updated from the request body
    const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // The logged-in admin's ID
    // Check if the user is an admin
    if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== "admin") {
        res.status(403).json({ message: "Only admins can update customer data" });
    }
    try {
        // Find the customer by ID and check if it belongs to the current admin
        const customer = yield customerModel_1.default.findOne({ _id: id, adminId: adminId });
        if (!customer) {
            res
                .status(404)
                .json({ message: "Customer not found or not authorized to update" });
        }
        // Update the customer fields
        Object.assign(customer, updates);
        yield customer.save();
        // Send the updated customer data in response
        res.status(200).json({
            success: true,
            message: "Customer updated successfully",
            customer,
        });
    }
    catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((err) => err.message);
            (0, responseHandler_1.sendErrorResponse)(res, 400, messages.join(", "));
        }
        // Handle duplicate key errors (code 11000)
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            (0, responseHandler_1.sendErrorResponse)(res, 400, `The ${field} '${error.keyValue[field]}' is already in use.`);
        }
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
        // Pass errors to the error handler middleware
    }
});
exports.updateCustomer = updateCustomer;
const deleteCustomer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params; // Get customer ID from route parameter
    const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // The logged-in admin's ID
    // Check if the user is an admin
    if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== "admin") {
        res.status(403).json({ message: "Only admins can delete customer data" });
    }
    try {
        // Find the customer by ID and check if it belongs to the current admin
        const customer = yield customerModel_1.default.findOneAndDelete({
            _id: id,
            adminId: adminId,
        });
        if (!customer) {
            res
                .status(404)
                .json({ message: "Customer not found or not authorized to delete" });
        }
        // Send success message
        res.status(200).json({
            success: true,
            message: "Customer deleted successfully",
        });
    }
    catch (error) {
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error");
    }
});
exports.deleteCustomer = deleteCustomer;
