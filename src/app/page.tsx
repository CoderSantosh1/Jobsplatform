import Home from "./pages/Home";
import { pageMetadata } from "@/lib/seo";

// Serve the home page from cache and rebuild it at most every 5 minutes.
export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Sarkari Results Now: Sarkari Result, Govt Jobs, Admit Card",
  description:
    "Latest Sarkari Result 2026, government job notifications, admit cards, answer keys, admissions and free mock tests for SSC, Railway, Bank, Police and State exams.",
  path: "/",
});

export default function HomePage() {
  return <Home />;
}
