import { Request, Response } from "express";
import { pool } from "../db/pool";

export async function createPatient(req: Request, res: Response) {
    const { firstName, lastName, dateOfBirth, phone } = req.body;

    try {
        const result = await pool.query(
            `
      INSERT INTO patients (firstname, lastname, dateofbirth, phone)
      VALUES ($1, $2, $3, $4)
      RETURNING id, firstname, lastname, dateofbirth, phone, created_at
      `,
            [firstName, lastName, dateOfBirth, phone]
        );


        res.status(201).json({
            id: result.rows[0].id,
            firstName: result.rows[0].firstname,
            lastName: result.rows[0].lastname,
            dateOfBirth: result.rows[0].dateofbirth,
            phone: result.rows[0].phone,
            createdAt: result.rows[0].created_at,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error createPatient " });
    }
}

export async function getPatientsAll(req: Request, res: Response) {
    try {
        const result = await pool.query(
            `SELECT id, firstname, lastname, dateofbirth, phone, created_at
       FROM patients
       ORDER BY created_at DESC`
        );

        return res.json(
            result.rows.map((p) => ({
                id: p.id,
                firstName: p.firstname,
                lastName: p.lastname,
                dateOfBirth: p.dateofbirth,
                phone: p.phone,
                createdAt: p.created_at,
            }))
        );
    } catch (error) {
        console.error("Error getPatientsAll:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}



export async function getPatientsbyFirstName(req: Request, res: Response) {
    const firstName = String(req.query.firstName || "").trim();

    if (!firstName) {
        return res.status(400).json({ message: "firstName est obligatoire" });
    }

    try {
        // ILIKE = insensible à la casse (Postgres)
        const result = await pool.query(
            `SELECT id, firstname, lastname, dateofbirth, phone, created_at
       FROM patients
       WHERE firstname ILIKE $1
       ORDER BY created_at DESC`,
            [`%${firstName}%`]
        );

        return res.json(
            result.rows.map((p) => ({
                id: p.id,
                firstName: p.firstname,
                lastName: p.lastname,
                dateOfBirth: p.dateofbirth,
                phone: p.phone,
                createdAt: p.created_at,
            }))
        );
    } catch (error) {
        console.error("Error getPatientsbyFirstName:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


export async function updatePatient(req: Request, res: Response) {
    const { id } = req.params;
    const { firstName, lastName, dateOfBirth, phone } = req.body;

    try {
        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;

        if (typeof firstName === "string") {
            fields.push(`firstName = $${i++}`);
            values.push(firstName.trim());
        }
        if (typeof lastName === "string") {
            fields.push(`lastName = $${i++}`);
            values.push(lastName.trim());
        }
        if (typeof dateOfBirth === "string") {
            fields.push(`dateOfBirth = $${i++}`);
            values.push(dateOfBirth);
        }

        if (phone === null || typeof phone === "string") {
            fields.push(`phone = $${i++}`);
            values.push(phone);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: "Aucun champ à mettre à jour" });
        }

        values.push(id);

        const result = await pool.query(
            `
      UPDATE patients
      SET ${fields.join(", ")}
      WHERE id = $${i}
      RETURNING id, firstName, lastName, dateOfBirth, phone, created_at
      `,
            values
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Patient not found" });
        }

        const p = result.rows[0];
        return res.json({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            dateOfBirth: p.dateOfBirth,
            phone: p.phone,
            createdAt: p.created_at,
        });
    } catch (error) {
        console.error("Error updatePatient:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


export async function deletePatient(req: Request, res: Response) {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM patients
       WHERE id = $1
       RETURNING id, firstname, lastname, dateofbirth, phone, created_at`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Patient not found" });
        }

        const p = result.rows[0];
        return res.json({
            message: "Patient deleted",
            patient: {
                id: p.id,
                firstName: p.firstname,
                lastName: p.lastname,
                dateOfBirth: p.dateofbirth,
                phone: p.phone,
                createdAt: p.created_at,
            },
        });
    } catch (error) {
        console.error("Error deletePatient:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}