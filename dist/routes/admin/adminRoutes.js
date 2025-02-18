"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../../controller/admin/adminController");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = express_1.default.Router();
const asyncHandler = (fn) => (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
};
//change 
router.get("/users", authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)("admin", "superadmin"), asyncHandler(adminController_1.getUsersByAdmin));
router.delete('/users/:id', authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)("superadmin"), asyncHandler(adminController_1.deleteUserByAdmin));
router.get('/userlist', authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)("superadmin"), asyncHandler(adminController_1.userList));
exports.default = router;
