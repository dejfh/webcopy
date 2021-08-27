import { Connection, connect, State } from './api';
import { BehaviorSubject } from 'rxjs'

export class AppState {
    public readonly conn = new BehaviorSubject(null as Connection | null)
    public readonly response = new BehaviorSubject("")
    public readonly token = new BehaviorSubject("")
    public readonly connState = new BehaviorSubject(State.CONNECTING)

    public connect(token?: string) {
        const conn = connect({ onstate: v => this.connState.next(v), ontext: v => this.response.next(v) }, token)
        this.conn.next(conn)
    }
}
