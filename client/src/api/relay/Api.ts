import CancellationToken from "cancellationtoken";
import { createWebSocket, nextMessage } from "../../util/AsyncWebSocket";
import * as schema from "./Schema";

export enum RelayReadyState {
  MIN = 1,
  CONNECTING = MIN,
  CONNECTED = 2,
  INITIATING = 3,
  WAITING = 4,
  PAIRED = 5,
  MAX = PAIRED,
  ERROR = 9999,
}

export async function init(
  url: string,
  ontoken: (token: string) => void,
  onstate: (state: RelayReadyState) => void,
  cancellationToken: CancellationToken
): Promise<WebSocket> {
  onstate(RelayReadyState.CONNECTING);
  const ws = await createWebSocket(url, cancellationToken);
  onstate(RelayReadyState.CONNECTED);
  await nextMessage(ws, schema.helloMessageSchema, cancellationToken);
  send(ws, { type: "init" });
  onstate(RelayReadyState.INITIATING);
  {
    const msg = await nextMessage(
      ws,
      schema.tokenMessageSchema,
      cancellationToken
    );
    onstate(RelayReadyState.WAITING);
    ontoken(msg.data.token);
  }
  await nextMessage(ws, schema.pairedMessageSchema, cancellationToken);
  onstate(RelayReadyState.PAIRED);
  return ws;
}

export async function join(
  url: string,
  token: string,
  onstate: (state: RelayReadyState) => void,
  cancellationToken: CancellationToken
): Promise<WebSocket> {
  onstate(RelayReadyState.CONNECTING);
  const ws = await createWebSocket(url, cancellationToken);
  onstate(RelayReadyState.CONNECTED);
  await nextMessage(ws, schema.helloMessageSchema, cancellationToken);
  send(ws, { type: "join", data: { token } });
  onstate(RelayReadyState.WAITING);
  await nextMessage(ws, schema.pairedMessageSchema, cancellationToken);
  onstate(RelayReadyState.PAIRED);
  return ws;
}

function send(ws: WebSocket, msg: schema.OutRelayMessage) {
  ws.send(JSON.stringify(msg));
}
