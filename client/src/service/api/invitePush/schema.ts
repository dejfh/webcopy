import * as z from "zod";

export const invitePushKeysSchema = z.object({
  publicKey: z.string(),
  privateKey: z.string(),
});
export type InvitePushKeys = z.infer<typeof invitePushKeysSchema>;

export const invitePushDataSchema = z.object({
  pushSubscription: z.object({
    endpoint: z.string().optional(),
    expirationTime: z.number().optional().nullable(),
    keys: z.record(z.string()).optional(),
  }),
  keys: invitePushKeysSchema,
});

export type InvitePushData = z.infer<typeof invitePushDataSchema>;
