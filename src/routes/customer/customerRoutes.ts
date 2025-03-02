import express from "express";
import { Request, Response, NextFunction } from "express";
import { addProductDetail, listProductDetails, addCustomer, searchCustomer, deleteCustomer, updateCustomer, getProductRenewals, importCustomers } from "../../controller/customer/customerController";
import { addCustomField, getCustomFields, updateCustomField, deleteCustomField } from "../../controller/customer/customFieldController";
import { authenticateUser, authorizeRoles } from "../../middlewares/authMiddleware";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

const asyncHandler = (fn: any) => (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  return Promise.resolve(fn(req, res, next)).catch(next);
}

router.post("/importcustomers", upload.single("file"), authenticateUser, authorizeRoles("admin", "superadmin"),asyncHandler(importCustomers))

router.post("/customfield", authenticateUser, authorizeRoles("admin", "superadmin"), asyncHandler(addCustomField));


router.get("/customfield", authenticateUser, authorizeRoles("admin", "superadmin", "employee"), asyncHandler(getCustomFields));

router.put("/customfield/:id", authenticateUser, authorizeRoles("admin", "superadmin"), asyncHandler(updateCustomField));

router.delete("/customfield/:id", authenticateUser, authorizeRoles("admin", "superadmin"), asyncHandler(deleteCustomField));


router.post("/productDetail", authenticateUser, authorizeRoles("admin", "superadmin"), asyncHandler(addProductDetail));
router.get("/productDetail", authenticateUser, authorizeRoles("admin", "superadmin"), asyncHandler(listProductDetails));


router.post("/customer", authenticateUser, authorizeRoles("admin", "superadmin"), asyncHandler(addCustomer));

router.get('/customer/product', authenticateUser, authorizeRoles('admin', "employee"), asyncHandler(getProductRenewals));

router.get("/customer", authenticateUser, authorizeRoles("admin", "employee", "superadmin"), asyncHandler(searchCustomer));

router.delete('/customer/:id', authenticateUser, authorizeRoles('admin'), asyncHandler(deleteCustomer));

router.put('/customer/:id', authenticateUser, authorizeRoles('admin'), asyncHandler(updateCustomer));



export default router;
