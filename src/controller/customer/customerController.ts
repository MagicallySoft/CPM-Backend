import { Request, Response, NextFunction } from "express";
import Customer from "../../models/customer/customerModel";
import AdminCustomField from "../../models/customer/customFieldModel";
import { IUser } from "../../utils/interfaces";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../utils/responseHandler";

// export const addCustomer = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const {
//       companyName,
//       contactPerson,
//       mobileNumber,
//       email,
//       tallySerialNo,
//       prime,
//       blacklisted,
//       remark,
//       dynamicFields, // Dynamic fields to be added to the customer
//     } = req.body;

    
//     const sanitizedDynamicFields =
//       dynamicFields && typeof dynamicFields === "object" ? dynamicFields : {};
//     // Fetch the admin's custom fields
//     const customFields = await AdminCustomField.find({
//       adminId: req.user?.userId,
//     });

//     // Validate dynamic fields according to admin's custom fields
//     const dynamicFieldKeys = Object.keys(dynamicFields);
//     for (let key of dynamicFieldKeys) {
//       const field = customFields.find((f) => f.fieldName === key);
//       if (!field) {
//         return sendErrorResponse(
//           res,
//           400,
//           `Field '${key}' is not a valid custom field for your admin.`
//         );
//       }
//     }

//     const newCustomer = new Customer({
//       companyName,
//       contactPerson,
//       mobileNumber,
//       email,
//       tallySerialNo,
//       remark,
//       prime,
//       blacklisted,
//       adminId: req.user?.userId, // Save the admin's ID who is creating the customer
//       dynamicFields: sanitizedDynamicFields, // Store the dynamic fields
//     });

//     await newCustomer.save();
//     return sendSuccessResponse(
//       res,
//       201,
//       "Customer added successfully",
//       newCustomer
//     );
//   } catch (error: any) {
//     console.log(error);

//     if (error.name === "ValidationError") {
//       const messages = Object.values(error.errors).map(
//         (err: any) => err.message
//       );
//       sendErrorResponse(res, 400, messages.join(", "));
//     }

//     // Handle duplicate key errors (code 11000)
//     if (error.code === 11000) {
//       const field = Object.keys(error.keyPattern)[0];
//       sendErrorResponse(
//         res,
//         400,
//         `The ${field} '${error.keyValue[field]}' is already in use.`
//       );
//     }
//     return sendErrorResponse(res, 500, "Internal Server Error");
//   }
// }; 

export const addCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      companyName,
      contactPerson,
      mobileNumber,
      email,
      tallySerialNo,
      prime,
      blacklisted,
      remark,
      dynamicFields, // Dynamic fields to be added to the customer
      products, // Array of products
    } = req.body;
    // console.log({companyName,
    //   contactPerson,
    //   mobileNumber,
    //   email,
    //   tallySerialNo,
    //   prime,
    //   blacklisted,
    //   remark,
    //   dynamicFields, 
    //   products,
    // });
    
    const sanitizedDynamicFields =
      dynamicFields && typeof dynamicFields === "object" ? dynamicFields : {};

    // Fetch the admin's custom fields
    const customFields = await AdminCustomField.find({
      adminId: req.user?.userId,
    });

    // Validate dynamic fields according to admin's custom fields
    const dynamicFieldKeys = Object.keys(dynamicFields || {});
    for (let key of dynamicFieldKeys) {
      const field = customFields.find((f) => f.fieldName === key);
      if (!field) {
        return sendErrorResponse(
          res,
          400,
          `Field '${key}' is not a valid custom field for your admin.`
        );
      }
    }

    // Validate product details if provided
    if (products && !Array.isArray(products)) {
      return sendErrorResponse(res, 400, "Products should be an array.");
    }

    // Ensure required fields in each product
    const validatedProducts = (products || []).map((product: any) => {
      // console.log("productName",product.productName);
      
      // if (!product.productName || !product.purchaseDate) {
      //   throw new Error("Product name and purchase date are required.");
      // }
      return {
        productName: product.productName,
        purchaseDate: new Date(product.purchaseDate),
        renewalDate: product.renewalDate ? new Date(product.renewalDate) : undefined,
        details: product.details || "",
        reference: product.reference || false,
        referenceDetail: product.referenceDetail
          ? product.referenceDetail
          : undefined,
      };
    });

    const newCustomer = new Customer({
      companyName,
      contactPerson,
      mobileNumber,
      email,
      tallySerialNo,
      remark,
      prime,
      blacklisted,
      adminId: req.user?.userId, // Save the admin's ID who is creating the customer
      dynamicFields: sanitizedDynamicFields, // Store the dynamic fields
      products: validatedProducts, // Store the products
    });

    await newCustomer.save();
    return sendSuccessResponse(
      res,
      201,
      "Customer added successfully",
      newCustomer
    );
  } catch (error: any) {
    console.log(error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message
      );
      sendErrorResponse(res, 400, messages.join(", "));
    };

    // Handle duplicate key errors (code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      sendErrorResponse(
        res,
        400,
        `The ${field} '${error.keyValue[field]}' is already in use.`
      );
    }
    return sendErrorResponse(res, 500, "Internal Server Error");
  }
};


