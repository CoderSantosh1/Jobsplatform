"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { isAdFreePath } from "@/lib/ads";

/** Loads the AdSense library on public pages only, so (auto) ads never appear in the admin dashboard. */
export default function AdSenseScript() {
  const pathname = usePathname();
  if (isAdFreePath(pathname)) return null;

  return (
    <Script
      id="google-adsense"
      async
      // Ads are not needed for first paint; loading them after the page keeps LCP and blocking time low.
      strategy="lazyOnload"
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6447497690677792"
      crossOrigin="anonymous"
    />
  );
}
