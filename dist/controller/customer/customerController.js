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
exports.getRenewalReminderList = exports.deleteCustomer = exports.updateCustomer = exports.searchCustomer = exports.addCustomer = void 0;
const customerModel_1 = __importDefault(require("../../models/customer/customerModel"));
const encryption_1 = require("../../utils/encryption");
const responseHandler_1 = require("../../utils/responseHandler");
/**
 * Add a new customer.
 * The virtual field "data" triggers encryption and blind index calculation.
 */
const addCustomer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const customerData = req.body;
        if (!customerData) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Customer data is required.");
        }
        const newCustomer = new customerModel_1.default({
            adminId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id, // Assumes authentication middleware has set req.user
        });
        // Virtual setter encrypts the data and calculates blind indexes.
        newCustomer.data = customerData;
        yield newCustomer.save();
        return (0, responseHandler_1.sendSuccessResponse)(res, 201, "Customer added successfully", {
            customerId: newCustomer._id,
        });
    }
    catch (error) {
        console.error("Add Customer Error:", error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error", { error: error.message });
    }
});
exports.addCustomer = addCustomer;
/**
 * Search customers using blind indexes for exact-match queries.
 */
const searchCustomer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { companyName, mobileNumber, email, tallySerialNo } = req.query;
        const query = { adminId };
        if (companyName) {
            query.companyNameIndex = (0, encryption_1.computeBlindIndex)(String(companyName));
        }
        if (mobileNumber) {
            query.mobileNumberIndex = (0, encryption_1.computeBlindIndex)(String(mobileNumber));
        }
        if (email) {
            query.emailIndex = (0, encryption_1.computeBlindIndex)(String(email));
        }
        if (tallySerialNo) {
            query.tallySerialNoIndex = (0, encryption_1.computeBlindIndex)(String(tallySerialNo));
        }
        // Pagination parameters
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;
        const totalCount = yield customerModel_1.default.countDocuments(query);
        const customers = yield customerModel_1.default.find(query).skip(skip).limit(limit);
        if (customers.length === 0) {
            return (0, responseHandler_1.sendErrorResponse)(res, 404, "No customers found!");
        }
        // Decrypt each customer's data (via the virtual getter) for the response.
        const result = customers.map((cust) => {
            // Using the virtual getter, which decrypts the encryptedData.
            const decryptedData = cust.data;
            // Merge decrypted data with selected fields (you can exclude encrypted fields if desired)
            return Object.assign({ _id: cust._id, adminId: cust.adminId, nextRenewalDate: cust.nextRenewalDate }, decryptedData);
        });
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Customers found", {
            customers: result,
            pagination: {
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page,
                pageSize: limit,
            },
        });
    }
    catch (error) {
        console.error("Search Customer Error:", error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error", { error: error.message });
    }
});
exports.searchCustomer = searchCustomer;
/**
 * Update customer data.
 * Merges new data with existing decrypted data and re-encrypts.
 */
const updateCustomer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const customerId = req.params.id;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const newData = req.body;
        // Find the customer document by ID and ensure the admin owns it.
        const customer = yield customerModel_1.default.findOne({ _id: customerId, adminId });
        if (!customer) {
            return (0, responseHandler_1.sendErrorResponse)(res, 404, "Customer not found or unauthorized");
        }
        // Merge new data with the existing decrypted data.
        const currentData = customer.data;
        const updatedData = Object.assign(Object.assign({}, currentData), newData);
        customer.data = updatedData; // Triggers re-encryption and blind index recalculation
        yield customer.save();
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Customer updated successfully", customer);
    }
    catch (error) {
        console.error("Update Customer Error:", error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error", { error: error.message });
    }
});
exports.updateCustomer = updateCustomer;
/**
 * Delete a customer.
 */
const deleteCustomer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const customerId = req.params.id;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const customer = yield customerModel_1.default.findOneAndDelete({ _id: customerId, adminId });
        if (!customer) {
            return (0, responseHandler_1.sendErrorResponse)(res, 404, "Customer not found or unauthorized");
        }
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Customer deleted successfully");
    }
    catch (error) {
        console.error("Delete Customer Error:", error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error", { error: error.message });
    }
});
exports.deleteCustomer = deleteCustomer;
/**
 * Retrieve customers with upcoming renewal dates.
 */
const getRenewalReminderList = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { reminderType = "thisMonth", startDate, endDate } = req.query;
        let start, end;
        const today = new Date();
        switch (reminderType) {
            case "thisWeek":
                start = new Date(today);
                start.setDate(today.getDate() - today.getDay());
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                break;
            case "in15Days":
                start = new Date();
                end = new Date();
                end.setDate(start.getDate() + 15);
                break;
            case "nextMonth":
                start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
                break;
            case "custom":
                if (!startDate || !endDate) {
                    return (0, responseHandler_1.sendErrorResponse)(res, 400, "Start date and end date are required for custom range");
                }
                start = new Date(String(startDate));
                end = new Date(String(endDate));
                break;
            default: // "thisMonth"
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        }
        const query = { adminId, nextRenewalDate: { $gte: start, $lte: end } };
        // Use the Mongoose model so the virtual getter decrypts the data.
        const customers = yield customerModel_1.default.find(query);
        if (!customers || customers.length === 0) {
            return (0, responseHandler_1.sendErrorResponse)(res, 404, "No customers found for renewal reminder!");
        }
        // Decrypt each customer's data for the response.
        const result = customers.map((cust) => {
            const decryptedData = cust.data;
            return Object.assign({ _id: cust._id, adminId: cust.adminId, nextRenewalDate: cust.nextRenewalDate }, decryptedData);
        });
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Renewal reminders fetched successfully", { customers: result });
    }
    catch (error) {
        console.error("Error fetching renewal reminders:", error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error", { error: error.message });
    }
});
exports.getRenewalReminderList = getRenewalReminderList;
