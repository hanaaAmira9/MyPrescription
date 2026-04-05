import { pool } from "./db/pool";

async function runMigration() {
    try {
        console.log("Démarrage de la migration...");
        
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255) NULL");
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE");
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10) NULL");
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP NULL");
        
        // Champs pour la fonctionnalité Mot de passe oublié (au cas où)
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_code VARCHAR(10) NULL");
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires_at TIMESTAMP NULL");

        console.log("Migration réussie ! Les colonnes manquantes ont été ajoutées.");
    } catch (error) {
        console.error("Erreur lors de la migration:", error);
    } finally {
        process.exit(0);
    }
}

runMigration();
