import { Router } from "express";
import { validateBody } from "../middleware/validateMiddleware";
import { LoginSchema, VerifyLoginSchema, ForgotPasswordSchema, ResetPasswordSchema, SendOTPSchema } from "../dto/authDto";
import { login, logout, verifyLogin, forgotPassword, resetPassword, sendEmailOTP } from "../controller/authController";
import { loginLimiter } from "../middleware/rateLimit";
const router = Router();

router.post("/login",loginLimiter, validateBody(LoginSchema), login);
router.post("/verify-login", loginLimiter, validateBody(VerifyLoginSchema), verifyLogin);
router.post("/send-otp", loginLimiter, validateBody(SendOTPSchema), sendEmailOTP);
router.post("/forgot-password", loginLimiter, validateBody(ForgotPasswordSchema), forgotPassword);
router.post("/reset-password", loginLimiter, validateBody(ResetPasswordSchema), resetPassword);
router.post("/logout", logout);
export default router;
