"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { GA_DISABLE_KEY, GA_MEASUREMENT_ID, isAdFreePath } from "@/lib/ads";

/**
 * Google Analytics for public pages only. Opening /admin directly never loads gtag; moving from a public page
 * into /admin flips Google's opt-out switch so admin page views are not sent, and moving back turns it off again.
 */
export default function GoogleAnalytics() {
  const pathname = usePathname();
  const isAdmin = isAdFreePath(pathname);

  useEffect(() => {
    (window as unknown as Record<string, unknown>)[GA_DISABLE_KEY] = isAdmin;
  }, [isAdmin]);

  if (isAdmin) return null;

  return (
    <>
      <Script
        id="google-analytics"
        async
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script id="google-analytics-config" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
