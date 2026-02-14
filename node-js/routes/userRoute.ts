import { Router } from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getMe,
  getDoctors,
} from "../controller/userController";

import { validateBody, validateQuery } from "../middleware/validateMiddleware";
import { authMiddleware } from "../middleware/authMiddleware";
import { CreateUserSchema } from "../dto/UserDto";
import { IdSchema } from "../dto/idDto";
import { authorizePermission } from "../middleware/permissionMiddleware";

const router = Router();

router.get("/me", authMiddleware, authorizePermission("user:read_me"), getMe);
router.get("/doctors", authMiddleware, authorizePermission("user:read"), getDoctors);
router.post("/", validateBody(CreateUserSchema), createUser);
router.get("/", authMiddleware, authorizePermission("user:read"), getUsers);
router.get("/:id", validateQuery(IdSchema), authMiddleware, authorizePermission("user:read"), getUserById);

router.put("/:id", validateQuery(IdSchema), authMiddleware, authorizePermission("user:read"), updateUser);
router.delete("/:id", validateQuery(IdSchema), authMiddleware, authorizePermission("user:read"), deleteUser);

export default router;
