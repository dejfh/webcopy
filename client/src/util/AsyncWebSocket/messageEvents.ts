import { withCancel } from "../WithCancel";
import { resetHandlers } from "./helper";

export async function* messageEvents(
  ws: WebSocket,
  signal?: AbortSignal
): AsyncGenerator<MessageEvent> {
  while (true) {
    if (
      ws.readyState === WebSocket.CLOSING ||
      ws.readyState === WebSocket.CLOSED
    ) {
      return;
    }
    const me = await withCancel<MessageEvent | undefined>(
      signal,
      (resolve, reject, onCancelled) => {
        ws.onmessage = (ev) => {
          resetHandlers(ws);
          resolve(ev);
        };
        ws.onclose = () => {
          resetHandlers(ws);
          resolve(undefined);
        };
        ws.onerror = () => {
          resetHandlers(ws);
          reject(new Error("WebSocket error."));
        };
        onCancelled(() => {
          resetHandlers(ws);
          reject(new Error("Operation cancelled."));
        });
      }
    );
    if (me) {
      yield Promise.resolve(me);
    } else {
      return;
    }
  }
}

export function nextMessageEvent(
  ws: WebSocket,
  signal?: AbortSignal
): Promise<MessageEvent> {
  if (
    ws.readyState === WebSocket.CLOSING ||
    ws.readyState === WebSocket.CLOSED
  ) {
    return Promise.reject(new Error("WebSocket closed."));
  }
  return withCancel(signal, (resolve, reject, onCancelled) => {
    ws.onmessage = (ev) => {
      resetHandlers(ws);
      resolve(ev);
    };
    ws.onclose = () => {
      resetHandlers(ws);
      reject(new Error("WebSocket closed."));
    };
    ws.onerror = () => {
      resetHandlers(ws);
      reject(new Error("WebSocket error."));
    };
    onCancelled(() => {
      resetHandlers(ws);
      reject(new Error("Operation cancelled."));
    });
  });
}
