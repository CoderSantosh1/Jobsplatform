// components/AdInjectionSquare.tsx
"use client";
import { useEffect } from "react";

type Props = {
  slotId?: string; // id of the container where script will be appended
  keyId?: string; // ad script key (must match URL segment)
  width?: number; // visual width (optional, for container sizing)
  height?: number; // visual height (optional, for container sizing)
};

export default function AdInjectionSquare({
  slotId = "ad-square-slot",
  keyId = "eacacd9cabf5074545b8f418bc1ba697",
  width = 100,
  height = 728,
}: Props) {
  useEffect(() => {
    try {
      // Avoid double injection of same key
      if (document.querySelector(`script[data-ad-key="${keyId}"]`)) {
        console.log("AdInjectionSquare: script already present, skipping.");
        return;
      }

      // Set global options expected by the ad script
      (window as any).atOptions = {
        key: keyId,
        format: "iframe",
        height,
        width,
        params: {},
      };

      // Create the script tag and mark with data-ad-key attribute
      const s = document.createElement("script");
      s.type = "text/javascript";
      s.async = true;
      // make sure this URL segment matches keyId
      s.src = `https://www.highperformanceformat.com/${keyId}/invoke.js`;
      s.setAttribute("data-ad-key", keyId);

      // Append script into the slot container if present, otherwise append to body
      const container = document.getElementById(slotId);
      if (container) {
        container.appendChild(s);
        console.log(`AdInjectionSquare: script appended to #${slotId}`);
      } else {
        document.body.appendChild(s);
        console.warn(
          `AdInjectionSquare: #${slotId} not found — appended to document.body`
        );
      }

      // optional debug check (can be removed)
      const timer = window.setTimeout(() => {
        const found = !!document.querySelector(
          `iframe[src*="${keyId}"], iframe`
        );
        console.log("AdInjectionSquare: iframe found?", found);
      }, 1500);

      return () => {
        // cleanup injected script (do NOT aggressively remove all iframes — only the script here)
        const injected = document.querySelector(
          `script[data-ad-key="${keyId}"]`
        );
        if (injected && injected.parentElement)
          injected.parentElement.removeChild(injected);
        clearTimeout(timer);
        console.log("AdInjectionSquare: cleaned up script");
      };
    } catch (err) {
      console.error("AdInjectionSquare error:", err);
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // This component does not render the ad elements itself — it appends the script into the DOM.
  return null;
}
