import express from "express";
import { Request, Response, NextFunction } from "express";
import { getUsersByAdmin, userList, deleteUserByAdmin} from "../../controller/admin/adminController";
import { authenticateUser, authorizeRoles } from "../../middlewares/authMiddleware";

const router = express.Router();

const asyncHandler = (fn: any) => (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  return Promise.resolve(fn(req, res, next)).catch(next);
}
//change 

router.get("/users", authenticateUser, authorizeRoles("admin", "superadmin"), asyncHandler(getUsersByAdmin));
router.delete('/users/:id', authenticateUser, authorizeRoles("superadmin"), asyncHandler(deleteUserByAdmin));
router.get('/userlist', authenticateUser, authorizeRoles("superadmin"), asyncHandler(userList));



export default router;
