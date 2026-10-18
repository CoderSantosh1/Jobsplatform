import type { Metadata } from "next";

// Per-user score page (reads ?attemptId): always render fresh and keep it out of the index.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mock Test Result",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
