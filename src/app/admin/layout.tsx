import { Metadata } from "next";
import AdminLayoutClient from "./AdminLayoutClient";
import { HIDE_ADS_CSS } from "@/lib/ads";

export const metadata: Metadata = {
  title: "Admin Dashboard - Job Management & Content Administration | Sarkari Results Now",
  description: "Admin dashboard for managing jobs, results, admit cards, news, answer keys, admissions, quizzes, and categories. Comprehensive job posting and content management system for government and private sector opportunities.",
  keywords: [
    "admin dashboard",
    "job management",
    "content management",
    "job posting",
    "recruitment platform",
    "admin panel",
    "job administration",
    "content administration",
    "government jobs management",
    "admit card management",
    "results management",
    "news management",
    "quiz management",
    "admission management",
    "category management"
  ],
  openGraph: {
    title: "Admin Dashboard - Job Management Platform",
    description: "Comprehensive admin dashboard for managing government and private sector job opportunities, results, admit cards, and recruitment content.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* No ads in the admin dashboard, even if AdSense was loaded on a public page first */}
      <style>{HIDE_ADS_CSS}</style>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </>
  );
}

export const dynamic = "force-dynamic";
