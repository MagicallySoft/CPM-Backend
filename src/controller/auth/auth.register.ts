// controllers/auth/auth.controller.ts
import { Request, Response } from "express";
import AdminUser from "../../models/auth/AdminUserModel";
import Subscription from "../../models/auth/SubscriptionModel";
import AuditLog from "../../models/auth/AuditLog";
import Code from "../../models/auth/codeModel"
import StaffUser from "../../models/auth/StaffUserModel"
import { processPayment } from "../../utils/payment"; // Your payment gateway integration
import { sendSuccessResponse, sendErrorResponse } from "../../utils/responseHandler";

export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { username, email, password, subscriptionPlan, paymentDetails } = req.body;
    // console.log(req.body)
    // Validate required fields
    if (!username || !email || !password || !subscriptionPlan || !paymentDetails) {
      return sendErrorResponse(res, 400, "All fields are required", {
        missingFields: {
          username: !username,
          email: !email,
          password: !password,
          subscriptionPlan: !subscriptionPlan,
          paymentDetails: !paymentDetails,
        },
      });
    }

    // Additional validations (for example, validate email format or password strength) can be added here.

    // Check if the email already exists
    const existingAdmin = await AdminUser.findOne({ email });
    if (existingAdmin) {
      return sendErrorResponse(res, 400, "Email is already registered");
    }

    // 1. Process Payment
    const paymentResult = await processPayment(paymentDetails, subscriptionPlan);
    if (!paymentResult.success) {
      return sendErrorResponse(res, 400, "Payment failed", paymentResult.error);
    }

    // 2. Calculate Subscription End Date Based on Plan
    const now = new Date();
    let endDate: Date;
    if (subscriptionPlan === "monthly") {
      endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (subscriptionPlan === "yearly") {
      endDate = new Date(now);
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      return sendErrorResponse(res, 400, "Invalid subscription plan");
    }

    // 3. Create AdminUser record (with Subscription field explicitly set to "active")
    const newAdmin = await AdminUser.create({
      username,
      email,
      password,
      role: "admin",
      Subscription: "active", // Explicitly set subscription status to active
    });

    // 4. Create Subscription record for the admin
    const subscription = await Subscription.create({
      adminId: newAdmin._id,
      plan: subscriptionPlan,
      startDate: now,
      endDate: endDate,
      status: "active", // Initially active; a scheduled job can later mark it as inactive/expired
      paymentInfo: paymentResult.transactionData,
    });

    // (Optional) Update AdminUser's Subscription field explicitly if needed
    newAdmin.Subscription = "active";
    await newAdmin.save();

    // 5. Create Audit Log for registration
    await AuditLog.create({
      action: "Admin Registration",
      userId: newAdmin._id,
      userType: "AdminUser",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent") || "",
      timestamp: new Date(),
    });

    // 6. (Optional) Generate JWT token
    // const token = jwt.sign({ id: newAdmin._id, role: newAdmin.role }, JWT_SECRET, { expiresIn: "1h" });
    // const responseData = { token, newAdmin };
    const newAdminData = {
      id: newAdmin._id,
      username,
      email,
      role: "admin",
      Subscription:newAdmin.Subscription
    }

    // 7. Return success response
    return sendSuccessResponse(res, 201, "Registration successful", newAdminData);
  } catch (error) {
    console.error("Register Admin Error: ", error);
    return sendErrorResponse(res, 500, "Server error");
  }
};

export const registerStaff = async (req: Request, res: Response) => {
  try {
    const { username, email, password, registrationCode } = req.body;
    // console.log({ username, email, password, registrationCode });
    
    // Validate required fields
    if (!username || !email || !password || !registrationCode) {
      return sendErrorResponse(res, 400, "Missing required fields", {
        missingFields: {
          username: !username,
          email: !email,
          password: !password,
          registrationCode: !registrationCode,
        },
      });
    }

    // Optionally, validate email format and password strength here

    // Check if the email is already registered (optional but recommended)
    const existingStaff = await StaffUser.findOne({ email });
    if (existingStaff) {
      return sendErrorResponse(res, 400, "Email is already registered");
    }

    // 1. Validate invitation code
    const codeRecord = await Code.findOne({ code: registrationCode, used: false });
    if (!codeRecord) {
      return sendErrorResponse(res, 400, "Invalid or expired registration code");
    }

    // 2. Create StaffUser record
    const newStaff = await StaffUser.create({
      username,
      email,
      password,
      role: {
        type: codeRecord.assignedToRole, // "subadmin" or "employee"
        designation: codeRecord.designation || null,
        permissions: {
          canAddCustomer: false,
          canUpdateCustomer: false,
          canDeleteCustomer: false,
          canPartialUpdateCustomer: false,
        },
      },
      adminId: codeRecord.createdBy, // Link the staff user to the parent admin
      registrationCode: registrationCode,
    });

    // 3. Mark code as used
    codeRecord.used = true;
    await codeRecord.save();

    // 4. Create Audit Log for registration
    await AuditLog.create({
      action: "Staff Registration",
      userId: newStaff._id,
      userType: "StaffUser",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent") || "",
      timestamp: new Date(),
    });

    // 5. Send welcome email to the staff user (optional)
    // const welcomeEmail = new Email();
    // welcomeEmail.to(newStaff.email);
    // welcomeEmail.subject("Welcome to [Your Company Name]");
    // welcomeEmail.htmlBody("Your welcome email content");
    // await welcomeEmail.send();
    // console.log("Welcome email sent to:", newStaff.email);
    
    const newStaffData = {
      id: newStaff._id,
      username: newStaff.username,
      email: newStaff.email,
      role: newStaff.role.type,
      designation: newStaff.role.designation,

    }
    
    
    return sendSuccessResponse(res, 201, "Registration successful", newStaffData);
  } catch (error: any) {
    console.error("Register Staff Error:", error);
    return sendErrorResponse(res, 500, "Server error", { error: error.message });
  }
};