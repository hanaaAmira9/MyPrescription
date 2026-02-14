import { z } from "zod";

const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s-]+$/;

export const CreateUserSchema = z.object({
    email: z.string().trim().toLowerCase().email(),

    password: z.string()
        .min(8, "Le mot de passe doit contenir au moins 8 caractères")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/,
            {
                message:
                    "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un symbole",
            }
        ),

    firstname: z.string()
        .trim()
        .min(2, "Le prénom doit contenir au moins 2 caractères")
        .max(50, "Le prénom doit contenir au maximum 50 caractères")
        .regex(nameRegex, {
            message: "Le prénom doit contenir uniquement des lettres",
        }),

    lastName: z.string()
        .trim()
        .min(2, "Le nom doit contenir au moins 2 caractères")
        .max(50, "Le nom doit contenir au maximum 50 caractères")
        .regex(nameRegex, {
            message: "Le nom doit contenir uniquement des lettres",
        }),


    role: z.enum(["ADMIN", "DOCTOR", "ASSISTANT"]),
});

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
