import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import db from "./config/db/db";
import userRoutes from "./routes/auth/userRoutes";
import customerRoutes from "./routes/customer/customerRoutes";
import adminRoutes from "./routes/admin/adminRoutes";
import tokenRoutes from "./controller/auth/auth.tokenController";
import taskRoutes from "./routes/task/taskRoutes";
import { AppError  } from "./utils/AppError";
import { sendErrorResponse } from "./utils/responseHandler";
import cors from "cors";

dotenv.config();
db;

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  // origin: "*", // Allow requests only from this origin
  origin: ["https://cpm-frontend.vercel.app", "http://localhost:5173"], // Allow requests only from this origin
  methods: ["GET", "POST", "PUT", "DELETE"], // Allow specific HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"] // Allow specific headers
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", userRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/users", tokenRoutes);
app.use("/api", adminRoutes);
app.use("/api", taskRoutes);

// Global Error Handling Middleware
app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  sendErrorResponse(res, err.statusCode || 500, err.message || "Internal Server Error");
});

import "./jobs/subscriptionScheduler";

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
