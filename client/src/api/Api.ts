import { webSocket, WebSocketSubject } from "rxjs/webSocket";
import { Subscription } from "rxjs";
import * as op from "rxjs/operators";
import * as yup from "yup";

const messageSchema = yup.object({
    data: yup.object({
        msg: yup.string().defined()
    }).required()
})

export interface Message extends yup.Asserts<typeof messageSchema> { }

export class Connection {
    private subscription: Subscription

    public constructor(
        private subject: WebSocketSubject<unknown>,
        onmessage: (message: string) => void
    ) {
        this.subscription = subject.pipe(
            op.map(data => messageSchema.validateSync(data).data.msg)
        ).subscribe({
            next: onmessage,
            error: err => console.error(err)
        })
    }

    public send(msg: string) {
        this.subject.next({ data: { msg: msg } })
    }

    public close() {
        this.subscription.unsubscribe()
    }
}

export function connectMirror(onmessage: (message: string) => void): Connection {
    var ws = webSocket("ws://localhost:8090/mirror")

    return new Connection(ws, onmessage)
}
