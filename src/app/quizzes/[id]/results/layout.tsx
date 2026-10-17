import type { Metadata } from "next";

// Per-user score page: keep it out of the index.
export const metadata: Metadata = {
  title: "Mock Test Result",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
