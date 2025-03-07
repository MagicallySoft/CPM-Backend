import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import csv from "csvtojson";
import XLSX from "xlsx";
import Customer from "../../models/customer/customerModel";
import Product from "../../models/customer/productModel";
import StaffUser from "../../models/auth/StaffUserModel";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../utils/responseHandler";
import { MulterRequest, IProduct, ICustomer } from "../../utils/interfaces";
import ProductDetail from "../../models/customer/productDetailModel";

export const addProductDetail = async (req: Request, res: Response) => {
  try {
    // Check if the request is made by an authenticated admin.
    // This assumes an authentication middleware that sets req.user.
    const adminId = req.user?.id;
    if (!adminId) {
      return sendErrorResponse(
        res,
        401,
        "Unauthorized: Admin access required."
      );
    }

    // Extract required fields from request body.
    const { name, price, description, link, category, tags, specifications } =
      req.body;

    // Basic validation: name and price are required.
    if (!name || price === undefined) {
      return sendErrorResponse(res, 400, "Name and price are required.");
    }

    // Create a new product detail document.
    const newProductDetail = new ProductDetail({
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
    const savedProductDetail = await newProductDetail.save();

    return sendSuccessResponse(
      res,
      200,
      "saved Product Detail",
      savedProductDetail
    );
  } catch (error: any) {
    console.error("Error adding product detail:", error);
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[duplicateField];
      return sendErrorResponse(
        res,
        400,
        `${duplicateField} "${duplicateValue}" already exists.`
      );
    }
    return sendErrorResponse(res, 500, "Internal Server Error", {
      error: error.message,
    });
  }
};

export const listProductDetails = async (req: Request, res: Response) => {
  try {
    // Verify that the request is made by an authenticated admin.
    const adminId = req.user?.id;
    if (!adminId) {
      return sendErrorResponse(
        res,
        401,
        "Unauthorized: Admin access required."
      );
    }

    // Extract the optional search query parameter.
    const search = req.query.search as string;

    // Build the filter: Only include records for the authenticated admin.
    const filter: any = { adminId };

    // If a search query is provided, apply a text search.
    if (search) {
      filter.$text = { $search: search };
    }

    // Retrieve matching ProductDetail records, sorted by creation date (newest first).
    const productDetails = await ProductDetail.find(filter)
      .sort({ createdAt: -1 })
      .exec();

    return sendSuccessResponse(
      res,
      200,
      "Product details fetched successfully",
      productDetails
    );
  } catch (error: any) {
    console.error("Error listing product details:", error);
    return sendErrorResponse(res, 500, "Internal Server Error", {
      error: error.message,
    });
  }
};

/**
 * Add a new customer.
 * */
export const addCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ensure the request is made by an authenticated admin.
    const adminId = req.user?.id;
    if (!adminId) {
      return sendErrorResponse(
        res,
        401,
        "Unauthorized: Admin access required."
      );
    }

    // Extract customer fields and the products array from the request body.
    const {
      companyName,
      contactPerson,
      mobileNumber,
      email,
      tallySerialNo,
      prime,
      blacklisted,
      remark,
      dynamicFields,
      hasReference,
      referenceDetail,
      products, // products should be an array of product objects
    } = req.body;

    // Validate required customer fields.
    if (
      !companyName ||
      !contactPerson ||
      !mobileNumber ||
      !email ||
      !tallySerialNo
    ) {
      return sendErrorResponse(res, 400, "Missing required customer fields.");
    }
    // console.log(hasReference)
    // console.log(referenceDetail)
    // Validate referenceDetail if provided: must have either referenceId or both referenceName and referenceContact.
    if (hasReference && referenceDetail) {
      const { referenceId, referenceName, referenceContact } = referenceDetail;
      if (!referenceId && (!referenceName || !referenceContact)) {
        return sendErrorResponse(
          res,
          400,
          "Invalid referenceDetail: provide either referenceId or both referenceName and referenceContact."
        );
      }
    }

    // Create the customer document with adminId attached.
    const newCustomer = new Customer({
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

    const savedCustomer = await newCustomer.save();

    let savedProducts: IProduct[] = [];
    if (Array.isArray(products) && products.length > 0) {
      // Map each product to a new Product document.
      const productDocs = products.map((product: any) => {
        // Validate that each product has a productDetailId.
        if (!product.productDetailId) {
          throw new Error("Each product must have a productDetailId.");
        }
        return new Product({
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
          updatedBy: adminId,
          renewalCancelled: product.renewalCancelled || false,
        });
      });

      // Save all product documents concurrently.
      savedProducts = await Promise.all(productDocs.map((doc) => doc.save()));
    }

    // Populate all related fields in the saved customer document.
    const populatedCustomer = await Customer.findById(savedCustomer._id)
      .populate("products") // virtual populate of related products
      .populate("adminId") // if you wish to see details of the admin
      .populate({
        path: "referenceDetail.referenceId", // populate staff user if referenceId exists
        model: "StaffUser",
      });

    return sendSuccessResponse(res, 200, "Customer Added", populatedCustomer);
  } catch (error: any) {
    console.error("Error adding customer and products:", error);
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      const duplicateValue = error.keyValue[duplicateField];
      return sendErrorResponse(
        res,
        400,
        `${duplicateField} "${duplicateValue}" already exists.`
      );
    }
    return sendErrorResponse(res, 500, "Internal Server Error", {
      error: error.message,
    });
  }
};

