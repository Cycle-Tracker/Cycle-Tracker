import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { registerServiceWorker } from "./utils/pushSubscriptions";

// Tell the boot-fallback in index.html that React started successfully,
// so the recovery page doesn't replace the live app after 6s.
if (typeof window !== "undefined") {
  window.__APP_BOOTED__ = true;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the Service Worker once the page is loaded — it runs in the
// background and is responsible for receiving Web Push events when the
// app is closed. Failing here is non-fatal; the in-app notifications
// keep working without it.
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    registerServiceWorker();
  });
}
