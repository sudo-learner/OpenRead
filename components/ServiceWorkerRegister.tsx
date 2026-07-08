"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    // NEXT_PUBLIC_BASE_PATH is inlined at build time (see .github/workflows/deploy.yml).
    // Falls back to empty string for local dev, where there's no basePath.
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    navigator.serviceWorker.register(`${base}/sw.js`).catch(() => {
      // Non-fatal — the site still works without it, just without the
      // installability boost a service worker provides in some browsers.
    });
  }, []);

  return null;
}
