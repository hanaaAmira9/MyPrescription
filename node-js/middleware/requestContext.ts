import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export function requestContext(req: Request, res: Response, next: NextFunction) {
    const requestId =
        (req.headers["x-request-id"] as string) ||
        `req_${crypto.randomBytes(12).toString("hex")}`;

    (req as any).requestId = requestId;
    res.setHeader("x-request-id", requestId);

    next();
}

export function getClientIp(req: Request) {
    const xf = req.headers["x-forwarded-for"];
    if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim();
    return req.socket.remoteAddress || "unknown";
}
