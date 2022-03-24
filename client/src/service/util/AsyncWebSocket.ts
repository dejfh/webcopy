import CancellationToken from "cancellationtoken";
import * as z from "zod";
import { withCancel } from "./WithCancel";

export function createWebSocket(
  url: string,
  cancellationToken: CancellationToken
): Promise<WebSocket> {
  return withCancel(cancellationToken, (resolve, reject, onCancelled) => {
    const ws = new WebSocket(url);

    onCancelled(() => ws.close());
    ws.onopen = () => {
      resetHandlers(ws);
      resolve(ws);
    };
    ws.onmessage = unexpectedMessageHandler(ws);
    ws.onclose = () => {
      resetHandlers(ws);
      reject();
    };
    ws.onerror = () => {
      resetHandlers(ws);
      reject(new Error("WebSocket error."));
    };
  });
}

export function nextMessageEvent(
  ws: WebSocket,
  cancellationToken: CancellationToken
): Promise<MessageEvent> {
  if (ws.readyState !== WebSocket.OPEN) {
    return Promise.reject(
      new Error(`WebSocket not open, state was ${ws.readyState}.`)
    );
  }
  return withCancel(cancellationToken, (resolve, reject, onCancelled) => {
    onCancelled(() => ws.close());
    ws.onmessage = (ev) => {
      resetHandlers(ws);
      resolve(ev);
    };
    ws.onclose = () => {
      resetHandlers(ws);
      reject();
    };
    ws.onerror = () => {
      resetHandlers(ws);
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

export async function* messagesTillClosed<T>(
  ws: WebSocket,
  schema: z.Schema<T>,
  cancellationToken: CancellationToken
) : AsyncGenerator<string, void> {
  yield Promise.resolve("hello");
}

function resetHandlers(ws: WebSocket): void {
  ws.onopen = null;
  ws.onmessage = unexpectedMessageHandler(ws);
  ws.onclose = null;
  ws.onerror = null;
}

function unexpectedMessageHandler(ws: WebSocket): (ev: MessageEvent) => void {
  return (_) => {
    ws.onopen = null;
    ws.onmessage = null;
    ws.onclose = null;
    ws.onerror = null;
    console.error("Received unexpected message, closing WebSocket.");
    ws.close();
  };
}
