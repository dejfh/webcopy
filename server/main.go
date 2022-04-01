package main

import (
	"log"
	"net/http"
	"net/http/httputil"

	"flag"
	"net/url"

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
	addr := flag.String("addr", "0.0.0.0:8080", "server listens on this address")
	staticDir := flag.String("staticDir", "./static", "path to serve static files from")
	proxy := flag.String("proxy", "", "redirect to this url")

	flag.Parse()

	r := mux.NewRouter()
	r.Path("/relay").HandlerFunc(relay)
	http.Handle("/relay", r)

	if *proxy == "" {
		fs := http.FileServer(http.Dir(*staticDir))
		http.Handle("/", fs)
	}
	if *proxy != "" {
		url, err := url.Parse(*proxy)
		if err != nil {
			log.Fatalln("Could not parse proxy url.", err)
		}
		rproxy := httputil.NewSingleHostReverseProxy(url)
		http.Handle("/", rproxy)
	}

	log.Println("Starting server...")
	log.Fatal(http.ListenAndServe(*addr, nil))
}
