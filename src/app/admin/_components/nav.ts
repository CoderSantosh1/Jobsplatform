// Admin sidebar structure. An item without `href` is shown as "Soon" so nothing links to a missing page.
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
  Network,
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

const page = (href: string): Pick<NavItem, "href" | "match"> => ({ href, match: (path) => path === href });

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
      { label: "Question Bank", icon: Library, ...page("/admin/questions") },
      { label: "Exam Categories", icon: BookOpen, ...page("/admin/exam-categories") },
    ],
  },
  {
    title: "SEO Management",
    items: [
      { label: "SEO Dashboard", icon: BarChart3, ...page("/admin/seo") },
      { label: "Test Series SEO Audit", icon: ClipboardCheck, ...page("/admin/seo/test-series") },
      { label: "Content SEO Audit", icon: FileSearch, ...page("/admin/seo/content") },
      { label: "Sitemap Manager", icon: Map, ...page("/admin/seo/sitemap") },
      { label: "Canonical Manager", icon: Link2, ...page("/admin/seo/canonical") },
      { label: "Redirect Manager", icon: GitBranch, ...page("/admin/seo/redirects") },
      { label: "Noindex Manager", icon: ShieldOff, ...page("/admin/seo/noindex") },
      { label: "Schema Manager", icon: Code2, ...page("/admin/seo/schema") },
      { label: "Internal Linking", icon: Network, ...page("/admin/seo/internal-links") },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Activity Logs", icon: History, ...page("/admin/activity") },
      { label: "Admin Users", icon: Users, ...page("/admin/users") },
      { label: "Site Settings", icon: Settings, ...page("/admin/settings") },
    ],
  },
];
