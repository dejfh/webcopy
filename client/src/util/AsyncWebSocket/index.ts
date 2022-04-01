import { withCancel } from "../WithCancel";
import { resetHandlers, unexpectedMessageHandler } from "./helper";

export { messageEvents, nextMessageEvent } from "./messageEvents";
export { messages, nextMessage } from "./messages";

export function createWebSocket(
  url: string,
  signal?: AbortSignal
): Promise<WebSocket> {
  return withCancel(signal, (resolve, reject, onCancelled) => {
    const ws = new WebSocket(url);

    onCancelled(() => {
      ws.close();
      resetHandlers(ws);
      reject(new Error("Operation cancelled."));
    });
    ws.onopen = () => {
      resetHandlers(ws);
      resolve(ws);
    };
    ws.onmessage = unexpectedMessageHandler(ws);
    ws.onclose = () => {
      resetHandlers(ws);
      reject(new Error("WebSocket closed."));
    };
    ws.onerror = () => {
      resetHandlers(ws);
      reject(new Error("WebSocket error."));
    };
  });
}
