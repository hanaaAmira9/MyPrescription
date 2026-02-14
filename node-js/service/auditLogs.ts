export type AuditResult = "SUCCESS" | "FAIL" | "DENY";
export type AuditAction = "LOGIN" | "LOGOUT" | "REFRESH" | "CREATE" | "READ" | "UPDATE" | "DELETE";
import { pool } from "../db/pool";

export type AuditEvent =
    | "AUTH_LOGIN_SUCCESS"
    | "AUTH_LOGIN_FAILED"
    | "AUTH_LOGOUT"
    | "ACCESS_DENIED";

export interface AuditEntry {
    ts: string;
    event: AuditEvent;
    action: AuditAction;
    result: AuditResult;

    actor: { userId: string | null; role?: string | null };
    ip: string;
    ua: string;
    requestId: string;
    route: string;

    metadata?: Record<string, any>;
}

function redact(metadata?: Record<string, any>) {
    if (!metadata) return metadata;
    const clone = { ...metadata };
    delete clone.password;
    delete clone.token;
    delete clone.accessToken;
    delete clone.refreshToken;
    return clone;
}



export async function auditLog(entry: AuditEntry) {
    const safe = { ...entry, metadata: redact(entry.metadata) };

    try {
        await pool.query(
            `
            INSERT INTO audit_logs (
                ts,
                event,
                action,
                result,
                actor_user_id,
                actor_role,
                ip,
                ua,
                request_id,
                route,
                metadata
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            `,
            [
                safe.ts,
                safe.event,
                safe.action,
                safe.result,
                safe.actor.userId,
                safe.actor.role ?? null,
                safe.ip,
                safe.ua,
                safe.requestId,
                safe.route,
                safe.metadata ? JSON.stringify(safe.metadata) : null,
            ]
        );
    } catch (error) {
        console.error("Audit log DB error:", error);
    }
}
