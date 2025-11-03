"use client";
import { useEffect } from "react";

export default function CleanURL() {
  useEffect(() => {
    if (window.location.hash === "") {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  return null;
}
//#google_vignette