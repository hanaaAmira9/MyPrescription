import { Router } from "express";
import { validateBody } from "../middleware/validateMiddleware";
import { LoginSchema } from "../dto/authDto";
import { login, logout } from "../controller/authController";
import { loginLimiter } from "../middleware/rateLimit";
const router = Router();

router.post("/login",loginLimiter, validateBody(LoginSchema), login);
router.post("/logout", logout);
export default router;
