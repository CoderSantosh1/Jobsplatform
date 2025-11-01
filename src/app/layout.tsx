import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

const inter = Montserrat({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SarkariResultsNow",
  description: "Latest Sarkari Result, Job Updates, Admit Card, Answer Keys",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="google-site-verification"
          content="KpO7IT-JrAfXS5vKDai0XcwaVUS-JzRDwsl1kBtfoyI"
        />
        <meta name="google-adsense-account" content="ca-pub-6447497690677792" />

        <link rel="icon" type="image/png" href="/logo-color-new.jpg" />
        <meta
          property="og:title"
          content="Sarkariresultsnow - Latest Govt Job Results, Admit Cards & News"
        />
        <meta
          property="og:description"
          content="Get the latest updates on government job results, admit cards, sarkari news, and more. Stay informed with Sarkariresultsnow for all your govt job needs."
        />
        <meta
          property="og:image"
          content="https://www.sarkariresultsnow.com/og-image.png"
        />
        <meta property="og:url" content="https://www.sarkariresultsnow.com/" />
        <meta
          name="description"
          content="SarkariResultsNow provides all Sarkari Result, Admit Card, Government Jobs and Free Test Series , Latest Notifications."
        />

        {/* ✅ Plain script tag (not Next.js <Script/>) */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6447497690677792"
          crossOrigin="anonymous"
        ></script>
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
          {children}
          <SpeedInsights />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
