// controllers/auth.controller.ts
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

    // For admin users, check subscription validity
    if (userType === "AdminUser") {
      const now = new Date();
      const subscription = await Subscription.findOne({
        adminId: user._id,
        status: "active",
        startDate: { $lte: now },
        endDate: { $gte: now },
      });

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
      userType === "AdminUser" ? user.role : user.role.type
    );

    // Audit log for the login event
    await AuditLog.create({
      action: "User Login",
      userId: user._id,
      userType,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent") || "",
      timestamp: new Date(),
    });
    // console.log(user);
    
    const userData={
        id:user._id,
        name:user.username,
        email:user.email,
        role:user.role,
        Subscription:user?.Subscription
    }
    // console.log({ token, userData });
    
    return sendSuccessResponse(res, 200, "Login successful", { token, userData });
  } catch (error) {
    console.error("Login Error: ", error);
    return sendErrorResponse(res, 500, "Server error");
  }
};
