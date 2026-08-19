import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "./registerSW.js";

// Catch any crash and display it as readable text on screen, instead of a
// blank page — this lets us see real errors on phones without needing
// USB debugging or a laptop connection.
window.addEventListener("error", (event) => {
  showCrashScreen(event.error || event.message);
});
window.addEventListener("unhandledrejection", (event) => {
  showCrashScreen(event.reason);
});

function showCrashScreen(error) {
  const existing = document.getElementById("crash-screen");
  if (existing) return; // don't stack multiple crash screens

  const message = error?.stack || error?.message || String(error);
  const div = document.createElement("div");
  div.id = "crash-screen";
  div.style.cssText =
    "position:fixed;inset:0;background:#0A0A0F;color:#F4F4F5;padding:20px;font-family:monospace;font-size:12px;white-space:pre-wrap;overflow:auto;z-index:99999;";
  div.textContent = "App Error:\n\n" + message;
  document.body.appendChild(div);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
