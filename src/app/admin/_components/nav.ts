// Admin sidebar structure. Items without `href` are planned and shown as "Soon" so nothing links to a missing page.
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Briefcase,
  ClipboardCheck,
  FileCheck2,
  FileSearch,
  FolderTree,
  GitBranch,
  GraduationCap,
  History,
  LayoutDashboard,
  Layers,
  Link2,
  ListChecks,
  Map,
  Newspaper,
  Settings,
  ShieldOff,
  Code2,
  Trophy,
  Users,
  CreditCard,
  Library,
  BarChart3,
} from "lucide-react";

export type NavItem = { label: string; icon: LucideIcon; href?: string; match?: (path: string, tab: string | null) => boolean };
export type NavGroup = { title: string; items: NavItem[] };

const tab = (id: string): Pick<NavItem, "href" | "match"> => ({
  href: `/admin/content?tab=${id}`,
  match: (path, current) => path === "/admin/content" && (current ?? "jobs") === id,
});

export const NAV: NavGroup[] = [
  {
    title: "Dashboard",
    items: [{ label: "Overview", icon: LayoutDashboard, href: "/admin", match: (p) => p === "/admin" }],
  },
  {
    title: "Content Management",
    items: [
      { label: "Jobs", icon: Briefcase, ...tab("jobs") },
      { label: "Results", icon: Trophy, ...tab("results") },
      { label: "Admit Cards", icon: CreditCard, ...tab("admit-cards") },
      { label: "News / Exam Preparation", icon: Newspaper, ...tab("news") },
      { label: "Answer Keys", icon: FileCheck2, ...tab("answer-keys") },
      { label: "Admissions", icon: GraduationCap, ...tab("admissions") },
      { label: "Categories", icon: FolderTree, ...tab("categories") },
      { label: "Notifications", icon: Bell, ...tab("notifications") },
    ],
  },
  {
    title: "Exam & Test Series",
    items: [
      { label: "Quiz Management", icon: ListChecks, href: "/admin/quizzes", match: (p) => p.startsWith("/admin/quizzes") },
      { label: "Create Test", icon: Layers, ...tab("quizzes") },
      { label: "Question Bank", icon: Library },
      { label: "Exam Categories", icon: BookOpen },
    ],
  },
  {
    title: "SEO Management",
    items: [
      { label: "Test Series SEO Audit", icon: ClipboardCheck, href: "/admin/seo/test-series", match: (p) => p === "/admin/seo/test-series" },
      { label: "SEO Dashboard", icon: BarChart3 },
      { label: "Content SEO Audit", icon: FileSearch },
      { label: "Sitemap Manager", icon: Map },
      { label: "Canonical Manager", icon: Link2 },
      { label: "Redirect Manager", icon: GitBranch },
      { label: "Noindex Manager", icon: ShieldOff },
      { label: "Schema Manager", icon: Code2 },
      { label: "Internal Linking", icon: Link2 },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Activity Logs", icon: History },
      { label: "Admin Users", icon: Users },
      { label: "Site Settings", icon: Settings },
    ],
  },
];
