import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { listAuditLogs } from "../controller/auditlogsController";
import { authorizePermission } from "../middleware/permissionMiddleware";

const router = Router();

router.get("/", authMiddleware, authorizePermission("audit:read"), listAuditLogs);

export default router;
