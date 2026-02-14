// src/routes/appointment.routes.ts
import { Router } from "express";
import {
    createAppointment,
    deleteAppointment,
    getAppointmentById,
    getAppointmentsByStatusDone,
    listAppointments,
    updateAppointmentStatus,        
    updateAppointment,
    getAppointmentsByStatusCancelled,
    getAppointmentsByStatusScheduled,
} from "../controller/appointmentController";
import { authMiddleware } from "../middleware/authMiddleware";
import { authorizePermission } from "../middleware/permissionMiddleware";
const router = Router();


router.post("/", authMiddleware, authorizePermission("appointment:create"), createAppointment);

router.get("/status/done", authMiddleware, authorizePermission("appointment:read"), getAppointmentsByStatusDone);
router.get("/status/cancelled", authMiddleware, authorizePermission("appointment:read"), getAppointmentsByStatusCancelled);
router.get("/status/scheduled", authMiddleware, authorizePermission("appointment:read"), getAppointmentsByStatusScheduled);

router.get("/", authMiddleware, authorizePermission("appointment:read"), listAppointments);
router.get("/:id", authMiddleware, authorizePermission("appointment:read"), getAppointmentById);
router.patch("/:id/status", authMiddleware, authorizePermission("appointment:update"), updateAppointmentStatus);
router.patch("/:id", authMiddleware, authorizePermission("appointment:update"), updateAppointment);
router.delete("/:id", authMiddleware, authorizePermission("appointment:delete"), deleteAppointment);




export default router;
