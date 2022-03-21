import * as z from "zod";

export const helloMessageSchema = z.object({
  type: z.literal("hello"),
  data: z.object({
    protocol: z.literal("relay 1.0"),
  }),
});
export type HelloMessage = z.infer<typeof helloMessageSchema>;

export interface InitMessage {
  type: "init";
}

export const tokenMessageSchema = z.object({
  type: z.literal("token"),
  data: z.object({
    token: z.string().min(1).max(1024),
  }),
});
export type TokenMessage = z.infer<typeof tokenMessageSchema>;

export interface JoinMessage {
  type: "join";
  data: {
    token: string;
  };
}

export const pairedMessageSchema = z.object({
  type: z.literal("paired"),
});
export type PairedMessage = z.infer<typeof pairedMessageSchema>;

export const inRelayMessageSchema = z.union([
  helloMessageSchema,
  tokenMessageSchema,
  pairedMessageSchema,
]);

export type InRelayMessage = z.infer<typeof inRelayMessageSchema>;
export type OutRelayMessage = InitMessage | JoinMessage;
