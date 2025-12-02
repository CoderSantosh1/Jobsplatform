"use client";
import { useEffect } from "react";

export default function CleanURL() {
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#google_vignette") {
        setTimeout(() => {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }, 2000);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return null;
}
