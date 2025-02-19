import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwtUtils';
import { sendErrorResponse } from '../utils/responseHandler';
import { IUser } from '../utils/interfaces';

// Middleware to verify token
export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    sendErrorResponse(res, 401, 'Access denied. No token provided.');
    return;
  }

  try {
    const decoded = verifyToken(token);
    // console.log("Decoded Tokrn \n",decoded);
    
    if (typeof decoded !== "object" || !decoded.id || !decoded.role) {
      sendErrorResponse(res, 400, "Invalid token payload.");
      return;
    }

    req.user = {
      id: decoded.id,
      role: decoded.role
    } as IUser;

    next();
  } catch (error) {
    // Send a 401 status code indicating that the token is invalid or expired.
    sendErrorResponse(res, 401, 'Invalid or expired token. Please re-login.');
  }
};


// Middleware to check user roles
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendErrorResponse(res, 403, "User authentication required.");
      return
    }
    // console.log(req.user);
    
    if (!roles.includes(req.user.role)) {
      sendErrorResponse(res, 403, "You do not have permission to access this resource.");
      return
    }

    next();
  };
};
