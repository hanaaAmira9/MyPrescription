import { Request, Response } from "express";
import { pool } from "../db/pool"; 

export async function listAuditLogs(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(10, Number(req.query.limit || 20)));
  const offset = (page - 1) * limit;

  const { rows } = await pool.query(
    `
    SELECT
      id, ts, event, action, result,
      actor_user_id, actor_role,
      ip, ua, request_id, route,
      metadata
    FROM audit_logs
    ORDER BY ts DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );

  res.json({ page, limit, items: rows });
}
