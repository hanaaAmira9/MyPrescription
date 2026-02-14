
import { Request, Response, NextFunction } from "express";
import { pool } from "../db/pool";
import { AppointmentStatus } from "../Models/Appointment";


const isValidStatus = (s: any): s is AppointmentStatus =>
    s === "SCHEDULED" || s === "CANCELLED" || s === "DONE";

export const createAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { patient_id, doctor_id, date_time, reason } = req.body;

        if (!patient_id || !doctor_id || !date_time) {
            return res.status(400).json({
                error: "Validation",
                message: "patient_id, doctor_id, date_time sont obligatoires",
            });
        }

        const q = `
      INSERT INTO appointment (patient_id, doctor_id, date_time, reason)
      VALUES ($1, $2, $3, $4)
      RETURNING id, patient_id, doctor_id, date_time, status, reason, created_at
    `;

        const values = [patient_id, doctor_id, date_time, reason ?? null];
        const result = await pool.query(q, values);

        return res.status(201).json(result.rows[0]);
    } catch (err: any) {

        if (err?.code === "23503") {
            return res.status(400).json({
                error: "Foreign key",
                message: "patient_id ou doctor_id invalide (référence inexistante)",
            });
        }
        next(err);
    }
};

export const getAppointmentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const q = `
      SELECT id, patient_id, doctor_id, date_time, status, reason, created_at
      FROM appointment
      WHERE id = $1
    `;
        const result = await pool.query(q, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Not found", message: "Appointment introuvable" });
        }

        return res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
};

export const listAppointments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // filtres optionnels
        const { patient_id, doctor_id, from, to } = req.query;

        // Construction query dynamique (propre + paramétrée)
        const where: string[] = [];
        const values: any[] = [];

        if (patient_id) {
            values.push(patient_id);
            where.push(`patient_id = $${values.length}`);
        }
        if (doctor_id) {
            values.push(doctor_id);
            where.push(`doctor_id = $${values.length}`);
        }
        if (from) {
            values.push(from);
            where.push(`date_time >= $${values.length}`);
        }
        if (to) {
            values.push(to);
            where.push(`date_time <= $${values.length}`);
        }

        const q = `
      SELECT id, patient_id, doctor_id, date_time, status, reason, created_at
      FROM appointment
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY date_time DESC
    `;

        const result = await pool.query(q, values);
        return res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

export const getAppointmentsByStatusDone = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const status = "DONE";

        if (!isValidStatus(status)) {
            return res.status(400).json({
                error: "Validation",
                message: "status doit être: SCHEDULED | CANCELLED | DONE",
            });
        }

        const q = `
      SELECT id, patient_id, doctor_id, date_time, status, reason, created_at
      FROM appointment
      WHERE status = $1
      ORDER BY date_time DESC
    `;
        const result = await pool.query(q, [status]);

        return res.json(result.rows);
    } catch (err) {
        next(err);
    }
};
export const getAppointmentsByStatusCancelled = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const status = "CANCELLED";

        if (!isValidStatus(status)) {
            return res.status(400).json({
                error: "Validation",
                message: "status doit être: SCHEDULED | CANCELLED | DONE",
            });
        }

        const q = `
      SELECT id, patient_id, doctor_id, date_time, status, reason, created_at
      FROM appointment
      WHERE status = $1
      ORDER BY date_time DESC
    `;
        const result = await pool.query(q, [status]);

        return res.json(result.rows);
    } catch (err) {
        next(err);
    }
};
export const getAppointmentsByStatusScheduled = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const status = "SCHEDULED";

        if (!isValidStatus(status)) {
            return res.status(400).json({
                error: "Validation",
                message: "status doit être: SCHEDULED | CANCELLED | DONE",
            });
        }

        const q = `
      SELECT id, patient_id, doctor_id, date_time, status, reason, created_at
      FROM appointment
      WHERE status = $1
      ORDER BY date_time DESC
    `;
        const result = await pool.query(q, [status]);

        return res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

export const updateAppointmentStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!isValidStatus(status)) {
            return res.status(400).json({
                error: "Validation",
                message: "status doit être: SCHEDULED | CANCELLED | DONE",
            });
        }

        const q = `
      UPDATE appointment
      SET status = $1
      WHERE id = $2
      RETURNING id, patient_id, doctor_id, date_time, status, reason, created_at
    `;
        const result = await pool.query(q, [status, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Not found", message: "Appointment introuvable" });
        }

        return res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
};

export const updateAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { date_time, reason } = req.body;

        if (!date_time && reason === undefined) {
            return res.status(400).json({
                error: "Validation",
                message: "Au moins un champ à modifier: date_time ou reason",
            });
        }

        const q = `
      UPDATE appointment
      SET
        date_time = COALESCE($1, date_time),
        reason = COALESCE($2, reason)
      WHERE id = $3
      RETURNING id, patient_id, doctor_id, date_time, status, reason, created_at
    `;

        const result = await pool.query(q, [date_time ?? null, reason ?? null, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Not found", message: "Appointment introuvable" });
        }

        return res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
};

export const deleteAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const q = `DELETE FROM appointment WHERE id = $1 RETURNING id`;
        const result = await pool.query(q, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Not found", message: "Appointment introuvable" });
        }

        // 204 = no content (pro)
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
};
