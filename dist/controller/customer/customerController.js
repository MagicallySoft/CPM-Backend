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
exports.importCustomers = exports.getProductRenewals = exports.deleteCustomer = exports.updateCustomer = exports.searchCustomer = exports.addCustomer = exports.listProductDetails = exports.addProductDetail = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const csvtojson_1 = __importDefault(require("csvtojson"));
const xlsx_1 = __importDefault(require("xlsx"));
const customerModel_1 = __importDefault(require("../../models/customer/customerModel"));
const productModel_1 = __importDefault(require("../../models/customer/productModel"));
const responseHandler_1 = require("../../utils/responseHandler");
const productDetailModel_1 = __importDefault(require("../../models/customer/productDetailModel"));
const addProductDetail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Check if the request is made by an authenticated admin.
        // This assumes an authentication middleware that sets req.user.
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminId) {
            return (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized: Admin access required.");
        }
        // Extract required fields from request body.
        const { name, price, description, link, category, tags, specifications } = req.body;
        // Basic validation: name and price are required.
        if (!name || price === undefined) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Name and price are required.");
        }
        // Create a new product detail document.
        const newProductDetail = new productDetailModel_1.default({
            adminId,
            name,
            price,
            description,
            link,
            category,
            tags,
            specifications,
        });
        // Save the document to the database.
        const savedProductDetail = yield newProductDetail.save();
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "saved Product Detail", savedProductDetail);
    }
    catch (error) {
        console.error("Error adding product detail:", error);
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyValue)[0];
            const duplicateValue = error.keyValue[duplicateField];
            return (0, responseHandler_1.sendErrorResponse)(res, 400, `${duplicateField} "${duplicateValue}" already exists.`);
        }
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error", {
            error: error.message,
        });
    }
});
exports.addProductDetail = addProductDetail;
const listProductDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Verify that the request is made by an authenticated admin.
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminId) {
            return (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized: Admin access required.");
        }
        // Extract the optional search query parameter.
        const search = req.query.search;
        // Build the filter: Only include records for the authenticated admin.
        const filter = { adminId };
        // If a search query is provided, apply a text search.
        if (search) {
            filter.$text = { $search: search };
        }
        // Retrieve matching ProductDetail records, sorted by creation date (newest first).
        const productDetails = yield productDetailModel_1.default.find(filter)
            .sort({ createdAt: -1 })
            .exec();
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Product details fetched successfully", productDetails);
    }
    catch (error) {
        console.error("Error listing product details:", error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error", { error: error.message });
    }
});
exports.listProductDetails = listProductDetails;
/**
 * Add a new customer.
* */
const addCustomer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Ensure the request is made by an authenticated admin.
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminId) {
            return (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized: Admin access required.");
        }
        // Extract customer fields and the products array from the request body.
        const { companyName, contactPerson, mobileNumber, email, tallySerialNo, prime, blacklisted, remark, dynamicFields, hasReference, referenceDetail, products, // products should be an array of product objects
         } = req.body;
        // Validate required customer fields.
        if (!companyName ||
            !contactPerson ||
            !mobileNumber ||
            !email ||
            !tallySerialNo) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Missing required customer fields.");
        }
        // console.log(hasReference)
        // console.log(referenceDetail)
        // Validate referenceDetail if provided: must have either referenceId or both referenceName and referenceContact.
        if (hasReference && referenceDetail) {
            const { referenceId, referenceName, referenceContact } = referenceDetail;
            if (!referenceId && (!referenceName || !referenceContact)) {
                return (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid referenceDetail: provide either referenceId or both referenceName and referenceContact.");
            }
        }
        // Create the customer document with adminId attached.
        const newCustomer = new customerModel_1.default({
            adminId,
            companyName,
            contactPerson,
            mobileNumber,
            email,
            tallySerialNo,
            prime: prime || false,
            blacklisted: blacklisted || false,
            remark,
            dynamicFields,
            hasReference,
            referenceDetail,
        });
        const savedCustomer = yield newCustomer.save();
        let savedProducts = [];
        if (Array.isArray(products) && products.length > 0) {
            // Map each product to a new Product document.
            const productDocs = products.map((product) => {
                // Validate that each product has a productDetailId.
                if (!product.productDetailId) {
                    throw new Error("Each product must have a productDetailId.");
                }
                return new productModel_1.default({
                    customerId: savedCustomer._id,
                    adminId, // use admin id from the authenticated user
                    productDetailId: product.productDetailId,
                    purchaseDate: product.purchaseDate
                        ? new Date(product.purchaseDate)
                        : new Date(),
                    renewalDate: product.renewalDate
                        ? new Date(product.renewalDate)
                        : undefined,
                    details: product.details,
                    autoUpdated: product.autoUpdated || false,
                    updatedBy: product.updatedBy,
                    renewalCancelled: product.renewalCancelled || false,
                });
            });
            // Save all product documents concurrently.
            savedProducts = yield Promise.all(productDocs.map((doc) => doc.save()));
        }
        // Populate all related fields in the saved customer document.
        const populatedCustomer = yield customerModel_1.default.findById(savedCustomer._id)
            .populate("products") // virtual populate of related products
            .populate("adminId") // if you wish to see details of the admin
            .populate({
            path: "referenceDetail.referenceId", // populate staff user if referenceId exists
            model: "StaffUser",
        });
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Customer Added", populatedCustomer);
    }
    catch (error) {
        console.error("Error adding customer and products:", error);
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyValue)[0];
            const duplicateValue = error.keyValue[duplicateField];
            return (0, responseHandler_1.sendErrorResponse)(res, 400, `${duplicateField} "${duplicateValue}" already exists.`);
        }
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error", {
            error: error.message,
        });
    }
});
exports.addCustomer = addCustomer;
/**
 * List customers in full detail (with products and reference info).
 * - Only customers created by the authenticated admin are returned.
 * - Supports text search (companyName, tallySerialNo, contactPerson, mobileNumber),
 *   filtering by reference and product, and pagination.
 * - Populates products (and nested product details), reference details, and admin info.
 */
