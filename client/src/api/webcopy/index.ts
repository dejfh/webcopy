import { messages } from "../../util/AsyncWebSocket";
import { InvitePushData } from "../invitePush/schema";
import * as schema from "./schema";

export async function loop(
  ws: WebSocket,
  ontext: (text: string) => void,
  oncouple: (data: any) => void,
  signal?: AbortSignal
): Promise<void> {
  for await (const msg of messages(ws, schema.webcopyMessageSchema, signal)) {
    if (msg.type === "text") {
      ontext(msg.data.text);
    }
    if (msg.type === "couple") {
      oncouple(msg.data);
    }
  }
}

export function sendText(ws: WebSocket, text: string) {
  send(ws, { type: "text", data: { text } });
}

export function sendCouple(ws: WebSocket, data: InvitePushData) {
  send(ws, { type: "couple", data });
}

function send(ws: WebSocket, msg: schema.WebcopyMessage) {
  ws.send(JSON.stringify(msg));
}
