import { Request, Response, NextFunction } from "express";
import Customer, { ICustomerData } from "../../models/customer/customerModel";
import { computeBlindIndex } from "../../utils/encryption";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/responseHandler";

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
    const adminId = req.user?.id;
    const { companyName, mobileNumber, email, tallySerialNo } = req.query;
    const query: any = { adminId };

    if (companyName) {
      query.companyNameIndex = computeBlindIndex(String(companyName));
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
      return sendErrorResponse(res, 404, "No customers found!");
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
    const adminId = req.user?.id;
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

    if (!customers || customers.length === 0) {
      return sendErrorResponse(res, 404, "No customers found for renewal reminder!");
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
