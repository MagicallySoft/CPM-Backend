import jwt, { SignOptions } from "jsonwebtoken";

// Generate JWT token
export const generateToken = (
  userId: string,
  role: string,
  adminId: string | null = null
): string => {
  // You can adjust the payload based on your requirements
  const payload: any = {
    id: userId,
    role: role
  };

  // If adminId is provided, add it to the payload
  if (adminId) {
    payload.adminId = adminId;
  }
  // console.log("payload------>\n",payload);
  
  const secretKey = process.env.JWT_SECRET_KEY || "CPM@shivansh@123"; // JWT secret key
  // Generate the token with 1-hour expiration
  const token = jwt.sign(payload, secretKey, { expiresIn: "12h" });
  return token;
};

// Verify JWT token
export const verifyToken = (token: string) => {
  const secretKey = process.env.JWT_SECRET_KEY || "your-secret-key";
  return jwt.verify(token, secretKey);
};
