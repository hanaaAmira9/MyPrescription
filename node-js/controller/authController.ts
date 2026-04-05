import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { generateAccessToken } from "../utils/generateAccToken";
import { findUserByEmail } from "./userController";
import { auditLog } from "../service/auditLogs";
import { getClientIp } from "../middleware/requestContext";
import { pool } from "../db/pool";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/emailService";
import { verifyTOTPToken } from "../utils/totpService";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);

    if (!user) {
      await auditLog({
        ts: new Date().toISOString(),
        event: "AUTH_LOGIN_FAILED",
        action: "LOGIN",
        result: "FAIL",
        actor: { userId: null, role: null },
        ip: getClientIp(req),
        ua: String(req.headers["user-agent"] || ""),
        requestId: (req as any).requestId || "unknown",
        route: "POST /auth/login",
        metadata: { email, reason: "USER_NOT_FOUND" },
      });

      return res.status(401).json({
        error: "Utilisateur non trouvé",
        message: "L'utilisateur avec l'email fourni n'a pas été trouvé.",
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      await auditLog({
        ts: new Date().toISOString(),
        event: "AUTH_LOGIN_FAILED",
        action: "LOGIN",
        result: "FAIL",
        actor: { userId: user.id, role: user.role },
        ip: getClientIp(req),
        ua: String(req.headers["user-agent"] || ""),
        requestId: (req as any).requestId || "unknown",
        route: "POST /auth/login",
        metadata: { email, reason: "BAD_PASSWORD" },
      });

      return res.status(401).json({
        error: "Identifiants invalides",
        message: "Email ou mot de passe incorrect.",
      });
    }

    // --- CHOIX 2FA ---
    if (user.two_factor_enabled) {
      return res.status(200).json({
        requires2FA: true,
        methods: ["totp", "email"],
        email: user.email,
        message: "Sélectionnez une méthode d'authentification.",
      });
    } else {
      return res.status(200).json({
        requires2FA: true,
        methods: ["email"],
        email: user.email,
        message: "Sélectionnez une méthode d'authentification.",
      });
    }
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    return res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur est survenue lors de la connexion.",
    });
  }
};

export const verifyLogin = async (req: Request, res: Response) => {
  try {
    const { email, code, method } = req.body;
    const user = await findUserByEmail(email);

    if (!user) return res.status(401).json({ error: "Utilisateur introuvable" });

    // Selon le choix "totp" ou "email"
    if (method === "totp" && user.two_factor_enabled) {
      if (!user.two_factor_secret) return res.status(500).json({ error: "Erreur 2FA" });
      const isValidTotp = verifyTOTPToken(code, user.two_factor_secret);
      if (!isValidTotp) return res.status(401).json({ error: "Code d'application invalide." });

    } else {
      // Vérification Email OTP
      if (!user.otp_code || !user.otp_expires_at) return res.status(400).json({ error: "Aucun code demandé ou code expiré." });
      if (new Date() > new Date(user.otp_expires_at)) return res.status(401).json({ error: "Le code a expiré. Redemandez-en un." });
      if (user.otp_code !== code) return res.status(401).json({ error: "Code email incorrect." });
      await pool.query("UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = $1", [user.id]);
    }

    // Le 2FA est valide, on génère le token
    const accessToken = generateAccessToken({
      id: user.id,
      role: user.role,
    });

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // Passer à true en production HTTPS
      maxAge: 15 * 60 * 1000,
    });

    await auditLog({
      ts: new Date().toISOString(),
      event: "AUTH_LOGIN_SUCCESS",
      action: "LOGIN",
      result: "SUCCESS",
      actor: { userId: user.id, role: user.role },
      ip: getClientIp(req),
      ua: String(req.headers["user-agent"] || ""),
      requestId: (req as any).requestId || "unknown",
      route: "POST /auth/verify-login",
    });

    return res.json({
      message: "Connexion réussie",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstname: user.firstname,
        lastName: user.lastname,
      },
    });

  } catch (error) {
    console.error("Erreur verifyLogin :", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

export const logout = async (req: Request, res: Response) => {
  await auditLog({
    ts: new Date().toISOString(),
    event: "AUTH_LOGOUT",
    action: "LOGOUT",
    result: "SUCCESS",
    actor: { userId: (req as any).user?.id ?? null },
    ip: getClientIp(req),
    ua: String(req.headers["user-agent"] || ""),
    requestId: (req as any).requestId || "unknown",
    route: "POST /auth/logout",
  });

  res.clearCookie("access_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });

  return res.json({ message: "Déconnexion réussie" });
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await findUserByEmail(email);

        if (!user) {
            return res.json({ message: "Si cet email correspond à un compte, un code a été envoyé." });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await pool.query(
            "UPDATE users SET reset_password_code = $1, reset_password_expires_at = $2 WHERE id = $3",
            [code, expiresAt, user.id]
        );

        await sendPasswordResetEmail(user.email, code, user.firstname);

        return res.json({ message: "Si cet email correspond à un compte, un code a été envoyé." });
    } catch (error) {
        console.error("Erreur forgotPassword :", error);
        return res.status(500).json({ error: "Erreur serveur lors de l'envoi du code." });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, code, newPassword } = req.body;
        
        const result = await pool.query(
            "SELECT id, reset_password_code, reset_password_expires_at FROM users WHERE email = $1 LIMIT 1",
            [email]
        );
        const user = result.rows[0];

        if (!user || !user.reset_password_code || !user.reset_password_expires_at) {
            return res.status(400).json({ error: "Demande invalide ou inexistante." });
        }

        if (user.reset_password_code !== code) {
            return res.status(400).json({ error: "Code de vérification incorrect." });
        }

        if (new Date() > new Date(user.reset_password_expires_at)) {
            return res.status(400).json({ error: "Le code a expiré, veuillez refaire une demande." });
        }

        const password_hash = await bcrypt.hash(newPassword, 12);

        await pool.query(
            "UPDATE users SET password = $1, reset_password_code = NULL, reset_password_expires_at = NULL WHERE id = $2",
            [password_hash, user.id]
        );

        // Optionnel : Audit log du changement de mot de passe
        await auditLog({
            ts: new Date().toISOString(),
            event: "AUTH_PASSWORD_RESET",
            action: "UPDATE",
            result: "SUCCESS",
            actor: { userId: user.id, role: "UNKNOWN" }, // role manquant dans la req result
            ip: getClientIp(req),
            ua: String(req.headers["user-agent"] || ""),
            requestId: (req as any).requestId || "unknown",
            route: "POST /auth/reset-password",
        });

        return res.json({ message: "Votre mot de passe a été mis à jour avec succès." });
    } catch (error) {
        console.error("Erreur resetPassword :", error);
        return res.status(500).json({ error: "Erreur lors de la réinitialisation du mot de passe." });
    }
};

export const sendEmailOTP = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await pool.query(
            "UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3",
            [otpCode, expiresAt, user.id]
        );

        await sendVerificationEmail(user.email, otpCode, user.firstname);

        return res.json({ message: "Code de vérification envoyé sur votre email." });
    } catch (error) {
        console.error("Erreur sendEmailOTP :", error);
        return res.status(500).json({ error: "Erreur lors de l'envoi du code." });
    }
};
