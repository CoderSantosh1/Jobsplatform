import type { Metadata } from "next";
import Home from "./pages/Home";
import { pageMetadata } from "@/lib/seo";

// Serve the home page from cache and rebuild it at most every 5 minutes.
export const revalidate = 300;

const base = pageMetadata({
  title: "Sarkari Results Now – Sarkari Result, Govt Jobs, Admit Card & Free Mock Tests",
  description:
    "Latest Sarkari Result 2026, government job notifications, admit cards, answer keys, admissions and free mock tests for SSC, Railway, Bank, Police and State exams.",
  path: "/",
});

export const metadata: Metadata = {
  ...base,
  // Home page uses the full title without the "| Sarkari Results Now" suffix.
  title: { absolute: base.title as string },
};

export default function HomePage() {
  return <Home />;
}
