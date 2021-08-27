package main

import (
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeTimeout = 20 * time.Second
	readTimeout  = 70 * time.Second
	pingPeriod   = 50 * time.Second
)

func updateReadDeadline(ws *websocket.Conn) {
	ws.SetReadDeadline(time.Now().Add(readTimeout))
}

type PingSender struct {
	C chan struct{}
}

func NewPingSender(ws *websocket.Conn) PingSender {
	C := make(chan struct{})
	ticker := time.NewTicker(pingPeriod)

	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				err := ws.WriteControl(websocket.PingMessage, nil, time.Now().Add(writeTimeout))
				if err != nil {
					return
				}
			case <-C:
				return
			}
		}
	}()
	return PingSender{C: C}
}

func (ps *PingSender) Stop() {
	close(ps.C)
}
