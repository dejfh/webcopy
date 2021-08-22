package main

import (
	"encoding/json"
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

type response struct {
	Name string
}

func sayHello(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", "application/json")

	resp := response{Name: "Peter"}

	json.NewEncoder(w).Encode(resp)
}

func mirror(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
	}

	log.Println("Client connected to mirror")

	for {
		messageType, data, err := ws.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}

		log.Println("I got some data!")

		if err := ws.WriteMessage(messageType, data); err != nil {
			log.Println(err)
			return
		}
	}
}

func main() {
	r := mux.NewRouter()

	r.Path("/test").Methods("GET").HandlerFunc(sayHello)
	r.Path("/mirror").HandlerFunc(mirror)

	http.Handle("/", r)

	log.Println("Starting server...")
	log.Fatal(http.ListenAndServe("localhost:8090", nil))
}
