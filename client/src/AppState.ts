import CancellationToken from "cancellationtoken";
import { BehaviorSubject } from "rxjs";
import * as relay from "./api/relay/Api";
import * as webcopy from "./api/webcopy/Api";

export enum AppStateEnum {
  NONE = relay.State.MIN - 1,
  CLOSED = relay.State.MAX + 1,
}

export type State = relay.State | AppStateEnum;

export class AppState {
  private currentCancel: ((reason?: any) => void) | null = null;
  public readonly conn = new BehaviorSubject(
    null as webcopy.WebcopyConnection | null
  );
  public readonly response = new BehaviorSubject("");
  public readonly token = new BehaviorSubject("");
  public readonly connState = new BehaviorSubject(AppStateEnum.NONE as State);

  public cancel() {
    if (this.currentCancel) {
      this.currentCancel();
      this.currentCancel = null;
    }
    const currentConn = this.conn.value;
    if (currentConn) {
      currentConn.close();
      this.conn.next(null);
    }
    this.response.next("");
    this.token.next("");
    this.connState.next(AppStateEnum.NONE);
  }

  public async init(): Promise<void> {
    this.cancel();
    const cancellation = CancellationToken.create();
    this.currentCancel = cancellation.cancel;

    const url = new URL(window.location.toString());
    url.protocol = url.protocol.replace("http", "ws");
    url.search = "";
    url.hash = "";
    url.pathname = "relay";
    try {
      const ws = await relay.init(
        url.toString(),
        (token) => this.token.next(token),
        (state) => this.connState.next(state),
        cancellation.token
      );

      this.continue(ws);
    } catch (err) {
      console.error("Failed to init.", err);
    }
  }

  public async join(token: string): Promise<void> {
    this.cancel();
    const cancellation = CancellationToken.create();
    this.currentCancel = cancellation.cancel;

    const url = new URL(window.location.toString());
    url.protocol = url.protocol.replace("http", "ws");
    url.search = "";
    url.hash = "";
    url.pathname = "relay";

    try {
      const ws = await relay.join(
        url.toString(),
        token,
        (state) => this.connState.next(state),
        cancellation.token
      );

      this.continue(ws);
    } catch (err) {
      console.log("Failed to join.", err);
    }
  }

  private continue(ws: WebSocket) {
    this.currentCancel = null;
    const wc = webcopy.connect(
      ws,
      (text) => this.response.next(text),
      (coupleData) => {},
      (reason) => {
        this.connState.next(reason ? relay.State.ERROR : AppStateEnum.CLOSED);
      }
    );
    this.conn.next(wc);
  }
}
