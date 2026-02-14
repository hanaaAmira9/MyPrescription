import { z } from "zod";

export const CreateAppointmentSchema = z.object({
    patient_id: z.string().trim().min(1),
    doctor_id: z.string().trim().min(1),
    date_time: z.string().trim().min(1),
    status: z.enum(["SCHEDULED", "CANCELLED", "DONE"]).default("SCHEDULED"),
    reason: z.string().trim().max(255).optional()
});

export type CreateAppointmentDTO = z.infer<typeof CreateAppointmentSchema>;