const searchCustomer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Ensure request is made by an authenticated admin.
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminId) {
            return (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized: Admin access required");
        }
        // Extract query parameters.
        const search = req.query.search; // For text search
        const referenceFilter = req.query.reference; // Filter by reference name/contact
        const productFilter = req.query.product; // Filter by productDetailId (assumed)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // console.log(page)
        // console.log(limit)
        // Build the query filter for Customer.
        const filter = { adminId };
        // Apply text search on fields with a text index.
        if (search) {
            // NOTE: For ElasticSearch integration, replace this with your ES client call.
            filter.$text = { $search: search };
        }
        // console.log(filter);
        // Apply reference filtering on referenceDetail fields.
        if (referenceFilter) {
            filter.$or = [
                {
                    "referenceDetail.referenceName": {
                        $regex: referenceFilter,
                        $options: "i",
                    },
                },
                {
                    "referenceDetail.referenceContact": {
                        $regex: referenceFilter,
                        $options: "i",
                    },
                },
            ];
        }
        // Apply product filtering.
        // Here we assume `productFilter` is a productDetailId to filter customers having a product with that productDetailId.
        if (productFilter) {
            // Find products that match the given productDetailId.
            const matchingProducts = yield productModel_1.default.find({
                productDetailId: productFilter,
                adminId: adminId,
            }).select("customerId");
            // Map to array of customer IDs.
            const customerIds = matchingProducts.map((product) => product.customerId);
            // Apply filter to return only those customers.
            filter._id = { $in: customerIds };
        }
        // Get total count for pagination.
        const total = yield customerModel_1.default.countDocuments(filter);
        // Fetch customers with population of virtual products, nested product details,
        // reference details, and admin info.
        const customers = yield customerModel_1.default.find(filter)
            .populate({
            path: "products",
            populate: {
                path: "productDetailId",
                model: "ProductDetail",
            },
        })
            .populate({
            path: "referenceDetail.referenceId",
            model: "StaffUser",
        })
            .populate("adminId")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Customers fetched successfully", {
            customers,
            total,
            page,
            limit,
        });
    }
    catch (error) {
        console.error("Error fetching customers:", error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal server error", error);
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
        // // Find the customer document by ID and ensure the admin owns it.
        // const customer = await Customer.findOne({ _id: customerId, adminId });
        // if (!customer) {
        //   return sendErrorResponse(res, 404, "Customer not found or unauthorized");
        // }
        // // Merge new data with the existing decrypted data.
        // const currentData = customer.data;
        // const updatedData = { ...currentData, ...newData };
        // customer.data = updatedData; // Triggers re-encryption and blind index recalculation
        // await customer.save();
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Customer updated successfully"
        // customer
        );
    }
    catch (error) {
        console.error("Update Customer Error:", error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal Server Error", {
            error: error.message,
        });
    }
});
exports.updateCustomer = updateCustomer;
/**
 * Delete a customer.
 */
