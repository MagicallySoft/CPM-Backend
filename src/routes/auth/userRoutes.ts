import express from "express";
import { Request, Response, NextFunction } from "express";
import { authenticateUser, authorizeRoles } from '../../middlewares/authMiddleware';

import {registerAdmin, registerStaff} from "../../controller/auth/auth.register"
import {createRegistrationCode} from "../../controller/auth/auth.code"
import {loginUser} from "../../controller/auth/auth.loginUser"

// Wrapper function to catch async errors
const asyncHandler = (fn: any) => (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

const router = express.Router();

router.post("/generatecode", authenticateUser,authorizeRoles("superadmin", "admin"), asyncHandler(createRegistrationCode));

router.post("/registeradmin", asyncHandler(registerAdmin));
router.post("/register", asyncHandler(registerStaff));

router.post('/login', asyncHandler(loginUser));
// router.post('/logout', authenticateUser, asyncHandler(logoutUser));
// router.post('/forgot-password', asyncHandler(forgotPassword));
// router.post('/reset-password', asyncHandler(resetPassword));


export default router;