export const searchCustomer = async (
  req: Request, 
  res: Response,
  next: NextFunction
) => {
  const { companyName, mobileNumber, contactPerson, tallySerialNo } = req.query;

  const id = req.user?.role === "admin" ? req.user?.userId : req.user?.adminId;

  const query: any = { adminId: id };

  if (companyName) query.companyName = { $regex: companyName, $options: "i" };
  if (tallySerialNo)
    query.tallySerialNo = { $regex: tallySerialNo, $options: "i" };
  if (mobileNumber)
    query.mobileNumber = { $regex: mobileNumber, $options: "i" };
  if (contactPerson)
    query.contactPerson = { $regex: contactPerson, $options: "i" };

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Fetch total count for pagination metadata
    const totalCount = await Customer.countDocuments(query);

    // Fetch paginated customers
    const customers = await Customer.find(query).skip(skip).limit(limit);

    if (customers.length === 0) {
      return sendErrorResponse(res, 404, "No customers found!");
    }
    
    return sendSuccessResponse(res, 200, "Customers found", {
      customers,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res, 500, "Internal Server Error");
  }
};

export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params; // Get customer ID from route parameter
  const updates = req.body; // Get the fields to be updated from the request body
  const adminId = req.user?.userId; // The logged-in admin's ID

  // Check if the user is an admin
  if (req.user?.role !== "admin") {
    res.status(403).json({ message: "Only admins can update customer data" });
  }

  try {
    // Find the customer by ID and check if it belongs to the current admin
    const customer: any = await Customer.findOne({ _id: id, adminId: adminId });

    if (!customer) {
      res
        .status(404)
        .json({ message: "Customer not found or not authorized to update" });
    }

    // Update the customer fields
    Object.assign(customer, updates);
    await customer.save();

    // Send the updated customer data in response
    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message
      );
      sendErrorResponse(res, 400, messages.join(", "));
    }

    // Handle duplicate key errors (code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      sendErrorResponse(
        res,
        400,
        `The ${field} '${error.keyValue[field]}' is already in use.`
      );
    }
    sendErrorResponse(res, 500, "Internal Server Error");
    // Pass errors to the error handler middleware
  }
};

export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params; // Get customer ID from route parameter
  const adminId = req.user?.userId; // The logged-in admin's ID

  // Check if the user is an admin
  if (req.user?.role !== "admin") {
    res.status(403).json({ message: "Only admins can delete customer data" });
  }

  try {
    // Find the customer by ID and check if it belongs to the current admin
    const customer = await Customer.findOneAndDelete({
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
  } catch (error) {
    sendErrorResponse(res, 500, "Internal Server Error");
  }
};


//Reminder 
export const getRenewalReminderList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // console.log("\n\nGETED\n\n");
    
    const { reminderType = "thisMonth", startDate, endDate } = req.query;
    const adminId = req.user?.role === "admin" ? req.user?.userId : req.user?.adminId;
    const today: Date = new Date();
    let start: Date, end: Date;

    // Validate and convert the startDate and endDate to string, if available
    let startDateStr = startDate && typeof startDate === "string" ? startDate : undefined;
    let endDateStr = endDate && typeof endDate === "string" ? endDate : undefined;

    switch (reminderType) {
      case "thisWeek":
        start = new Date(today.setDate(today.getDate() - today.getDay()));
        end = new Date(today.setDate(today.getDate() + (6 - today.getDay())));
        break;
      case "in15Days":
        start = new Date();
        end = new Date();
        end.setDate(start.getDate() + 15);
        break;
      case "thisMonth":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "nextMonth":
        start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        break;
      case "custom":
        if (!startDateStr || !endDateStr) {
          return sendErrorResponse(res, 400, "Start date and end date are required for custom range");
        }
        start = new Date(startDateStr);
        end = new Date(endDateStr);
        break;
      default:
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    // Query customers whose products have a renewalDate within the given range
    const customers = await Customer.find({
      adminId,
      "products.renewalDate": {
        $gte: start,
        $lte: end,
      },
    });

    if (customers.length === 0) {
      return sendErrorResponse(res, 404, "No customers found for renewal reminder!");
    }

    return sendSuccessResponse(res, 200, "Renewal reminders fetched successfully", { customers });
  } catch (error) {
    console.error("Error fetching renewal reminders:", error);
    return sendErrorResponse(res, 500, "Internal Server Error");
  }
};



// export const getRenewalReminderList = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { reminderType = "thisMonth", startDate, endDate } = req.query;
//     const adminId = req.user?.role === "admin" ? req.user?.userId : req.user?.adminId;
//     const today: Date = new Date();

//     let startDateStr = startDate && typeof startDate === "string" ? startDate : undefined;
//     let endDateStr = endDate && typeof endDate === "string" ? endDate : undefined;

//     let start , end;

//     switch (reminderType) {
//       case "thisWeek":
//         start = new Date(today.setDate(today.getDate() - today.getDay()));
//         end = new Date(today.setDate(today.getDate() + (6 - today.getDay())));
//         break;
//       case "in15Days":
//         start = new Date();
//         end = new Date();
//         end.setDate(start.getDate() + 15);
//         break;
//       case "thisMonth":
//         start = new Date(today.getFullYear(), today.getMonth(), 1);
//         end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//         break;
//       case "nextMonth":
//         start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
//         end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
//         break;
//       case "custom":
//         if (!startDate || !endDate) {
//           return sendErrorResponse(res, 400, "Start date and end date are required for custom range");
//         }
//         start = new Date(startDate);
//         end = new Date(endDate);
//         break;
//       default:
//         start = new Date(today.getFullYear(), today.getMonth(), 1);
//         end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//     }

//     // Query customers whose products have a renewalDate within the given range
//     const customers = await Customer.find({
//       adminId,
//       "products.renewalDate": {
//         $gte: start,
//         $lte: end,
//       },
//     });

//     if (customers.length === 0) {
//       return sendErrorResponse(res, 404, "No customers found for renewal reminder!");
//     }

//     return sendSuccessResponse(res, 200, "Renewal reminders fetched successfully", { customers });
//   } catch (error) {
//     console.error("Error fetching renewal reminders:", error);
//     return sendErrorResponse(res, 500, "Internal Server Error");
//   }
// };