const deleteCustomer = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Ensure the request is made by an authenticated admin.
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminId) {
            return (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized: Admin access required");
        }
        // Extract customerId from the route parameters.
        const { id } = req.params;
        const customerId = id;
        // console.log( req.params)
        // console.log(customerId)
        //
        if (!customerId) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Customer id is required");
        }
        // Find the customer ensuring they belong to the admin.
        const customer = yield customerModel_1.default.findOne({ _id: customerId, adminId });
        if (!customer) {
            return (0, responseHandler_1.sendErrorResponse)(res, 404, "Customer not found or unauthorized");
        }
        // Delete all products associated with this customer.
        yield productModel_1.default.deleteMany({ customerId });
        // Delete the customer document.
        yield customerModel_1.default.deleteOne({ _id: customerId });
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Customer and associated products deleted successfully");
    }
    catch (error) {
        console.error("Error deleting customer and products:", error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal server error", error);
    }
});
exports.deleteCustomer = deleteCustomer;
/**
 * Retrieve customers with upcoming renewal dates.
 */
const getProductRenewals = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Validate admin access
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminId) {
            return (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized: Admin access required");
        }
        // Parse query parameters
        const period = req.query.period || "thisWeek"; // e.g. "thisWeek", "in15Days", "thisMonth", "nextMonth", "custom"
        const customStart = req.query.start;
        const customEnd = req.query.end;
        const productFilter = req.query.product; // filter by productDetailId
        const referenceFilter = req.query.reference; // filter by customer's reference (name or contact)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Determine the date range based on the requested period
        let startDate, endDate;
        const now = new Date();
        switch (period) {
            case "thisWeek": {
                // Assuming week starts on Sunday
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay());
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            }
            case "in15Days": {
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setDate(now.getDate() + 15);
                endDate.setHours(23, 59, 59, 999);
                break;
            }
            case "thisMonth": {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            }
            case "nextMonth": {
                startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            }
            case "custom": {
                if (!customStart || !customEnd) {
                    return (0, responseHandler_1.sendErrorResponse)(res, 400, "Custom period requires start and end dates");
                }
                startDate = new Date(customStart);
                endDate = new Date(customEnd);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            }
            default: {
                // Default to "thisWeek"
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay());
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            }
        }
        // Build the filter for product renewals.
        const productFilterQuery = {
            adminId,
            renewalDate: { $gte: startDate, $lte: endDate },
            renewalCancelled: false,
        };
        // If filtering by product, add productDetailId to the query.
        if (productFilter) {
            productFilterQuery.productDetailId = productFilter;
        }
        // If filtering by reference, find matching customer IDs first.
        if (referenceFilter) {
            let customerQuery;
            if (mongoose_1.default.Types.ObjectId.isValid(referenceFilter)) {
                // Treat as a referenceId
                customerQuery = { adminId, "referenceDetail.referenceId": referenceFilter };
            }
            else {
                // Treat as a reference name or contact
                customerQuery = {
                    adminId,
                    $or: [
                        { "referenceDetail.referenceName": { $regex: referenceFilter, $options: "i" } },
                        { "referenceDetail.referenceContact": { $regex: referenceFilter, $options: "i" } }
                    ]
                };
            }
            // Find matching customers based on the query
            const matchingCustomers = yield customerModel_1.default.find(customerQuery).select("_id");
            const customerIds = matchingCustomers.map((customer) => customer._id);
            // Apply filter to products based on the matching customer IDs
            productFilterQuery.customerId = { $in: customerIds };
        }
        // Get total count for pagination.
        const total = yield productModel_1.default.countDocuments(productFilterQuery);
        // Fetch products with all related population.
        const products = yield productModel_1.default.find(productFilterQuery)
            .populate({
            path: "productDetailId",
            model: "ProductDetail",
        })
            .populate({
            path: "customerId",
            populate: [
                {
                    path: "referenceDetail.referenceId",
                    model: "StaffUser",
                },
                {
                    path: "adminId",
                },
            ],
        })
            .populate("adminId")
            .sort({ renewalDate: 1 })
            .skip(skip)
            .limit(limit)
            .exec();
        return (0, responseHandler_1.sendSuccessResponse)(res, 200, "Product renewals fetched successfully", {
            products,
            total,
            page,
            limit,
        });
    }
    catch (error) {
        console.error("Error fetching product renewals:", error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal server error", error);
    }
});
exports.getProductRenewals = getProductRenewals;
/**
 * Import customers from CSV or Excel file.
 */
