import { z } from "zod";

export const CreatePatientSchema = z.object({
    firstName: z.string().trim().min(1).max(50),
    lastName: z.string().trim().min(1).max(50),
    dateOfBirth: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD"),
    phone: z.string().trim().min(5).max(20).optional()
});

export type CreatePatientDTO = z.infer<typeof CreatePatientSchema>;
