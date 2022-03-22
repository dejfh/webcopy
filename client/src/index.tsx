import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { AppState } from "./AppState";
import reportWebVitals from "./reportWebVitals";

navigator.serviceWorker.register("service-worker.js");

const state = new AppState();

const hash = window.location.hash;
if (hash.startsWith("#join=")) {
  const t = hash.substring(6);
  state.join(t);
  window.location.replace("#");
}

ReactDOM.render(
  <React.StrictMode>
    <App state={state} />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