/**
 * List customers in full detail (with products and reference info).
 * - Only customers created by the authenticated admin are returned.
 * - Supports text search (companyName, tallySerialNo, contactPerson, mobileNumber),
 *   filtering by reference and product, and pagination.
 * - Populates products (and nested product details), reference details, and admin info.
 */
export const searchCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ensure request is made by an authenticated admin.
    const adminId = req.user?.id;
    if (!adminId) {
      return sendErrorResponse(res, 401, "Unauthorized: Admin access required");
    }

    // Extract query parameters.
    const search = req.query.search as string; // For text search
    const referenceFilter = req.query.reference as string; // Filter by reference name/contact
    const productFilter = req.query.product as string; // Filter by productDetailId (assumed)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    // console.log(page)
    // console.log(limit)
    // Build the query filter for Customer.
    const filter: any = { adminId };

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
      const matchingProducts = await Product.find({
        productDetailId: productFilter,
        adminId: adminId,
      }).select("customerId");

      // Map to array of customer IDs.
      const customerIds = matchingProducts.map((product) => product.customerId);
      // Apply filter to return only those customers.
      filter._id = { $in: customerIds };
    }

    // Get total count for pagination.
    const total = await Customer.countDocuments(filter);

    // Fetch customers with population of virtual products, nested product details,
    // reference details, and admin info.
    const customers = await Customer.find(filter)
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

    return sendSuccessResponse(res, 200, "Customers fetched successfully", {
      customers,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return sendErrorResponse(res, 500, "Internal server error", error);
  }
};

/**
 * List of Product.
 * */
export const listProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { customerId } = req.query;
    const adminId = req.user?.id;
    const query: any = {};
    if (customerId) query.customerId = customerId;
    if (adminId) query.adminId = adminId;

    const products = await Product.find(query)
      .populate("customerId") // Populate customer details
      .populate("adminId") // Populate admin details
      .populate("productDetailId") // Populate product detail info
      .populate({
        path: "renewalHistory.renewedBy", // Populate renewedBy field inside renewalHistory
        model: "AdminUser",
      });
    if(!products){
      return sendErrorResponse(res, 404, "Product not found");
    }
    
      return sendSuccessResponse(
        res,
        200,
        "Products fetched successfully",
        products
      );
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return sendErrorResponse(res, 500, "Internal server error", error);
  }
};

