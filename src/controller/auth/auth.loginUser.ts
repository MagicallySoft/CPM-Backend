// controllers/auth/auth.controller.ts
import bcrypt from "bcryptjs";
import StaffUser from "../../models/auth/StaffUserModel";
import AdminUser from "../../models/auth/AdminUserModel";
import AuditLog from "../../models/auth/AuditLog";
import Subscription from "../../models/auth/SubscriptionModel";
import { Request, Response } from "express";
import { generateToken } from "../../utils/jwtUtils";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/responseHandler";

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password, mfaCode, isAdmin } = req.body;
    // console.log({ email, password, mfaCode, isAdmin });
    
    // Validate required fields
    if (!email || !password) {
      return sendErrorResponse(res, 400, "Email and password are required");
    }

    let user: any;
    let userType: string;

    // If isAdmin flag is true, look up in AdminUser; else, in StaffUser
    if (isAdmin === true || isAdmin === "true") {
      user = await AdminUser.findOne({ email });
      userType = "AdminUser";
    } else {
      user = await StaffUser.findOne({ email });
      userType = "StaffUser";
    }
    // console.log("user--->", user);
    if (!user) {
      return sendErrorResponse(res, 401, "Invalid credentials");
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      return sendErrorResponse(
        res,
        403,
        "Account is temporarily locked. Please try again later."
      );
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return sendErrorResponse(res, 401, "Invalid credentials");
    }

    // Reset login attempts if necessary
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // Update login activity: mark as logged in and update lastLogin timestamp
    user.lastLogin = new Date();
    user.IsLogin = true;
    await user.save();

    // For admin users, check subscription validity
    if (userType === "AdminUser") {
      const now = new Date();
      const subscription = await Subscription.findOne({
        adminId: user._id,
        status: "active",
        startDate: { $lte: now },
        endDate: { $gte: now },
      });
      
      // console.log("subscription--->", subscription);
      
      if (!subscription) {
        return sendErrorResponse(
          res,
          403,
          "Subscription expired or inactive. Please renew your subscription."
        );
      }
    }

    // Optionally check MFA if enabled (using a library like speakeasy)
    if (user.mfaSecret) {
      // if (!validateMfaCode(user.mfaSecret, mfaCode)) {
      //   return sendErrorResponse(res, 401, "Invalid MFA code");
      // }
    }

    // Generate JWT token
    const token = generateToken(
      user._id.toString(),
      userType === "AdminUser" ? user.role : user.role.type,
      user.adminId?.toString()
    );

    // Audit log for the login event
    // await AuditLog.create({
    //   action: "User Login",
    //   userId: user._id,
    //   userType,
    //   ipAddress: req.ip,
    //   userAgent: req.get("User-Agent") || "",
    //   timestamp: new Date(),
    // });
    // console.log(user);
    
    const userData={
        id:user._id,
        name:user.username,
        email:user.email,
        role:userType === "AdminUser" ? user.role : user.role.type,
        Subscription:user?.Subscription
    }
    // console.log({ token, userData });
    
    return sendSuccessResponse(res, 200, "Login successful", { token, userData });
  } catch (error) {
    console.error("Login Error: ", error);
    return sendErrorResponse(res, 500, "Server error");
  }
};


export const logoutUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    console.log(user);
    
    if (!user) {
      return sendErrorResponse(res, 403, "Unauthorized access");
    }

    // Update user status to mark as logged out
    user.IsLogin = false;
    await user.save();

    

    // Audit log for the logout event
    // await AuditLog.create({
    //   action: "User Logout",
    //   userId: user._id,
    //   userType: user.role === "admin" || user.role === "superadmin" ? "AdminUser" : "StaffUser",
    //   ipAddress: req.ip,
    //   userAgent: req.get("User-Agent") || "",
    //   timestamp: new Date(),
    // });

    return sendSuccessResponse(res, 200, "Logout successful", {});
  } catch (error) {
    console.error("Logout Error: ", error);
    return sendErrorResponse(res, 500, "Server error");
  }
};
