// components/AdInjector.tsx
"use client";
import { useEffect } from "react";

export default function AdInjector() {
  useEffect(() => {
    try {
      (window as any).atOptions = {
        key: "4c21595f6a0bf9f9199805e3454a93da",
        format: "iframe",
        height: 90,
        width: 728,
        params: {},
      };

      const s = document.createElement("script");
      s.type = "text/javascript";
      s.src = "https://www.highperformanceformat.com/c1d632aae5a0b2db240c187ea66230df/invoke.js"; // <- same key
      s.async = true;
      document.body.appendChild(s);

      console.log("✅ AdInjector script appended");
    } catch (e) {
      console.error("AdInjector error:", e);
    }
  }, []);

  return null;
}
