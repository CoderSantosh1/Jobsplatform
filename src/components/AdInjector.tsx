"use client";

import { useEffect } from "react";

export default function AdInjector() {
  useEffect(() => {
    try {
      (window as any).atOptions = {
        key: "c1d632aae5a0b2db240c187ea66230df",
        format: "iframe",
        height: 50,
        width: 320,
        params: {},
      };

      const s = document.createElement("script");
      s.type = "text/javascript";
      s.src =
        "//www.highperformanceformat.com/c1d632aae5a0b2db240c187ea66230df/invoke.js";
      s.async = true;
      document.body.appendChild(s);

      console.log("✅ AdInjector script appended");
    } catch (e) {
      console.error("AdInjector error:", e);
    }
  }, []);

  return null;
}
