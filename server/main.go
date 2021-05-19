package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

type response struct {
	Name string
}

func sayHello(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", "application/json")

	resp := response{Name: "Peter"}

	json.NewEncoder(w).Encode(resp)
}

func main() {
	r := mux.NewRouter()

	r.Path("/test").Methods("GET").HandlerFunc(sayHello)

	http.Handle("/", r)

	log.Println("Starting server...")
	log.Fatal(http.ListenAndServe("localhost:8080", nil))
}
