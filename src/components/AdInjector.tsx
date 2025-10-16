"use client";
import { useEffect } from "react";

const KEY = "c1d632aae5a0b2db240c187ea66230df"; // <- set your exact provider key here

export default function AdInjector() {
  useEffect(() => {
    try {
      if ((window as any).__ad_injected) {
        console.log("AdInjector: already injected, skipping");
        return;
      }
      (window as any).__ad_injected = true;

      (window as any).atOptions = {
        key: KEY,
        format: "iframe",
        height: 90,
        width: 728,
        params: {},
        // container: "ad-slot-home" // optional: if provider supports targeting
      };

      const s = document.createElement("script");
      s.type = "text/javascript";
      s.src = `https://www.highperformanceformat.com/${KEY}/invoke.js`;
      s.async = true;
      s.onload = () => {
        console.log("AdInjector: invoke.js loaded");
        // after a short delay, try to log iframe presence
        setTimeout(() => {
          const frames = Array.from(document.querySelectorAll("iframe")).map(
            (f) => ({
              src: (f as HTMLIFrameElement).src,
              w: f.clientWidth,
              h: f.clientHeight,
            })
          );
          console.log("AdInjector: iframe list", frames);
        }, 800);
      };
      s.onerror = (e) => {
        console.error("AdInjector: script load error", e);
      };
      document.body.appendChild(s);
    } catch (e) {
      console.error("AdInjector error:", e);
    }
  }, []);

  return null;
}
