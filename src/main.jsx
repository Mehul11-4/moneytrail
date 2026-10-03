import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "./registerSW.js";
// Show a real crash as readable text on screen, instead of a blank page —
// this lets us see real errors on phones without needing USB debugging.
// Harmless background errors (chart resize warnings, a dropped network
// connection) are ignored here so they don't cover the whole app.
function isHarmless(error) {
  const text = String(error?.message || error || "");
  return (
    text.includes("ResizeObserver loop") ||
    text.includes("Failed to fetch") ||
    text.includes("NetworkError") ||
    text.includes("Load failed")
  );
}

window.addEventListener("error", (event) => {
  const error = event.error || event.message;
  if (isHarmless(error)) return;
  showCrashScreen(error);
});
window.addEventListener("unhandledrejection", (event) => {
  if (isHarmless(event.reason)) {
    console.warn("Ignored background error:", event.reason);
    return;
  }
  showCrashScreen(event.reason);
});

function showCrashScreen(error) {
  if (document.getElementById("crash-screen")) return; // don't stack multiple crash screens

  const message = error?.stack || error?.message || String(error);
  const div = document.createElement("div");
  div.id = "crash-screen";
  div.style.cssText =
    "position:fixed;inset:0;background:#0A0A0F;color:#F4F4F5;padding:20px;font-family:monospace;font-size:12px;overflow:auto;z-index:99999;";

  const makeButton = (label, onClick) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.style.cssText =
      "padding:8px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.3);background:#15151E;color:#F4F4F5;font-size:13px;";
    button.onclick = onClick;
    return button;
  };

  const buttons = document.createElement("div");
  buttons.style.cssText = "display:flex;gap:8px;margin-bottom:16px;";
  buttons.appendChild(makeButton("Close", () => div.remove()));
  buttons.appendChild(makeButton("Reload app", () => window.location.reload()));

  const text = document.createElement("div");
  text.style.cssText = "white-space:pre-wrap;";
  text.textContent = "App Error:\n\n" + message;

  div.appendChild(buttons);
  div.appendChild(text);
  document.body.appendChild(div);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
