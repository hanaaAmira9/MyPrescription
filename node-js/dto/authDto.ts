import { z } from "zod";

export const LoginSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string()
        .min(8, "Le mot de passe doit contenir au moins 8 caractères")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/,
            {
                message:
                    "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un symbole",
            }
        )
});
export type LoginDTO = z.infer<typeof LoginSchema>;

export const VerifyLoginSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    code: z.string().min(6).max(6, "Le code doit contenir 6 caractères"),
    method: z.enum(["totp", "email"]).optional(),
});

export type VerifyLoginDTO = z.infer<typeof VerifyLoginSchema>;

export const Enable2FASchema = z.object({
    token: z.string().min(6).max(6, "Le code TOTP doit contenir 6 caractères"),
});

export type Enable2FADTO = z.infer<typeof Enable2FASchema>;

export const ForgotPasswordSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
});

export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    code: z.string().min(6).max(6, "Le code doit contenir 6 caractères"),
    newPassword: z.string()
        .min(8, "Le mot de passe doit contenir au moins 8 caractères")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/,
            {
                message:
                    "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un symbole",
            }
        )
});

export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>;

export const SendOTPSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
});

export type SendOTPDTO = z.infer<typeof SendOTPSchema>;
