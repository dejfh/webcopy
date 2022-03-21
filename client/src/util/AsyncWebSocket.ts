import CancellationToken from "cancellationtoken";
import * as z from "zod";
import { withCancel } from "./WithCancel";

function unexpectedMessageHandler(ws: WebSocket): (ev: MessageEvent) => void {
  return (ev) => {
    console.error("Received unexpected message, closing WebSocket.");
    ws.close();
  };
}

export function createWebSocket(
  url: string,
  cancellationToken: CancellationToken
): Promise<WebSocket> {
  return withCancel(cancellationToken, (resolve, reject, onCancelled) => {
    const ws = new WebSocket(url);
    ws.onopen = () => {
      ws.onopen = null;
      ws.onclose = null;
      ws.onerror = null;
      resolve(ws);
    };
    ws.onclose = () => reject();
    ws.onmessage = unexpectedMessageHandler(ws);
    ws.onerror = () => reject(new Error("WebSocket error."));
    onCancelled(() => ws.close());
  });
}

export function nextMessageEvent(
  ws: WebSocket,
  cancellationToken: CancellationToken
): Promise<MessageEvent> {
  return withCancel(cancellationToken, (resolve, reject, onCancelled) => {
    if (ws.readyState !== WebSocket.OPEN) {
      reject(new Error("WebSocket not open."));
    }
    onCancelled(() => ws.close());
    ws.onmessage = (ev) => {
      ws.onmessage = unexpectedMessageHandler(ws);
      ws.onclose = null;
      ws.onerror = null;
      resolve(ev);
    };
    ws.onclose = () => {
      ws.onmessage = unexpectedMessageHandler(ws);
      ws.onclose = null;
      ws.onerror = null;
      reject();
    };
    ws.onerror = () => {
      ws.onmessage = unexpectedMessageHandler(ws);
      ws.onclose = null;
      ws.onerror = null;
      reject(new Error("WebSocket error."));
    };
  });
}

export async function nextMessage<T>(
  ws: WebSocket,
  schema: z.Schema<T>,
  cancellationToken: CancellationToken
): Promise<T> {
  const ev = await nextMessageEvent(ws, cancellationToken);
  return schema.parse(JSON.parse(ev.data));
}
