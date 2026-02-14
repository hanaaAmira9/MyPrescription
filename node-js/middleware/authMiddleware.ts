import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


export interface AuthRequest extends Request {
    user?: {
        id: string;
        role?: string;
        email?: string;
    };
}

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET non défini dans .env");
}


export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    let token: string | undefined;

    if (req.cookies?.access_token) {
        token = req.cookies.access_token;
    }


    const authHeader = req.headers.authorization;
    if (!token && authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({
            error: "Accès refusé",
            message: "Token d'authentification manquant",
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        req.user = {
            id: String(decoded.id ?? decoded.sub),
            role: decoded.role
        };

        next();
    } catch (error) {
        return res.status(401).json({
            error: "Token invalide",
            message: "Le token est expiré ou invalide",
        });
    }
};


export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                error: "Non authentifié",
                message: "Vous devez être authentifié",
            });
        }

        if (!roles.includes(req.user.role || "")) {
            return res.status(403).json({
                error: "Accès interdit",
                message: `Rôle requis : ${roles.join(
                    " ou "
                )}. Votre rôle : ${req.user.role}`,
            });
        }

        next();
    };
};
