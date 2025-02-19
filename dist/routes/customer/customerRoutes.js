"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const customerController_1 = require("../../controller/customer/customerController");
const customFieldController_1 = require("../../controller/customer/customFieldController");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = express_1.default.Router();
const asyncHandler = (fn) => (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
};
router.post("/importcustomers", upload.single("file"), authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)("admin", "superadmin"), asyncHandler(customerController_1.importCustomers));
router.post("/customfield", authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)("admin", "superadmin"), asyncHandler(customFieldController_1.addCustomField));
router.get("/customfield", authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)("admin", "superadmin"), asyncHandler(customFieldController_1.getCustomFields));
router.put("/customfield/:id", authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)("admin", "superadmin"), asyncHandler(customFieldController_1.updateCustomField));
router.delete("/customfield/:id", authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)("admin", "superadmin"), asyncHandler(customFieldController_1.deleteCustomField));
router.post("/customer", authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)("admin", "superadmin"), asyncHandler(customerController_1.addCustomer));
router.get('/customer/product', authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)('admin'), asyncHandler(customerController_1.getRenewalReminderList));
router.get("/customer", authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)("admin", "user", "superadmin"), asyncHandler(customerController_1.searchCustomer));
router.delete('/customer/:id', authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)('admin'), asyncHandler(customerController_1.deleteCustomer));
router.put('/customer/:id', authMiddleware_1.authenticateUser, (0, authMiddleware_1.authorizeRoles)('admin'), asyncHandler(customerController_1.updateCustomer));
exports.default = router;
