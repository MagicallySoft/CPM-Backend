import { Request, Response, NextFunction } from "express";
import AdminCustomField from "../../models/customer/customFieldModel";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../utils/responseHandler";

export const addCustomField = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
  const { fieldName, fieldType, isRequired, options, isMultiSelect } = req.body;

  if (!fieldName || !fieldType) {
    return sendErrorResponse(res, 400, "Field name and type are required!");
  }

  const newCustomField = new AdminCustomField({
    adminId: req.user?.userId, // Admin adding the custom field
    fieldName,
    fieldType,
    isRequired,
    options,
    isMultiSelect,
  });

    await newCustomField.save();
    return sendSuccessResponse(
      res,
      201,
      "Custom field added successfully",
      newCustomField
    );
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res, 500, "Internal Server Error");
  }
};

export const getCustomFields = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customFields = await AdminCustomField.find({
      adminId: req.user?.userId,
    });

    return sendSuccessResponse(
      res,
      200,
      "Custom fields fetched successfully",
      customFields
    );
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res, 500, "Internal Server Error");
  }
};

export const updateCustomField = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params; // Get field ID from request params
  const { fieldName, fieldType, isRequired, options } = req.body;
  // console.log({ fieldName, fieldType, isRequired, options });
  try {
    // Validate options if fieldType is 'select'
    if (fieldType === "select" && (!options || !Array.isArray(options))) {
      return sendErrorResponse(res, 400, "Options are required for select fields.");
    }

    const updateData: any = { fieldName, fieldType, isRequired, options };
    
    // Include options only if fieldType is 'select'
    if (fieldType === "select") {
      updateData.options = options;
    }

    const updatedField = await AdminCustomField.findOneAndUpdate(
      { _id: id, adminId: req.user?.userId }, // Ensure only admin's fields are updated
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedField) {
      return sendErrorResponse(res, 404, "Custom field not found or unauthorized.");
    }

    return sendSuccessResponse(res, 200, "Custom field updated successfully", updatedField);
  } catch (error) {
    return sendErrorResponse(res, 500, "Internal Server Error");
  }
};

export const deleteCustomField = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params; // Get field ID from request params
  // console.log("ID",id);

  try {
    const deletedField = await AdminCustomField.findOneAndDelete({
      _id: id,
      adminId: req.user?.userId, // Ensure admin can only delete their own fields
    });

    if (!deletedField) {
      return sendErrorResponse(
        res,
        404,
        "Custom field not found or unauthorized"
      );
    }

    return sendSuccessResponse(res, 200, "Custom field deleted successfully");
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res, 500, "Internal Server Error");
  }
};
