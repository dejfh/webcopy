import * as schema from "./schema";

export enum State {
    CONNECTING,
    CONNECTED,
    INITIATING,
    WAITING,
    PAIRED,
    CLOSED
}

export interface Receiver {
    ontext: (text: string) => void
    onstate: (state: State) => void
}

var xy = 1

export class Connection {
    public state: State

    private readonly ws: WebSocket

    public isInitiator = false
    public didPair = false

    public constructor(
        private receiver: Receiver,
        private token?: string
    ) {
        const url = new URL(window.location.toString())
        url.protocol = url.protocol.replace("http", "ws")
        url.search = ''
        url.hash = ''
        url.pathname = 'relay'

        this.ws = new WebSocket(url.toString())
        this.ws.onopen = (ev) => this.onOpen(ev)
        this.ws.onmessage = (ev) => this.onMessage(ev)
        this.ws.onclose = (ev) => this.onClose(ev)
        this.ws.onerror = (ev) => this.onError(ev)
        this.state = State.CONNECTING
    }

    private onOpen(ev: Event) {
        this.setState(State.CONNECTED)
        if (!this.token) {
            this.init()
        } else {
            this.join(this.token)
        }
    }

    private onMessage(ev: MessageEvent<any>) {
        const msg = schema.validateMessage(JSON.parse(ev.data))
        switch (msg.type) {
            case 'token':
                this.onTokenMsg(msg)
                break;
            case 'paired':
                this.onPairedMsg()
                break;
            case 'data':
                this.onDataMsg(msg)
                break;
            default:
                break;
        }
    }

    private onClose(ev: CloseEvent) {
        this.setState(State.CLOSED)
    }

    private onError(ev: Event) {
        this.setState(State.CLOSED)
    }

    private init() {
        if (this.state !== State.CONNECTED) throw "Must be connected to init"
        this.isInitiator = true
        this.sendMsg({ type: 'init' })
        this.setState(State.INITIATING)
    }

    private onTokenMsg(msg: schema.Message) {
        if (this.state !== State.INITIATING) {
            this.close();
            throw "Must be initiating to receive token."
        }
        this.token = schema.tokenData(msg).token
        this.setState(State.WAITING)
    }

    private join(token: string) {
        if (this.state !== State.CONNECTED) throw "Must be connected to join"
        this.sendMsg({ type: 'join', data: { token: token } })
        this.setState(State.WAITING)
    }

    private onPairedMsg() {
        if (this.state !== State.WAITING) throw "Must be waiting to be paired"
        this.didPair = true
        this.setState(State.PAIRED)
    }

    private onDataMsg(msg: schema.Message) {
        const data = schema.dataData(msg)
        if (data.text) {
            this.receiver.ontext(data.text)
        }
    }

    public sendText(text: string) {
        this.sendMsg({ type: 'data', data: { text: text } })
    }

    public close() {
        this.ws.close()
        this.setState(State.CLOSED)
    }

    private sendMsg(msg: schema.Message) {
        const raw = JSON.stringify(msg)
        this.ws.send(raw)
    }

    private setState(state: State) {
        if (state === this.state) {
            return
        }
        this.state = state
        this.receiver.onstate(this.state)
    }

    public getToken() { return this.token }
}

export function connect(receiver: Receiver, token?: string): Connection {
    console.log("What??? " + (xy++))
    return new Connection(receiver, token)
}
