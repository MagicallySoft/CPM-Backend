import { Request, Response, NextFunction } from "express";
import csv from "csvtojson";
import XLSX from "xlsx";
import Customer, { ICustomerData } from "../../models/customer/customerModel";
import { computeBlindIndex } from "../../utils/encryption";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/responseHandler";
import { MulterRequest } from "../../utils/interfaces";

/**
 * Add a new customer.
 * The virtual field "data" triggers encryption and blind index calculation.
 */
export const addCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerData: ICustomerData = req.body;
    if (!customerData) {
      return sendErrorResponse(res, 400, "Customer data is required.");
    }

    // Convert companyName and contactPerson to uppercase
    if (customerData.companyName) {
      customerData.companyName = customerData.companyName.toUpperCase();
    }
    if (customerData.contactPerson) {
      customerData.contactPerson = customerData.contactPerson.toUpperCase();
    }

    const newCustomer = new Customer({
      adminId: req.user?.id, // Assumes authentication middleware has set req.user
    });

    // Virtual setter encrypts the data and calculates blind indexes.
    newCustomer.data = customerData;
    await newCustomer.save();

    return sendSuccessResponse(res, 201, "Customer added successfully", {
      customerId: newCustomer._id,
    });
  } catch (error: any) {
    console.error("Add Customer Error:", error);
    return sendErrorResponse(res, 500, "Internal Server Error", { error: error.message });
  }
};


/**
 * Search customers using blind indexes for exact-match queries.
 */
export const searchCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.role === "admin" ? req.user.id : req.user?.adminId;
    // console.log(adminId);
    
    const { companyName, mobileNumber, contactPerson, email, tallySerialNo } = req.query;
    const query: any = { adminId };

    if (companyName) {
      query.companyNameIndex = computeBlindIndex(String(companyName).toUpperCase());
    }
    if (contactPerson) {
      query.contactPersonIndex = computeBlindIndex(String(contactPerson).toUpperCase());
    }
    if (mobileNumber) {
      query.mobileNumberIndex = computeBlindIndex(String(mobileNumber));
    }
    if (email) {
      query.emailIndex = computeBlindIndex(String(email));
    }
    if (tallySerialNo) {
      query.tallySerialNoIndex = computeBlindIndex(String(tallySerialNo));
    }

    // Pagination parameters
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const totalCount = await Customer.countDocuments(query);
    const customers = await Customer.find(query).skip(skip).limit(limit);

    if (customers.length === 0) {
      return sendSuccessResponse(res, 200, "No customers found!");
    }

    // Decrypt each customer's data (via the virtual getter) for the response.
    const result = customers.map((cust) => {
      // Using the virtual getter, which decrypts the encryptedData.
      const decryptedData = cust.data;
      // Merge decrypted data with selected fields (you can exclude encrypted fields if desired)
      return { _id: cust._id, adminId: cust.adminId, nextRenewalDate: cust.nextRenewalDate, ...decryptedData };
    });

    return sendSuccessResponse(res, 200, "Customers found", {
      customers: result,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error: any) {
    console.error("Search Customer Error:", error);
    return sendErrorResponse(res, 500, "Internal Server Error", { error: error.message });
  }
};

/**
 * Update customer data.
 * Merges new data with existing decrypted data and re-encrypts.
 */
export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.params.id;
    const adminId = req.user?.id;
    const newData: Partial<ICustomerData> = req.body;
    
    // Find the customer document by ID and ensure the admin owns it.
    const customer = await Customer.findOne({ _id: customerId, adminId });
    if (!customer) {
      return sendErrorResponse(res, 404, "Customer not found or unauthorized");
    }

    // Merge new data with the existing decrypted data.
    const currentData = customer.data;
    const updatedData = { ...currentData, ...newData };
    customer.data = updatedData; // Triggers re-encryption and blind index recalculation

    await customer.save();
    return sendSuccessResponse(res, 200, "Customer updated successfully", customer);
  } catch (error: any) {
    console.error("Update Customer Error:", error);
    return sendErrorResponse(res, 500, "Internal Server Error", { error: error.message });
  }
};

/**
 * Delete a customer.
 */
export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.params.id;
    const adminId = req.user?.id;
    const customer = await Customer.findOneAndDelete({ _id: customerId, adminId });
    if (!customer) {
      return sendErrorResponse(res, 404, "Customer not found or unauthorized");
    }
    return sendSuccessResponse(res, 200, "Customer deleted successfully");
  } catch (error: any) {
    console.error("Delete Customer Error:", error);
    return sendErrorResponse(res, 500, "Internal Server Error", { error: error.message });
  }
};

/**
 * Retrieve customers with upcoming renewal dates.
 */
export const getRenewalReminderList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.role === "admin" ? req.user.id : req.user?.adminId;
    const { reminderType = "thisMonth", startDate, endDate } = req.query;
    
    let start: Date, end: Date;
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
          return sendErrorResponse(res, 400, "Start date and end date are required for custom range");
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
    const customers = await Customer.find(query);
    // console.log(customers)
    if (!customers || customers.length === 0) {
      return sendSuccessResponse(res, 200, "No customers found for renewal reminder!");
    }

    // Decrypt each customer's data for the response.
    const result = customers.map((cust) => {
      const decryptedData = cust.data;
      return { _id: cust._id, adminId: cust.adminId, nextRenewalDate: cust.nextRenewalDate, ...decryptedData };
    });

    return sendSuccessResponse(res, 200, "Renewal reminders fetched successfully", { customers: result });
  } catch (error: any) {
    console.error("Error fetching renewal reminders:", error);
    return sendErrorResponse(res, 500, "Internal Server Error", { error: error.message });
  }
};

/**
 * Import customers from CSV or Excel file.
 */
export const importCustomers = async (req: MulterRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    let customerRecords: ICustomerData[] = [];

    // Determine file type based on the extension.
    if (fileName.endsWith(".csv")) {
      // Convert buffer to string and parse CSV.
      const csvString = fileBuffer.toString("utf-8");
      customerRecords = await csv().fromString(csvString);
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      // Read Excel file and convert the first worksheet to JSON.
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      customerRecords = XLSX.utils.sheet_to_json(worksheet);
    } else {
      return res.status(400).json({ error: "Unsupported file format" });
    }

    // Map each record to the expected ICustomerData format.
    // Adjust field names if your CSV/Excel headers differ.
    const customersToInsert = customerRecords.map((record: any) => {
      const customerData: ICustomerData = {
        companyName: record.companyName.toUpperCase() || record.CompanyName.toUpperCase(),
        contactPerson: record.contactPerson.toUpperCase() || record.ContactPerson.toUpperCase(),
        mobileNumber: record.mobileNumber || record.MobileNumber,
        email: record.email || record.Email,
        tallySerialNo: record.tallySerialNo || record.TallySerialNo,
        // Convert string values to booleans if needed.
        prime: record.prime === "true" || record.prime === true || false,
        blacklisted:
          record.blacklisted === "true" ||
          record.blacklisted === true ||
          false,
        remark: record.remark || record.Remark,
        // If there are any dynamic fields or products, you can add them here.
        // products: record.products ? JSON.parse(record.products) : undefined,
        // dynamicFields: record.dynamicFields ? JSON.parse(record.dynamicFields) : undefined,
      };

      return new Customer({
        // Assuming you have the authenticated admin user in req.user.
        adminId: req.user?.id,
        data: customerData,
      });
    });

    // Bulk insert customers into the database.
    await Customer.insertMany(customersToInsert);

    res.json({
      message: `${customersToInsert.length} customers imported successfully`,
    });
  } catch (error) {
    console.error("Error importing customers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};