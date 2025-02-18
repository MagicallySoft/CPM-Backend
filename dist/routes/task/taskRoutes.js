"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const taskController_1 = require("../../controller/task/taskController");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = express_1.default.Router();
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
// Admin routes
router.post("/task", authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)("admin"), asyncHandler(taskController_1.assignTask));
router.get("/task/admin", authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)("admin"), asyncHandler(taskController_1.getTasksByAdmin));
router.put("/task/:id", authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)("admin"), asyncHandler(taskController_1.updateTask));
router.delete("/task/:id", authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)("admin"), asyncHandler(taskController_1.deleteTask));
// User routes
router.get("/task/user", authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)("user"), asyncHandler(taskController_1.getUserTasks));
router.put("/task/status/:id", authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)("user"), asyncHandler(taskController_1.updateTaskStatus));
exports.default = router;
