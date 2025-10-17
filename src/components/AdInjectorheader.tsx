// components/AdInjector.tsx
"use client";
import { useEffect } from "react";

type Props = {
  slotId?: string; // id of the container element where you want the ad visually placed
  keyId?: string; // the ad script key (optional override)
};

export default function AdInjector({
  slotId = "ad-slot",
  keyId = "c1d632aae5a0b2db240c187ea66230df",
}: Props) {
  useEffect(() => {
    try {
      // Prevent double-injection (by same key)
      const existing = document.querySelector(`script[data-ad-key="${keyId}"]`);
      if (existing) {
        console.log("AdInjector: script already present, skipping injection.");
        return;
      }

      // Configure global options required by the ad script
      (window as any).atOptions = {
        key: keyId,
        format: "iframe",
        height: 90,
        width: 728,
        params: {},
      };

      // Create script element and mark with data-ad-key so we can detect it later
      const s = document.createElement("script");
      s.type = "text/javascript";
      s.async = true;
      s.src = `https://www.highperformanceformat.com/${keyId}/invoke.js`;
      s.setAttribute("data-ad-key", keyId);

      // If you want the script visually inside a specific container, append there.
      const container = document.getElementById(slotId);
      if (container) {
        container.appendChild(s);
        console.log(`AdInjector: script appended to #${slotId}`);
      } else {
        // fallback to body if container not found
        document.body.appendChild(s);
        console.warn(
          `AdInjector: #${slotId} not found — appended script to document.body`
        );
      }

      // Optional: small timeout to check if iframe appeared (for debugging)
      const checkTimer = window.setTimeout(() => {
        const foundIframe = !!document.querySelector(
          `iframe[src*="${keyId}"], iframe`
        );
        console.log("AdInjector: iframe present?", foundIframe);
      }, 2000);

      return () => {
        // cleanup: remove script we added and clear the timer
        const injected = document.querySelector(
          `script[data-ad-key="${keyId}"]`
        );
        if (injected && injected.parentElement)
          injected.parentElement.removeChild(injected);
        clearTimeout(checkTimer);
        // NOTE: many ad scripts create iframes/divs that remain — if you want to remove them too,
        // you can add logic here to remove known wrapper classes/ids, but be careful not to remove unrelated iframes.
        console.log("AdInjector: cleaned up script");
      };
    } catch (e) {
      console.error("AdInjector error:", e);
    }
    // only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The actual container should be provided in the page markup with same id.
  // Return null as the component does not itself render the ad markup (we append script to DOM).
  return null;
}
