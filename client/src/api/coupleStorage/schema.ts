import * as z from "zod";
import { invitePushDataSchema } from "../invitePush/schema";

export const coupleStorageSchema = z.array(
  z.object({
    name: z.string(),
    data: invitePushDataSchema,
  })
);
export type CoupleStorage = z.infer<typeof coupleStorageSchema>;
