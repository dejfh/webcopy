export function resetHandlers(ws: WebSocket): void {
  ws.onopen = null;
  ws.onmessage = unexpectedMessageHandler(ws);
  ws.onclose = null;
  ws.onerror = null;
}

export function unexpectedMessageHandler(
  ws: WebSocket
): (ev: MessageEvent) => void {
  return (_) => {
    ws.onopen = null;
    ws.onmessage = null;
    ws.onclose = null;
    ws.onerror = null;
    console.error("Received unexpected message, closing WebSocket.");
    ws.close();
  };
}
