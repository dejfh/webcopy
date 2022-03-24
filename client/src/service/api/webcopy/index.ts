import CancellationToken from "cancellationtoken";
import { nextMessage } from "../../util/AsyncWebSocket";
import { InvitePushData } from "./../invitePush/schema";
import * as schema from "./schema";

export async function loop(
  ws: WebSocket,
  ontext: (text: string) => void,
  oncouple: (data: any) => void,
  cancellationToken: CancellationToken
): Promise<void> {
  try {
    while (true) {
      const msg = await nextMessage(
        ws,
        schema.webcopyMessageSchema,
        cancellationToken
      );
      if (msg.type === "text") {
        ontext(msg.data.text);
      }
      if (msg.type === "couple") {
        oncouple(msg.data);
      }
    }
  } catch (err) {
    if (err) {
      throw err;
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
