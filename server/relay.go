package main

import (
	"errors"
	"log"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type InMessage struct {
	MsgType string        `json:"type"`
	Data    InMessageData `json:"data"`
}
type InMessageData struct {
	Token string `json:"token"`
}

type HelloMessage struct {
	MsgType string           `json:"type"`
	Data    HelloMessageData `json:"data"`
}
type HelloMessageData struct {
	Protocol string `json:"protocol"`
}

type TokenMessage struct {
	MsgType string           `json:"type"`
	Data    TokenMessageData `json:"data"`
}
type TokenMessageData struct {
	Token string `json:"token"`
}

type PairedMessage struct {
	MsgType string `json:"type"`
}

type WaitingConn struct {
	wsA *websocket.Conn
	wsB *websocket.Conn
}

var conMutex sync.Mutex

var waitingConMap = make(map[string]*WaitingConn)

func handleRelay(ws *websocket.Conn) {
	pingSender := NewPingSender(ws)
	defer func() {
		ws.Close()
		pingSender.Stop()
	}()

	ws.SetPongHandler(func(appData string) error {
		updateReadDeadline(ws)
		return nil
	})

	sendHello(ws)

	updateReadDeadline(ws)
	inMsg, err := readInMessage(ws)
	if err != nil {
		log.Println("Could not read first message: " + err.Error())
		return
	}

	var otherWs *websocket.Conn
	var token string = ""

	switch inMsg.MsgType {
	case "init":
		otherWs, token, err = handleInit(ws, &inMsg)
		defer log.Println("Closed A - " + token)
	case "join":
		otherWs, token, err = handleJoin(ws, &inMsg)
		defer log.Println("Closed B - " + token)
	default:
		log.Println("Unexpected first message type: " + inMsg.MsgType)
		return
	}

	if otherWs != nil {
		defer otherWs.Close()
	}
	if err != nil {
		return
	}

	for {
		updateReadDeadline(ws)
		messageType, data, err := ws.ReadMessage()
		if err != nil {
			return
		}
		err = otherWs.WriteMessage(messageType, data)
		if err != nil {
			return
		}
	}
}

func handleInit(wsA *websocket.Conn, msg *InMessage) (*websocket.Conn, string, error) {
	token := uuid.NewString()

	if err := sendToken(wsA, token); err != nil {
		log.Println("Failed to answer init message: " + err.Error())
		return nil, token, err
	}

	log.Println("Init - " + token)

	wc := &WaitingConn{wsA: wsA}

	conMutex.Lock()
	waitingConMap[token] = wc
	conMutex.Unlock()

	updateReadDeadline(wsA)
	messageType, data, err := wsA.ReadMessage()
	if err != nil {
		return nil, token, err
	}

	conMutex.Lock()
	wsB := wc.wsB

	if wsB == nil {
		delete(waitingConMap, token)
		err = errors.New("received message before paired")
		return nil, token, err
	}
	conMutex.Unlock()

	err = wsB.WriteMessage(messageType, data)

	return wsB, token, err
}

func handleJoin(wsB *websocket.Conn, msg *InMessage) (*websocket.Conn, string, error) {
	token := msg.Data.Token

	conMutex.Lock()
	wc, ok := waitingConMap[token]
	delete(waitingConMap, token)
	conMutex.Unlock()

	if !ok {
		return nil, token, errors.New("no waiting connection with given token")
	}
	wsA := wc.wsA

	if err := sendPaired(wsB); err != nil {
		return wsA, token, err
	}

	conMutex.Lock()
	wc.wsB = wsB
	conMutex.Unlock()

	err := sendPaired(wsA)

	log.Println("Paired - " + token)

	return wsA, token, err
}

// read and send

func readInMessage(ws *websocket.Conn) (InMessage, error) {
	var inMsg InMessage
	err := ws.ReadJSON(&inMsg)
	return inMsg, err
}

func sendHello(ws *websocket.Conn) error {
	msg := HelloMessage{
		MsgType: "hello",
		Data: HelloMessageData{
			Protocol: "relay 1.0",
		},
	}

	return ws.WriteJSON(msg)
}

func sendToken(ws *websocket.Conn, token string) error {
	msg := TokenMessage{
		MsgType: "token",
		Data: TokenMessageData{
			Token: token,
		},
	}

	return ws.WriteJSON(msg)
}

func sendPaired(ws *websocket.Conn) error {
	msg := PairedMessage{
		MsgType: "paired",
	}

	return ws.WriteJSON(msg)
}
