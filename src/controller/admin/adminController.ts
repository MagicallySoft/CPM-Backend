import { Request, Response, NextFunction } from "express";
import User from "../../models/auth/AdminUserModel";
import Employee from "../../models/auth/StaffUserModel";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../utils/responseHandler";

export const userList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Fetch all relevant users from User table
    const users = await User.find(
      { role: { $in: ["superadmin", "admin", "subadmin", "employee"] } },
      "username email role adminId"
    )
      .populate("adminId", "username email role")
      .lean();

    // Group users by role
    const groupedUsers = {
      superadmins: users.filter((user) => user.role === "superadmin"),
      admins: users.filter((user) => user.role === "admin"),
      subadmins: users.filter((user) => user.role ),
      employees: users.filter((user) => user.role ),
    };

    return sendSuccessResponse(
      res,
      200,
      "Users retrieved successfully",
      groupedUsers
    );
  } catch (error) {
    console.error("Error in userList:", error);
    next(error);
  }
};


export const getUsersByAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return sendErrorResponse(res, 403, "Unauthorized access.");
    }

    let adminId:any;

    if (user.role === "admin") {
      adminId = user.userId; // Admin fetching users under them
    } else if (user.role === "subadmin") {
      adminId = user.adminId; // Subadmin fetching only employees under them
    } else {
      return sendErrorResponse(res, 403, "Access denied. Admins only.");
    }

    // Fetch subadmins and employees based on role
    const subAdminsAndEmployees = await User.find(
      { adminId: adminId, role: { $in: ["subadmin", "employee"] } },
      "username email role createdAt updatedAt designation"
    )
      .populate("adminId", "username email role")
      .lean();

    // Grouping logic
    const groupedUsers = {
      subadmins: subAdminsAndEmployees.filter((user) => user.role ),
      employees: subAdminsAndEmployees.filter((user) => user.role ),
    };

    return sendSuccessResponse(
      res,
      200,
      "Users fetched successfully",
      groupedUsers
    );
  } catch (error) {
    console.error("Error in getUsersByAdmin:", error);
    return sendErrorResponse(res, 500, "Internal Server Error");
  }
};


export const deleteUserByAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params; // User ID to be deleted
    const adminId = req.user?.userId; // Admin's ID from authenticated request

    // Check if user exists and belongs to the admin
    const user = await Employee.findOne({ _id: id, adminId });

    if (!user) {
      return sendErrorResponse(res, 404, "User not found or unauthorized.");
    }

    // Delete the user
    await Employee.findByIdAndDelete(id);

    return sendSuccessResponse(res, 200, "User deleted successfully.");
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res, 500, "Internal Server Error");
  }
};
