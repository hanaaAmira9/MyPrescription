import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { CreateUserDTO } from "../dto/UserDto";
import { AuthRequest } from "../middleware/authMiddleware";
import { pool } from "../db/pool";
import { generateTOTPSecret, generateQRCode, verifyTOTPToken } from "../utils/totpService";


export async function createUser(req: Request, res: Response) {
    const { email, password, firstname, lastName, role } = req.body;

    try {

        const existing = await pool.query(
            `SELECT id FROM users WHERE email = $1 LIMIT 1`,
            [email]
        );
        if (existing.rowCount && existing.rowCount > 0) {
            return res.status(409).json({ message: "Email déjà utilisé" });
        }


        const password_hash = await bcrypt.hash(password, 12);


        const result = await pool.query(
            `
      INSERT INTO users (email, password, firstname, lastname, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, firstname, lastname, role, created_at
      `,
            [email, password_hash, firstname, lastName, role]
        );

        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


export async function getUsers(req: Request, res: Response) {
    try {
        const result = await pool.query(
            `SELECT id, email, firstname, lastname, role, created_at
       FROM users
       ORDER BY created_at DESC`
        );
        return res.json(result.rows);
    } catch (error) {
        console.error("Error getting users:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


export async function getUserById(req: Request, res: Response) {
    try {
        const result = await pool.query(
            `SELECT id, email, firstname, lastname, role, created_at
       FROM users
       WHERE id = $1`,
            [req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error("Error getting user by id:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function findUserByEmail(email: string) {
    const result = await pool.query(
        `SELECT id, email, password, firstname, lastname, role, two_factor_secret, two_factor_enabled, otp_code, otp_expires_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
        [email]
    );

    return result.rows[0] || null;
}

export async function findUserById(id: string) {
    const result = await pool.query(
        `SELECT id, email, password, firstname, lastname, role, created_at, two_factor_secret, two_factor_enabled, otp_code, otp_expires_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
        [id]
    );
    return result.rows[0] || null;
}

export async function getMe(req: AuthRequest, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({
            error: "Unauthorized",
            message: "Non authentifié",
        });
    }

    try {
        const result = await pool.query(
            `SELECT id, email, firstname, lastname, role, created_at
       FROM users
       WHERE id = $1`,
            [userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Utilisateur introuvable" });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error("Error in getMe:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function updateUser(req: Request, res: Response) {
    const body = req.body as Partial<CreateUserDTO>;

    try {
        let password_hash: string | undefined;
        if (body.password) {
            password_hash = await bcrypt.hash(body.password, 12);
        }

        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;

        if (body.email) {
            fields.push(`email = $${i++}`);
            values.push(body.email);
        }
        if (typeof body.firstname === "string") {
            fields.push(`firstname = $${i++}`);
            values.push(body.firstname);
        }

        if ((body as any).lastName) {
            fields.push(`lastname = $${i++}`);
            values.push((body as any).lastName);
        }
        if ((body as any).role) {
            fields.push(`role = $${i++}`);
            values.push((body as any).role);
        }
        if (password_hash) {
            fields.push(`password = $${i++}`);
            values.push(password_hash);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: "Aucun champ à mettre à jour" });
        }

        values.push(req.params.id);

        const result = await pool.query(
            `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${i}
      RETURNING id, email, firstname, lastname, role, created_at
      `,
            values
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


export async function deleteUser(req: Request, res: Response) {
    try {
        const result = await pool.query(
            `DELETE FROM users
       WHERE id = $1
       RETURNING id, email, firstname, lastname, role, created_at`,
            [req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({ message: "User deleted", user: result.rows[0] });
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function getDoctors(req: Request, res: Response) {
    try {
        const result = await pool.query(`
  SELECT id, email, firstname, lastname, role, created_at
  FROM users
  WHERE role = 'DOCTOR'
  ORDER BY created_at DESC 
`);
        return res.json(result.rows);
    } catch (error) {
        console.error("Error getting users:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function generate2FA(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Non authentifié" });

        const user = await findUserById(userId);
        if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

        const { secret, otpauthUrl } = generateTOTPSecret(user.email);
        const qrCodeDataUrl = await generateQRCode(otpauthUrl);

        await pool.query(
            "UPDATE users SET two_factor_secret = $1 WHERE id = $2",
            [secret, userId]
        );

        return res.json({ secret, qrCode: qrCodeDataUrl });
    } catch (error) {
        console.error("Erreur generate2FA:", error);
        return res.status(500).json({ message: "Erreur lors de la génération 2FA" });
    }
}

export async function enable2FA(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { token } = req.body;

        if (!userId) return res.status(401).json({ message: "Non authentifié" });

        const user = await findUserById(userId);
        if (!user || !user.two_factor_secret) {
            return res.status(400).json({ message: "2FA non initialisé" });
        }

        const isValid = verifyTOTPToken(token, user.two_factor_secret);
        if (!isValid) {
            return res.status(400).json({ message: "Code TOTP invalide" });
        }

        await pool.query(
            "UPDATE users SET two_factor_enabled = true WHERE id = $1",
            [userId]
        );

        return res.json({ message: "Authentification à deux facteurs activée avec succès" });
    } catch (error) {
        console.error("Erreur enable2FA:", error);
        return res.status(500).json({ message: "Erreur lors de l'activation 2FA" });
    }
}
