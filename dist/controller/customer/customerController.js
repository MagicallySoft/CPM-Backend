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
exports.importCustomers = exports.getRenewalReminderList = exports.deleteCustomer = exports.updateCustomer = exports.searchCustomer = exports.addCustomer = void 0;
const csvtojson_1 = __importDefault(require("csvtojson"));
const xlsx_1 = __importDefault(require("xlsx"));
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
/**
 * Import customers from CSV or Excel file.
 */
const importCustomers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;
        let customerRecords = [];
        // Determine file type based on the extension.
        if (fileName.endsWith(".csv")) {
            // Convert buffer to string and parse CSV.
            const csvString = fileBuffer.toString("utf-8");
            customerRecords = yield (0, csvtojson_1.default)().fromString(csvString);
        }
        else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            // Read Excel file and convert the first worksheet to JSON.
            const workbook = xlsx_1.default.read(fileBuffer, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            customerRecords = xlsx_1.default.utils.sheet_to_json(worksheet);
        }
        else {
            return res.status(400).json({ error: "Unsupported file format" });
        }
        // Map each record to the expected ICustomerData format.
        // Adjust field names if your CSV/Excel headers differ.
        const customersToInsert = customerRecords.map((record) => {
            var _a;
            const customerData = {
                companyName: record.companyName || record.CompanyName,
                contactPerson: record.contactPerson || record.ContactPerson,
                mobileNumber: record.mobileNumber || record.MobileNumber,
                email: record.email || record.Email,
                tallySerialNo: record.tallySerialNo || record.TallySerialNo,
                // Convert string values to booleans if needed.
                prime: record.prime === "true" || record.prime === true || false,
                blacklisted: record.blacklisted === "true" ||
                    record.blacklisted === true ||
                    false,
                remark: record.remark || record.Remark,
                // If there are any dynamic fields or products, you can add them here.
                // products: record.products ? JSON.parse(record.products) : undefined,
                // dynamicFields: record.dynamicFields ? JSON.parse(record.dynamicFields) : undefined,
            };
            return new customerModel_1.default({
                // Assuming you have the authenticated admin user in req.user.
                adminId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                data: customerData,
            });
        });
        // Bulk insert customers into the database.
        yield customerModel_1.default.insertMany(customersToInsert);
        res.json({
            message: `${customersToInsert.length} customers imported successfully`,
        });
    }
    catch (error) {
        console.error("Error importing customers:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.importCustomers = importCustomers;
