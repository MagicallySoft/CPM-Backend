import express from "express";
import { Request, Response, NextFunction } from "express";
import {
  assignTask,
  getTasksByAdmin,
  getUserTasks,
  updateTask,
  deleteTask,
  updateTaskStatus
} from "../../controller/task/taskController";
import { authenticateUser, authorizeRoles } from "../../middlewares/authMiddleware";

const router = express.Router();

const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Admin routes
router.post("/task", authenticateUser, authorizeRoles("admin"), asyncHandler(assignTask));
router.get("/task/admin", authenticateUser, authorizeRoles("admin"), asyncHandler(getTasksByAdmin));
router.put("/task/:id", authenticateUser, authorizeRoles("admin"), asyncHandler(updateTask));
router.delete("/task/:id", authenticateUser, authorizeRoles("admin"), asyncHandler(deleteTask));

// User routes
router.get("/task/user", authenticateUser, authorizeRoles("user"), asyncHandler(getUserTasks));
router.put("/task/status/:id", authenticateUser, authorizeRoles("user"), asyncHandler(updateTaskStatus));

export default router;
