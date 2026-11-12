"use client";

import { useEffect } from "react";

const PLACEHOLDER = "/placeholder.svg";

/**
 * Swaps any <img> that fails to load for the branded placeholder, so a
 * missing remote photo never shows as a broken-image icon. Image `error`
 * events don't bubble, so the listener runs in the capture phase.
 */
export default function ImageFallback() {
  useEffect(() => {
    const onError = (event: Event) => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement) || img.dataset.fallback) return;
      img.dataset.fallback = "1";
      img.srcset = "";
      img.src = PLACEHOLDER;
    };
    document.addEventListener("error", onError, true);

    // Images that already failed before hydration.
    document.querySelectorAll("img").forEach((img) => {
      if (img.complete && img.naturalWidth === 0 && img.src && !img.dataset.fallback) {
        img.dataset.fallback = "1";
        img.src = PLACEHOLDER;
      }
    });
    return () => document.removeEventListener("error", onError, true);
  }, []);

  return null;
}
