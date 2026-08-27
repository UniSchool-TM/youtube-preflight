"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for PWA offline support.
 * Registration errors are swallowed so the app works normally
 * even if SW or HTTPS constraints apply (non-stable releases).
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const isProd = process.env.NODE_ENV === "production";
    const url = isProd ? "/sw.js" : "/sw-dev.js";
    navigator.serviceWorker
      .register(url)
      .catch(() => {
        // Ignore: SW is optional.
      });
  }, []);
  return null;
}