import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { generateAccessToken } from "../utils/generateAccToken";
import { findUserByEmail } from "./userController";
import { auditLog } from "../service/auditLogs";
import { getClientIp } from "../middleware/requestContext";

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

    const accessToken = generateAccessToken({
      id: user.id,
      role: user.role,
    });

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, 
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
      route: "POST /auth/login",
    });

    return res.json({
      message: "Connexion réussie",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstname: user.firstname,
        lastName: user.lastName, 
      },
    });
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);

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
      metadata: { reason: "SERVER_ERROR" },
    });

    return res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur est survenue lors de la connexion.",
    });
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
