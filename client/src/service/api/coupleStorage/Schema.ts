import * as z from "zod";

export const coupleStorageSchema = z.array(
  z.object({
    name: z.string(),
    data: z.object({
      endpoint: z.string().optional(),
      expirationTime: z.number().optional().nullable(),
      keys: z.record(z.string()).optional(),
    }),
  })
);
export type CoupleStorage = z.infer<typeof coupleStorageSchema>;
