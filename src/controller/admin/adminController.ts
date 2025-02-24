import { Request, Response, NextFunction } from "express";
import AdminUser from "../../models/auth/AdminUserModel";
import StaffUser from "../../models/auth/StaffUserModel";
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
    // 1. Fetch all admin users (superadmin and admin)
    const admins = await AdminUser.find(
      {},
      "username email role createdAt updatedAt"
    ).lean();

    // 2. Fetch all staff users (subadmin and employee)
    const staffUsers = await StaffUser.find(
      {},
      "username email role createdAt updatedAt"
    ).lean();

    // 3. Group admins by their role.
    const superadmins = admins.filter((admin) => admin.role === "superadmin");
    const adminUsers = admins.filter((admin) => admin.role === "admin");

    // 4. Group staff users by their nested role.type.
    const subadmins = staffUsers.filter(
      (staff) => staff.role?.type === "subadmin"
    );
    const employees = staffUsers.filter(
      (staff) => staff.role?.type === "employee"
    );

    // 5. Build the final grouping structure.
    const groupedUsers = {
      superadmins,
      admins: adminUsers,
      employees,
      subadmins,
    };

    return sendSuccessResponse(
      res,
      200,
      "Users fetched successfully",
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
    // console.log("User",user)
    if (!user) {
      return sendErrorResponse(res, 403, "Unauthorized access.");
    }

    let adminId: any;

    // Determine the appropriate adminId based on the role of the logged-in user.
    if (user.role === "admin") {
      adminId = user.id; // Admin fetching their own staff
    } else if (user.role === "subadmin") {
      adminId = user.adminId; // Subadmin fetching staff under their parent admin
    } else {
      return sendErrorResponse(
        res,
        403,
        "Access denied. Only admins or subadmins can access this."
      );
    }

    // Fetch staff users for the given adminId, filtering by role type.
    const staffUsers = await StaffUser.find(
      { adminId, "role.type": { $in: ["subadmin", "employee"] } },
      "username email role createdAt updatedAt "
    ).lean();
    // console.log("staffUsers--->", staffUsers)
    // Group the fetched staff users by their role.
    const groupedUsers = {
      subadmins: staffUsers.filter((u) => u.role.type === "subadmin"),
      employees: staffUsers.filter((u) => u.role.type === "employee"),
    };
    // console.log("groupedUsers",groupedUsers)
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
    const user = await StaffUser.findOne({ _id: id, adminId });

    if (!user) {
      return sendErrorResponse(res, 404, "User not found or unauthorized.");
    }

    // Delete the user
    await StaffUser.findByIdAndDelete(id);

    return sendSuccessResponse(res, 200, "User deleted successfully.");
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res, 500, "Internal Server Error");
  }
};
