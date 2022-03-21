import * as schema from "./Schema";

interface Options {
  ontext: (text: string) => void;
  oncouple: (data: any) => void;
  onclose: (reason?: any) => void;
}

export class WebcopyConnection {
  public constructor(
    private readonly ws: WebSocket,
    private readonly options: Options
  ) {
    this.ws.onmessage = (ev) => this.onMessage(ev);
    this.ws.onclose = (ev) => this.onWsClose(ev);
    this.ws.onerror = (ev) => this.onWsError(ev);
  }

  public close() {
    this.clearWsHandler();
    this.ws.close();
    this.options.onclose();
  }

  public sendText(text: string) {
    this.sendMessage({ type: "text", data: { text: text } });
  }

  private onMessage(ev: MessageEvent) {
    try {
      const msg = schema.webcopyMessageSchema.parse(JSON.parse(ev.data));
      switch (msg.type) {
        case "text":
          this.options.ontext(msg.data.text);
          break;
        case "couple":
          this.options.oncouple(msg.data);
          break;
      }
    } catch (err) {
      this.clearWsHandler();
      this.ws.close();
      this.options.onclose(new Error("Received invalid message."));
    }
  }

  private onWsClose(_: CloseEvent) {
    this.clearWsHandler();
    this.options.onclose();
  }

  private onWsError(_: Event) {
    this.clearWsHandler();
    this.options.onclose(new Error("WebSocket error."));
  }

  private sendMessage(msg: schema.WebcopyMessage) {
    this.ws.send(JSON.stringify(msg));
  }

  private clearWsHandler() {
    this.ws.onopen = null;
    this.ws.onmessage = null;
    this.ws.onclose = null;
    this.ws.onerror = null;
  }
}

export function connect(
  ws: WebSocket,
  ontext: (text: string) => void,
  oncouple: (data: any) => void,
  onclose: (reason?: any) => void
): WebcopyConnection {
  return new WebcopyConnection(ws, {
    ontext: ontext,
    oncouple: oncouple,
    onclose: onclose,
  });
}
