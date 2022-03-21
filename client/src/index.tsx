import React from "react";
import ReactDOM from "react-dom";
import webPush, { PushSubscription as WebPushPushSubscription } from "web-push";
import App from "./App";
import { AppState } from "./AppState";
import reportWebVitals from "./reportWebVitals";

const state = new AppState();

const hash = window.location.hash;
if (hash.startsWith("#join=")) {
  const t = hash.substring(6);
  state.join(t);
  window.location.replace("#");
}

navigator.serviceWorker.register("service-worker.js");

const x = async function () {
  try {
    const registration = await navigator.serviceWorker.ready;
    const permissionState = await registration.pushManager.permissionState({
      userVisibleOnly: true,
      applicationServerKey: null,
    });
    console.log("permissionState", permissionState);
    var subscription = await (async function () {
      if (permissionState !== "granted") {
        if ((await Notification.requestPermission()) !== "granted") {
          console.warn("Permission to send notifications denied");
        }
        return await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: null,
        });
      } else {
        const r = await registration.pushManager.getSubscription();
        await r?.unsubscribe();
        return (
          (await registration.pushManager.getSubscription()) ||
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: null,
          }))
        );
      }
    })();
    console.log("subscription:", subscription);
    console.log("subscription JSON:", subscription.toJSON());
  } catch (error) {
    console.error("something failed:", error);
  }
}; /*()*/

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
