import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { authorizePermission } from "../middleware/permissionMiddleware";
import { writeLimiter } from "../middleware/rateLimit";
import {
    createPatient,
    getPatientsAll,
    updatePatient,
    deletePatient,
} from "../controller/patientController";


const router = Router();

router.get("/", authMiddleware, authorizePermission("patient:read"), writeLimiter, getPatientsAll);
router.post("/", authMiddleware, authorizePermission("patient:create"), writeLimiter, createPatient);
router.put("/:id", authMiddleware, authorizePermission("patient:update"), writeLimiter, updatePatient);
router.delete("/:id", authMiddleware, authorizePermission("patient:delete"), writeLimiter, deletePatient);

export default router;
