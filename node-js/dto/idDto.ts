
import { z } from "zod";

export const IdSchema = z.object({
    id: z.coerce.number().int().positive({
        message: "L'id doit être un nombre entier positif",
    }),
});

export type IdDTO = z.infer<typeof IdSchema>;
