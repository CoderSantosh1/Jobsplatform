import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "My Profile",
  description:
    "Your Sarkari Results Now profile and mock test history.",
  path: "/profile",
  noIndex: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
