import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import CleanURL from "@/components/CleanURL";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

const inter = Montserrat({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sarkari Results Now – Sarkari Exam, Job Alerts & Admit Cards & Free Test Serires Available",
  description:
    "Sarkari Results Now provides all Sarkari Results, Admit Cards, Latest Government Job Updates, Free Test Series",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* 🔹 Google Verification & AdSense Config */}
        <meta
          name="google-site-verification"
          content="KpO7IT-JrAfXS5vKDai0XcwaVUS-JzRDwsl1kBtfoyI"
        />
        <meta name="google-adsense-account" content="ca-pub-6447497690677792" />
        <meta
          name="google-site-verification"
          content="YRllvaBEISVbmMxHK3hy4i3K6fVmcIqebYsdEh0iT7E"
        />
        {/* 🔹 Favicon */}
        <link rel="icon" type="image/png" href="/logo.png" />

        {/* 🔹 Open Graph (OG) Meta for social sharing */}
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

        {/* ✅ Load AdSense Library (official async script) */}

        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6447497690677792"
          crossOrigin="anonymous"
        ></script>

        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-7RC4TD5K7C"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-7RC4TD5K7C');
    `,
          }}
        />
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
          {/* ✅ Removes unwanted AdSense #google_vignette hash */}
          <CleanURL />

          {/* ✅ Page Content */}
          {children}

          {/* ✅ Vercel Analytics & Speed Tracking */}
          <SpeedInsights />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
