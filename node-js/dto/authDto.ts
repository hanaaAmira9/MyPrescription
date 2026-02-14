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
