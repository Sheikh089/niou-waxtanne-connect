/**
 * Service Worker registrar — production only, never inside Lovable preview iframes.
 * Imported once from __root.tsx.
 */
import { Workbox } from "workbox-window";

export function registerSW() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  // Detect Lovable preview / iframe contexts — never register there.
  const inIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();
  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host === "localhost" ||
    host === "127.0.0.1";

  if (inIframe || isPreviewHost) {
    // Clean up any SW that may have been registered before this guard existed
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
    return;
  }

  const wb = new Workbox("/sw.js", { scope: "/" });
  wb.addEventListener("waiting", () => {
    // New version ready — activate immediately
    wb.messageSkipWaiting();
  });
  wb.addEventListener("controlling", () => {
    window.location.reload();
  });
  wb.register().catch((err) => console.warn("[PWA] SW registration failed", err));
}
