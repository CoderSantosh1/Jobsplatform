import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sarkariresultsnow",
  description:
    "SarkariResultsNow provides all Sarkari Result, Admit Card, Government Jobs and Latest Notifications.",
  openGraph: {
    title: "Sarkariresultsnow - Latest Govt Job Results, Admit Cards & News",
    description:
      "Get the latest updates on government job results, admit cards, sarkari news, and more.",
    url: "https://www.sarkariresultsnow.com/",
    images: [{ url: "https://www.sarkariresultsnow.com/og-image.png" }],
  },
  alternates: { canonical: "https://www.sarkariresultsnow.com/" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.className} antialiased`}>
        {/* Use ThemeProvider to wrap app */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}

          {/* Google AdSense: use Script with afterInteractive */}
          <Script
            id="adsense"
            strategy="afterInteractive"
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6447497690677792"
            crossOrigin="anonymous"
            onError={(e) => {
              console.error("Adsense failed to load", e);
            }}
          />

          {/* Third-party ad script (wrap in Script and lazy load).
              REVIEW this script for policy and safety before using. */}
          <Script id="hpf-invoke" strategy="lazyOnload">
            {`(function(){
              try {
                window.atOptions = {
                  key: 'c1d632aae5a0b2db240c187ea66230df',
                  format: 'iframe',
                  height: 50,
                  width: 320,
                  params: {}
                };
                var s = document.createElement('script');
                s.src = "//www.highperformanceformat.com/c1d632aae5a0b2db240c187ea66230df/invoke.js";
                s.async = true;
                document.head.appendChild(s);
              } catch(e) {
                console.error('ad script error', e);
              }
            })();`}
          </Script>

          {/* Vercel performance & analytics */}
          <SpeedInsights />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
