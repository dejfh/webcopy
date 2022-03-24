import CancellationToken from "cancellationtoken";
import { BehaviorSubject } from "rxjs";
import * as coupleStorage from "./service/api/coupleStorage";
import * as invitePush from "./service/api/invitePush";
import { InvitePushData } from "./service/api/invitePush/schema";
import * as relay from "./service/api/relay";
import * as webcopy from "./service/api/webcopy";

export enum AppReadyState {
  NONE = relay.RelayReadyState.MIN - 1,
  CONNECTING = relay.RelayReadyState.CONNECTING,
  CONNECTED = relay.RelayReadyState.CONNECTED,
  INITIATING = relay.RelayReadyState.INITIATING,
  WAITING = relay.RelayReadyState.WAITING,
  PAIRED = relay.RelayReadyState.PAIRED,
  CLOSED = relay.RelayReadyState.MAX + 1,
  ERROR = relay.RelayReadyState.ERROR,
}

export class AppState {
  private currentCancel: ((reason?: any) => void) | null = null;
  private ws: WebSocket | null = null;
  public readonly response = new BehaviorSubject("");
  public readonly token = new BehaviorSubject("");
  public readonly connState = new BehaviorSubject(AppReadyState.NONE);
  public readonly coupleOffer = new BehaviorSubject(
    null as InvitePushData | null
  );
  public readonly coupleStorage = coupleStorage.read();

  public cancel() {
    if (this.currentCancel) {
      this.currentCancel();
      this.currentCancel = null;
    }
    this.response.next("");
    this.token.next("");
    this.connState.next(AppReadyState.NONE);
    this.coupleOffer.next(null);
  }

  public async init(): Promise<void> {
    this.cancel();
    const cancellation = CancellationToken.create();
    this.currentCancel = cancellation.cancel;

    try {
      const ws = await relay.init(
        this.getUrl(),
        (token) => this.token.next(token),
        (state) => this.connState.next(state as number as AppReadyState),
        cancellation.token
      );

      await this.continue(ws, cancellation.token);
    } catch (err) {
      this.connState.next(AppReadyState.ERROR);
      console.error("Failed to init.", err);
    }
  }

  public async join(token: string): Promise<void> {
    this.cancel();
    const cancellation = CancellationToken.create();
    this.currentCancel = cancellation.cancel;

    try {
      const ws = await relay.join(
        this.getUrl(),
        token,
        (state) => this.connState.next(state as number as AppReadyState),
        cancellation.token
      );

      await this.continue(ws, cancellation.token);
    } catch (err) {
      this.connState.next(AppReadyState.ERROR);
      console.log("Failed to join.", err);
    }
  }

  public sendText(text: string) {
    if (this.ws) {
      webcopy.sendText(this.ws, text);
    }
  }

  public async sendCouple() {
    if (!this.ws) {
      return;
    }
    const invitePushData = await invitePush.getInvitePushData();
    if (!this.ws) {
      return;
    }
    webcopy.sendCouple(this.ws, invitePushData);
  }

  public storeCouple(name: string) {
    if (!this.coupleOffer.value) {
      return;
    }
    coupleStorage.store(name, this.coupleOffer.value);
    this.coupleOffer.next(null);
  }

  public invite(data: InvitePushData, token: string) {
    invitePush.invite(data, token);
  }

  private async continue(ws: WebSocket, cancellationToken: CancellationToken) {
    this.ws = ws;
    await webcopy.loop(
      ws,
      (text) => this.response.next(text),
      (coupleData) => this.coupleOffer.next(coupleData),
      cancellationToken
    );
    this.connState.next(AppReadyState.CLOSED);
  }

  private getUrl(): string {
    const url = new URL(window.location.href);
    url.protocol = url.protocol.replace("http", "ws");
    url.search = "";
    url.pathname = "relay";
    url.hash = "";
    return url.href;
  }
}
