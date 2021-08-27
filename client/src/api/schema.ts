import * as yup from "yup";

export interface Message {
    type: 'hello' | 'init' | 'token' | 'join' | 'paired' | 'data',
    data?: {
        protocol?: string,
        token?: string,
        text?: string
    }
}

const messageSchema = yup.object({
    type: yup.string().oneOf([
        'hello', 'init', 'token', 'join', 'paired', 'data'
    ]).required(),
    data: yup.object({
        protocol: yup.string(),
        token: yup.string(),
        text: yup.string()
    })
})

const helloDataSchema = yup.object({
    protocol: yup.string()
})

const tokenDataSchema = yup.object({
    token: yup.string().defined()
}).required()

const dataDataSchema = yup.object({
    text: yup.string()
}).required()

export function validateMessage(raw: unknown): Message {
    return messageSchema.validateSync(raw) as Message
}

export function helloData(msg: Message) {
    return helloDataSchema.validateSync(msg.data)
}

export function tokenData(msg: Message) {
    return tokenDataSchema.validateSync(msg.data)
}

export function dataData(msg: Message) {
    return dataDataSchema.validateSync(msg.data)
}
