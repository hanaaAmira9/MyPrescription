import { AuthRequest } from "./authMiddleware";
import { Response, NextFunction } from "express";

export type Role = "ADMIN" | "DOCTOR" | "ASSISTANT";

export type Permission =
  | "patient:read"
  | "patient:create"
  | "patient:update"
  | "patient:delete"
  | "user:read_me"
  | "audit:read"
  | "appointment:read"
  | "appointment:create"
  | "appointment:update"
  | "appointment:delete"
  | "user:read"
  ;

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: ["patient:read", "patient:create", "patient:update", "patient:delete", "user:read_me", "audit:read", "appointment:read", "appointment:create", "appointment:update", "appointment:delete", "user:read"],
  DOCTOR: ["patient:read", "patient:update", "user:read_me", "appointment:read", "user:read"],
  ASSISTANT: ["patient:read", "patient:create", "patient:update", "patient:delete", "user:read_me", "appointment:read", "appointment:create", "appointment:update", "appointment:delete", "user:read"],
};


export function getUserRole(req: AuthRequest): Role | null {
  const role = req.user?.role;
  if (!role) return null;
  if (role === "ADMIN" || role === "DOCTOR" || role === "ASSISTANT") return role;
  return null;
}


export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}


export const authorizePermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const role = getUserRole(req);
    if (!role) {
      return res.status(403).json({ error: "Rôle invalide" });
    }

    if (!can(role, permission)) {
      return res.status(403).json({
        error: "Accès interdit",
        message: `Permission requise: ${permission}. Votre rôle: ${role}`,
      });
    }

    next();
  };
};
