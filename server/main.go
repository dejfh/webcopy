package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

func relay(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
	}

	handleRelay(ws)
}

func main() {
	r := mux.NewRouter()
	r.Path("/relay").HandlerFunc(relay)
	http.Handle("/relay", r)

	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	log.Println("Starting server...")
	log.Fatal(http.ListenAndServe("localhost:8090", nil))
}