/**
 * Update customer data.
 * The updateCustomer function updates a customer's data in the database, including adding new products if provided. It extracts the products and other customer data from the request body, updates the customer information, and adds new products if they have valid details. The updated customer information, along with populated related data, is then returned in the response.
 */
export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.params.id;
    const adminId = req.user?.id;

    // Destructure the products array from the request body and keep the rest as customer update data.
    const { products, ...customerData } = req.body;

    // Update the customer document with provided data.
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      customerData,
      { new: true }
    );
    if (!updatedCustomer) {
      return sendErrorResponse(res, 404, "Customer not found");
    }

    // If new products are provided, add them.
    let newProducts: IProduct[] = [];
    if (Array.isArray(products) && products.length > 0) {
      newProducts = await Promise.all(
        products.map(async (product: any) => {
          // Validate that each product has a productDetailId.
          if (!product.productDetailId) {
            throw new Error("Each new product must have a productDetailId.");
          }
          // Create a new product document.
          const newProduct = new Product({
            customerId: updatedCustomer._id,
            adminId, // Admin performing the operation.
            productDetailId: product.productDetailId,
            purchaseDate: product.purchaseDate
              ? new Date(product.purchaseDate)
              : new Date(),
            renewalDate: product.renewalDate
              ? new Date(product.renewalDate)
              : undefined,
            details: product.details,
            autoUpdated: product.autoUpdated || false,
            updatedBy: adminId,
            renewalCancelled: product.renewalCancelled || false,
          });
          return await newProduct.save();
        })
      );
    }

    // Optionally, re-populate the customer document with related products and admin details.
    const populatedCustomer = await Customer.findById(customerId)
      .populate("products") // Assumes a virtual populate is set up.
      .populate("adminId");

    return sendSuccessResponse(
      res,
      200,
      "Customer updated successfully",
      populatedCustomer
    );
  } catch (error: any) {
    console.error("Update Customer Error:", error);
    return sendErrorResponse(res, 500, "Internal Server Error", {
      error: error.message,
    });
  }
};

/**
 * Update Product.
 */
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const productId = req.params.id;
    const adminId = req.user?.id;
    // Exclude productDetailId and purchaseDate from update fields.
    const { productDetailId, purchaseDate, ...updateData } = req.body;

    // Optionally, record who is making the update.
    updateData.updatedBy = adminId;

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    );
    if (!updatedProduct) {
      return sendErrorResponse(res, 404, "Product not found");
    }

    return sendSuccessResponse(
      res,
      200,
      "Product updated successfully",
      updatedProduct
    );
  } catch (error: any) {
    console.error("Update Product Error:", error);
    return sendErrorResponse(res, 500, "Internal Server Error", {
      error: error.message,
    });
  }
};

/**
 * Delete a Product.
 */
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const productId = req.params.id;
    const adminId = req.user?.id;

    // Optionally, check if the admin is authorized to delete the product

    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return sendErrorResponse(res, 404, "Product not found");
    }

    // Remove the product document from the database
    await product.deleteOne();

    return sendSuccessResponse(res, 200, "Product deleted successfully", {
      id: productId,
    });
  } catch (error: any) {
    console.error("Delete Product Error:", error);
    return sendErrorResponse(res, 500, "Internal Server Error", {
      error: error.message,
    });
  }
};

/**
 * Delete a customer.
 */
export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ensure the request is made by an authenticated admin.
    const adminId = req.user?.id;
    if (!adminId) {
      return sendErrorResponse(res, 401, "Unauthorized: Admin access required");
    }

    // Extract customerId from the route parameters.
    const { id } = req.params;
    const customerId = id;
    // console.log( req.params)
    // console.log(customerId)
    //
    if (!customerId) {
      return sendErrorResponse(res, 400, "Customer id is required");
    }

    // Find the customer ensuring they belong to the admin.
    const customer = await Customer.findOne({ _id: customerId, adminId });
    if (!customer) {
      return sendErrorResponse(res, 404, "Customer not found or unauthorized");
    }

    // Delete all products associated with this customer.
    await Product.deleteMany({ customerId });

    // Delete the customer document.
    await Customer.deleteOne({ _id: customerId });

    return sendSuccessResponse(
      res,
      200,
      "Customer and associated products deleted successfully"
    );
  } catch (error) {
    console.error("Error deleting customer and products:", error);
    return sendErrorResponse(res, 500, "Internal server error", error);
  }
};

