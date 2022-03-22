import * as z from "zod";

export const textMessageSchema = z.object({
  type: z.literal("text"),
  data: z.object({
    text: z.string(),
  }),
});
export type TextMessage = z.infer<typeof textMessageSchema>;

export const coupleMessageSchema = z.object({
  type: z.literal("couple"),
  data: z.object({
    endpoint: z.string().optional(),
    expirationTime: z.number().optional().nullable(),
    keys: z.record(z.string()).optional(),
  }),
});
export type CoupleMessage = z.infer<typeof coupleMessageSchema>;

export const webcopyMessageSchema = z.union([
  textMessageSchema,
  coupleMessageSchema,
]);
export type WebcopyMessage = z.infer<typeof webcopyMessageSchema>;