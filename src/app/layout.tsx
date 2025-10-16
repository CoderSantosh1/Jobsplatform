// app/layout.tsx
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import Script from "next/script";

import ClientLayout from "@/components/ClientLayout";

import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

const inter = Montserrat({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sarkariresultsnow.com",
  description:
    "SarkariResultsNow provides all Sarkari Result, Admit Card, Government Jobs, Free Test Series Also Available",
  // optional: metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://www.sarkariresultsnow.com")
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* meta tags */}
        <meta name="google-adsense-account" content="ca-pub-7649078598124252" />
        <link rel="icon" type="image/png" href="/logo-color-new.jpg" />
        <meta
          property="og:title"
          content="Sarkariresultsnow - Latest Govt Job Results, Admit Cards & News"
        />
        <meta
          property="og:description"
          content="Get the latest updates on government job results, admit cards, sarkari news, and more. Stay informed with Sarkariresultsnow for all your govt job needs."
        />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:url" content="https://www.sarkariresultsnow.com/" />

        <meta
          name="description"
          content="SarkariResultsNow provides all Sarkari Result, Admit Card, Government Jobs and Free Test Series , Latest Notifications."
        />
        {/* Load the Google AdSense script (external) */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6447497690677792"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* If you need an inline script like atOptions, use Script with dangerouslySetInnerHTML */}
        <Script id="atOptions" strategy="afterInteractive">
          {`
            var atOptions = {
              'key' : 'c1d632aae5a0b2db240c187ea66230df',
              'format' : 'iframe',
              'height' : 50,
              'width' : 320,
              'params' : {}
            };
            // If the ad provider requires injecting a script file after setting atOptions,
            // add the code to load it here (e.g. create a script element and set src).
            // Example (uncomment and replace URL if required):
            // var s = document.createElement('script'); s.src = 'https://example.com/path/to/ads.js'; s.async = true; document.head.appendChild(s);
          `}
        </Script>
      </head>

      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {/* ClientLayout ensures AdInjector runs client-side */}
          <ClientLayout >{children}

          </ClientLayout>

          {/* Vercel monitoring & analytics (client-safe) */}
          <SpeedInsights />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
