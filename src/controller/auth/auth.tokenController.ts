import express, { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { IUser } from "../../utils/interfaces";

const router = express.Router();

// Define a custom type for the user object in the request
interface CustomRequest extends Request {
  user?: IUser; // Optional property, can be set to decoded JWT data
}

// Middleware to verify token
export const verifyToken = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): void => {
  const token: any = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ valid: false, message: "No token provided" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET as string,
    (err: any, decoded: any) => {
      if (err) {
        return res.status(401).json({ valid: false, message: "Invalid token" });
      }

      // Assuming decoded token contains IUser data, cast it as IUser
      req.user = decoded as IUser; // Ensure decoded is treated as IUser
      next();
    }
  );
};

// Verify Token Endpoint
router.get(
  "/verify-token",
  verifyToken,
  (req: CustomRequest, res: Response): void => {
    if (req.user) {
      res.json({ valid: true, user: req.user });
    } else {
      res
        .status(400)
        .json({ valid: false, message: "User data not available" });
    }
  }
);

export default router;