/**
 * Retrieve customers with upcoming renewal dates.
 */
export const getProductRenewals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate admin access
    const adminId = req.user?.id;
    if (!adminId) {
      return sendErrorResponse(res, 401, "Unauthorized: Admin access required");
    }

    // Parse query parameters
    const period = (req.query.period as string) || "thisWeek"; // e.g. "thisWeek", "in15Days", "thisMonth", "nextMonth", "custom"
    const customStart = req.query.startDate as string;
    const customEnd = req.query.endDate as string;
    const productFilter = req.query.product as string; // filter by productDetailId
    const referenceFilter = req.query.reference as string; // filter by customer's reference (name or contact)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
  
    // console.log("--->",period)
    // console.log("customStart--->",customStart)
    // console.log("customEnd--->",customEnd)
    // Determine the date range based on the requested period
    let startDate: Date, endDate: Date;
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
          return sendErrorResponse(
            res,
            400,
            "Custom period requires start and end dates"
          );
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
    const productFilterQuery: any = {
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
      if (mongoose.Types.ObjectId.isValid(referenceFilter)) {
        // Treat as a referenceId
        customerQuery = {
          adminId,
          "referenceDetail.referenceId": referenceFilter,
        };
      } else {
        // Treat as a reference name or contact
        customerQuery = {
          adminId,
          $or: [
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
          ],
        };
      }

      // Find matching customers based on the query
      const matchingCustomers = await Customer.find(customerQuery).select(
        "_id"
      );
      const customerIds = matchingCustomers.map((customer) => customer._id);

      // Apply filter to products based on the matching customer IDs
      productFilterQuery.customerId = { $in: customerIds };
    }

    // Get total count for pagination.
    const total = await Product.countDocuments(productFilterQuery);

    // Fetch products with all related population.
    const products = await Product.find(productFilterQuery)
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

    return sendSuccessResponse(
      res,
      200,
      "Product renewals fetched successfully!",
      {
        products,
        total,
        page,
        limit,
      }
    );
  } catch (error) {
    console.error("Error fetching product renewals:", error);
    return sendErrorResponse(res, 500, "Internal server error", error);
  }
};

/**
 * Import customers from CSV or Excel file.
 */
export const importCustomers = async (req: MulterRequest, res: Response) => {
  try {
    // Ensure request is made by an authenticated admin.
    const adminId = req.user?.id;
    if (!adminId) {
      return sendErrorResponse(res, 401, "Unauthorized: Admin access required");
    }
    // console.log("file", req.file);

    // Ensure a file was uploaded.
    if (!req.file) {
      return sendErrorResponse(res, 400, "File is required for bulk upload");
    }

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    let customerRecords: ICustomer[] = [];

    // Parse CSV file.
    if (fileName.endsWith(".csv")) {
      // Convert buffer to string and parse CSV.
      const csvString = fileBuffer.toString("utf-8");
      customerRecords = await csv().fromString(csvString);
    }
    // Parse XLSX or XLS file.
    else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      // Read Excel file and convert the first worksheet to JSON.
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      customerRecords = XLSX.utils.sheet_to_json(worksheet);
    } else {
      return sendErrorResponse(
        res,
        400,
        "Unsupported file format. Only CSV and XLSX are allowed."
      );
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
    const insertedCustomers = await Customer.insertMany(customers);

    return sendSuccessResponse(res, 201, "Bulk customers added successfully", {
      count: insertedCustomers.length,
    });
  } catch (error) {
    console.error("Error in bulk adding customers:", error);
    return sendErrorResponse(res, 500, "Internal server error", error);
  }
};
