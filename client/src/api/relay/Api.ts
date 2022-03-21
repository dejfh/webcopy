import CancellationToken from "cancellationtoken";
import * as z from "zod";
import { withCancel } from "../../util/WithCancel";
import * as schema from "./Schema";

export enum State {
  MIN = 1,
  CONNECTING = MIN,
  CONNECTED = 2,
  INITIATING = 3,
  WAITING = 4,
  PAIRED = 5,
  MAX = PAIRED,
  ERROR = 9999,
}

type Options =
  | {
      url: string;
      token?: undefined;
      ontoken: (token: string) => void;
      onstate: (state: State) => void;
      resolve: (ws: WebSocket) => void;
      reject: (reason?: any) => void;
    }
  | {
      url: string;
      token: string;
      ontoken?: undefined;
      onstate: (state: State) => void;
      resolve: (ws: WebSocket) => void;
      reject: (reason?: any) => void;
    };

class RelayConnection {
  private readonly ws: WebSocket;

  public constructor(private readonly options: Options) {
    this.ws = new WebSocket(options.url);
    this.ws.onopen = (ev) => this.onWsOpen(ev);
    this.ws.onclose = (ev) => this.onWsClose(ev);
    this.ws.onerror = (ev) => this.onWsError(ev);
  }

  public cancel(reason?: any) {
    this.error(reason || new Error("Operation canceled."));
  }

  private onWsOpen(_: Event) {
    this.setState(State.CONNECTED);
    this.setMessageHandler(
      (msg) => this.onHelloMessage(msg),
      schema.helloMessageSchema
    );
  }

  private onWsClose(_: CloseEvent) {
    this.error(new Error("WebSocket closed."));
  }

  private onWsError(_: Event) {
    this.error(new Error("WebSocket connection error."));
  }

  private setMessageHandler<T>(handler: (msg: T) => void, schema: z.Schema<T>) {
    this.ws.onmessage = (ev) => {
      try {
        const json = JSON.parse(ev.data);
        console.log("Received:", json);
        const msg = schema.parse(json);
        handler(msg);
      } catch (err) {
        this.error(err);
      }
    };
  }

  private onHelloMessage(msg: schema.HelloMessage) {
    if (msg.data.protocol !== "relay 1.0") {
      throw new Error(`Unsupported protocol: ${msg.data.protocol}`);
    }
    if (this.options.token) {
      this.sendMsg({ type: "join", data: { token: this.options.token } });
      this.setState(State.WAITING);
      this.setMessageHandler(
        (msg) => this.onPairedMsg(msg),
        schema.pairedMessageSchema
      );
    } else {
      this.sendMsg({ type: "init" });
      this.setState(State.INITIATING);
      this.setMessageHandler(
        (msg) => this.onTokenMsg(msg),
        schema.tokenMessageSchema
      );
    }
  }

  private onTokenMsg(msg: schema.TokenMessage) {
    this.setState(State.WAITING);
    const ontoken = this.options.ontoken!;
    ontoken(msg.data.token);
    this.setMessageHandler(
      (msg) => this.onPairedMsg(msg),
      schema.pairedMessageSchema
    );
  }

  private onPairedMsg(_: schema.PairedMessage) {
    this.setState(State.PAIRED);
    this.clearWsHandler();
    this.options.resolve(this.ws);
  }

  private sendMsg(msg: schema.OutRelayMessage) {
    console.log("Sending:", msg);
    const raw = JSON.stringify(msg);
    this.ws.send(raw);
  }

  private error(err: any) {
    this.clearWsHandler();
    this.ws.close();
    this.setState(State.ERROR);
    this.options.reject(err);
  }

  private setState(state: State) {
    this.options.onstate(state);
  }

  private clearWsHandler() {
    this.ws.onopen = null;
    this.ws.onmessage = null;
    this.ws.onclose = null;
    this.ws.onerror = null;
  }
}

export function init(
  url: string,
  ontoken: (token: string) => void,
  onstate: (state: State) => void,
  cancellationToken: CancellationToken
): Promise<WebSocket> {
  return withCancel(cancellationToken, (resolve, reject, onCancelled) => {
    const rc = new RelayConnection({
      url: url,
      ontoken: ontoken,
      onstate: onstate,
      resolve: resolve,
      reject: reject,
    });
    onCancelled((reason) => rc.cancel(reason));
  });
}

export function join(
  url: string,
  token: string,
  onstate: (state: State) => void,
  cancellationToken: CancellationToken
): Promise<WebSocket> {
  return withCancel(cancellationToken, (resolve, reject, onCancelled) => {
    const rc = new RelayConnection({
      url: url,
      token: token,
      onstate: onstate,
      resolve: resolve,
      reject: reject,
    });
    onCancelled((reason) => rc.cancel(reason));
  });
}
