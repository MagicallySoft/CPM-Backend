// controllers/auth/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import Code from "../../models/auth/codeModel";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/responseHandler";

// Unified API for generating registration codes
export const createRegistrationCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ensure req.user is set by your authentication middleware
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { username, designation, expiryDate } = req.body;

    // Validate basic required fields
    if (!username) {
      return sendErrorResponse(res, 400, "Username is required.");
    }
    if (!userId || !userRole) {
      return sendErrorResponse(res, 401, "Unauthorized: Missing user credentials.");
    }

    let assignedToRole: "subadmin" | "employee";

    // Only admins can generate codes for subadmin or employee
    if (userRole === "admin") {
      // If a designation is provided, treat the code as for an employee; otherwise, subadmin.
      assignedToRole = designation ? "employee" : "subadmin";
    } else {
      return sendErrorResponse(
        res,
        403,
        "Only admins are authorized to generate registration codes."
      );
    }

    // For employee codes, ensure a designation is provided
    if (assignedToRole === "employee" && !designation) {
      return sendErrorResponse(res, 400, "Designation is required for employee registration codes.");
    }

    // Optionally validate and convert expiryDate if provided
    let expiresAt: Date | undefined;
    if (expiryDate) {
      expiresAt = new Date(expiryDate);
      if (isNaN(expiresAt.getTime())) {
        return sendErrorResponse(res, 400, "Invalid expiry date.");
      }
    }

    // Generate a unique registration code. (For production, consider using a robust package or collision check.)
    const code = Math.random().toString(36).substring(2, 15);

    // Create the registration code entry
    const registrationCode = new Code({
      username,
      code,
      createdBy: userId,
      assignedToRole,
      designation: assignedToRole === "employee" ? designation : undefined,
      expiresAt: expiresAt,
    });
    // console.log(registrationCode);
    
    await registrationCode.save();

    return sendSuccessResponse(
      res,
      201,
      `${assignedToRole} registration code created successfully.`,
      { code, assignedToRole }
    );
  } catch (error: any) {
    console.error("Error generating registration code:", error);
    return sendErrorResponse(res, 500, "Internal server error", { error: error.message });
  }
};