const importCustomers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Ensure request is made by an authenticated admin.
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminId) {
            return (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized: Admin access required");
        }
        // console.log("file", req.file);
        // Ensure a file was uploaded.
        if (!req.file) {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "File is required for bulk upload");
        }
        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;
        let customerRecords = [];
        // Parse CSV file.    
        if (fileName.endsWith(".csv")) {
            // Convert buffer to string and parse CSV.
            const csvString = fileBuffer.toString("utf-8");
            customerRecords = yield (0, csvtojson_1.default)().fromString(csvString);
        }
        // Parse XLSX or XLS file.
        else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            // Read Excel file and convert the first worksheet to JSON.
            const workbook = xlsx_1.default.read(fileBuffer, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            customerRecords = xlsx_1.default.utils.sheet_to_json(worksheet);
        }
        else {
            return (0, responseHandler_1.sendErrorResponse)(res, 400, "Unsupported file format. Only CSV and XLSX are allowed.");
        }
        // Map file data to Customer documents.
        // Note: The file is expected to have the following headers:
        // companyName, contactPerson, mobileNumber, email, tallySerialNo, prime, blacklisted, remark
        const customers = customerRecords.map((record) => ({
            adminId,
            companyName: record.companyName,
            contactPerson: record.contactPerson,
            mobileNumber: record.mobileNumber,
            email: record.email,
            tallySerialNo: record.tallySerialNo,
            prime: record.prime
                ? String(record.prime).toLowerCase() === "true"
                : false,
            blacklisted: record.blacklisted
                ? String(record.blacklisted).toLowerCase() === "true"
                : false,
            remark: record.remark || "",
        }));
        // Bulk insert customers.
        const insertedCustomers = yield customerModel_1.default.insertMany(customers);
        return (0, responseHandler_1.sendSuccessResponse)(res, 201, "Bulk customers added successfully", {
            count: insertedCustomers.length,
        });
    }
    catch (error) {
        console.error("Error in bulk adding customers:", error);
        return (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal server error", error);
    }
});
exports.importCustomers = importCustomers;
