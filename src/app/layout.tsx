import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import CleanURL from "@/components/CleanURL";
import PushOptIn from "@/components/PushOptIn";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/next";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_SHORT, SITE_URL } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import AdSenseScript from "@/components/AdSenseScript";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const SITE_SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "SarkariResultsNow",
    url: SITE_URL,
    inLanguage: ["en-IN", "hi-IN"],
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    email: "support@sarkariresultsnow.com",
    sameAs: ["https://www.instagram.com/sarkariresultsnow/", "https://t.me/sarkariresultsnow"],
  },
];

const inter = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sarkari Results Now: Sarkari Result, Govt Jobs, Admit Card",
    template: `%s | ${SITE_SHORT}`,
  },
  description:
    "Latest Sarkari Result, government job notifications, admit cards, answer keys and free mock tests for SSC, Railway, Bank, Police and State exams.",
  applicationName: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_IN",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE] },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
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
        <JsonLd data={SITE_SCHEMA} />
      </head>

      <body className={`${inter.className} ${inter.variable} antialiased`} suppressHydrationWarning>
        {/* AdSense loads on public pages only (not /admin) */}
        <AdSenseScript />
        {/* Google Analytics on public pages only (admin visits are not counted) */}
        <GoogleAnalytics />
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

          {/* Opt-in card for exam alert push notifications (never prompts on load) */}
          <PushOptIn />

          {/* ✅ Vercel Analytics & Speed Tracking */}
          <SpeedInsights />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
