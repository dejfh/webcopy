import * as z from "zod";
import { messageEvents, nextMessageEvent } from "./messageEvents";

export async function* messages<T>(
  ws: WebSocket,
  schema: z.Schema<T>,
  signal?: AbortSignal
): AsyncGenerator<T> {
  for await (const ev of messageEvents(ws, signal)) {
    yield schema.parse(JSON.parse(ev.data));
  }
}

export async function nextMessage<T>(
  ws: WebSocket,
  schema: z.Schema<T>,
  signal?: AbortSignal
): Promise<T> {
  const ev = await nextMessageEvent(ws, signal);
  return schema.parse(JSON.parse(ev.data));
}
