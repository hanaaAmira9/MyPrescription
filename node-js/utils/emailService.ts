import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", 
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});


export const sendVerificationEmail = async (to: string, code: string, userFirstname: string) => {
    try {
        const mailOptions = {
            from: `"MyPrescription Sécurité" <${process.env.SMTP_USER || "no-reply@myprescription.app"}>`,
            to,
            subject: "Votre code de vérification - MyPrescription",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #2b7a78;">Vérification de connexion</h2>
                    <p>Bonjour ${userFirstname},</p>
                    <p>Une nouvelle tentative de connexion a été détectée sur votre compte. Veuillez utiliser le code ci-dessous pour vérifier votre identité :</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #17252a; background-color: #f2f2f2; padding: 15px 30px; border-radius: 5px;">
                            ${code}
                        </span>
                    </div>
                    <p>Ce code expirera dans 10 minutes.</p>
                    <p style="color: #888; font-size: 12px; margin-top: 40px;">Si vous n'avez pas tenté de vous connecter, veuillez changer votre mot de passe immédiatement.</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email envoyé avec succès :", info.messageId);
        return true;
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email OTP :", error);
        return false;
    }
};

/**
 * Envoie un email pour la réinitialisation du mot de passe
 */
export const sendPasswordResetEmail = async (to: string, code: string, userFirstname: string) => {
    try {
        const mailOptions = {
            from: `"MyPrescription Sécurité" <${process.env.SMTP_USER || "no-reply@myprescription.app"}>`,
            to,
            subject: "Réinitialisation de votre mot de passe - MyPrescription",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #2b7a78;">Réinitialisation de mot de passe</h2>
                    <p>Bonjour ${userFirstname},</p>
                    <p>Vous avez demandé à réinitialiser votre mot de passe. Voici votre code à 6 chiffres :</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #17252a; background-color: #f2f2f2; padding: 15px 30px; border-radius: 5px;">
                            ${code}
                        </span>
                    </div>
                    <p>Ce code est valide pendant 15 minutes.</p>
                    <p style="color: #888; font-size: 12px; margin-top: 40px;">Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email de réinitialisation envoyé avec succès :", info.messageId);
        return true;
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email de réinitialisation :", error);
        return false;
    }
};
