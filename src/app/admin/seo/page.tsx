"use client";

import Link from "next/link";
import { BarChart3, ClipboardCheck, HeartPulse, Code2, FileSearch, GitBranch, Link2, Map, ShieldOff } from "lucide-react";
import { ISSUE_LABEL, type ContentIssue } from "@/lib/admin-seo-checks";
import { Card, ErrorState, PageHeader, Skeleton, StatCard } from "../_components/ui";
import { Note, useAdminJson } from "../_components/kit";

type Summary = {
  content: { total: number; issues: Record<string, number>; bySection: Record<string, { total: number; withIssues: number }> };
  sitemaps: { name: string; count: number; missingLastmod: number }[];
  testSeries: { auditedAt: string; total: number; counts: Record<string, number> };
  reviews: { kind: string; decision: string; count: number }[];
};

const TOOLS = [
  { href: "/admin/seo/health", label: "Page Health", icon: HeartPulse, text: "Check every sitemap page for indexing and thin content" },
  { href: "/admin/seo/content", label: "Content SEO Audit", icon: FileSearch, text: "Titles and descriptions of every post" },
  { href: "/admin/seo/test-series", label: "Test Series SEO Audit", icon: ClipboardCheck, text: "Thin and duplicate exam pages" },
  { href: "/admin/seo/sitemap", label: "Sitemap Manager", icon: Map, text: "Every URL in the sitemaps" },
  { href: "/admin/seo/canonical", label: "Canonical Manager", icon: Link2, text: "Check canonical tags in bulk" },
  { href: "/admin/seo/noindex", label: "Noindex Manager", icon: ShieldOff, text: "Review noindex candidates" },
  { href: "/admin/seo/redirects", label: "Redirect Manager", icon: GitBranch, text: "Live redirects and proposals" },
  { href: "/admin/seo/schema", label: "Schema Manager", icon: Code2, text: "Structured data on a page" },
  { href: "/admin/seo/internal-links", label: "Internal Linking", icon: Link2, text: "Weakly linked pages" },
];

export default function SeoDashboard() {
  const { data, error, loading, reload } = useAdminJson<Summary>("/api/admin/seo/summary");

  return (
    <>
      <PageHeader title="SEO Dashboard" subtitle="Internal checks of this site's pages. These are our own rules, not Google's ranking or indexing decisions." />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}
      {data && <Body data={data} />}
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">Tools</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow">
            <t.icon className="h-5 w-5 text-indigo-600" />
            <p className="mt-2 font-semibold text-slate-900">{t.label}</p>
            <p className="text-sm text-slate-500">{t.text}</p>
          </Link>
        ))}
      </div>
    </>
  );
}

function Body({ data }: { data: Summary }) {
  const sitemapTotal = data.sitemaps.reduce((n, s) => n + s.count, 0);
  const withIssues = Object.values(data.content.bySection).reduce((n, s) => n + s.withIssues, 0);
  const pending = (kind: string) => data.reviews.filter((r) => r.kind === kind && r.decision === "approved").reduce((n, r) => n + r.count, 0);
  const ts = data.testSeries.counts;
  const issueRows = (Object.entries(data.content.issues) as [ContentIssue, number][]).sort((a, b) => b[1] - a[1]);
  const maxIssue = Math.max(1, ...issueRows.map(([, n]) => n));
  const maxMap = Math.max(1, ...data.sitemaps.map((s) => s.count));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="URLs in sitemaps" value={sitemapTotal.toLocaleString("en-IN")} icon={Map} hint={`${data.sitemaps.length} child sitemaps`} />
        <StatCard label="Posts with SEO issues" value={withIssues.toLocaleString("en-IN")} icon={FileSearch} tone="amber" hint={`of ${data.content.total.toLocaleString("en-IN")} posts`} />
        <StatCard
          label="Test-series pages to fix"
          value={((ts.IMPROVE ?? 0) + (ts.NOINDEX ?? 0) + (ts.CONSOLIDATE ?? 0)).toLocaleString("en-IN")}
          icon={ClipboardCheck}
          tone="rose"
          hint={`audit of ${data.testSeries.auditedAt}`}
        />
        <StatCard label="Approved decisions" value={pending("noindex") + pending("redirect") + pending("canonical")} icon={BarChart3} tone="emerald" hint="waiting to be applied" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Content issues" icon={FileSearch} actions={<Link href="/admin/seo/content" className="text-sm font-medium text-indigo-600 hover:underline">Open audit</Link>}>
          {issueRows.length === 0 ? (
            <p className="text-sm text-slate-500">No issues found.</p>
          ) : (
            <ul className="space-y-3">
              {issueRows.map(([k, n]) => (
                <li key={k}>
                  <Link href={`/admin/seo/content?issue=${k}`} className="group block">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700 group-hover:text-indigo-700">{ISSUE_LABEL[k] ?? k}</span>
                      <span className="tabular-nums text-slate-500">{n.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${(n / maxIssue) * 100}%` }} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Sitemaps" icon={Map} actions={<Link href="/admin/seo/sitemap" className="text-sm font-medium text-indigo-600 hover:underline">Open sitemap manager</Link>}>
          <ul className="space-y-3">
            {data.sitemaps.map((s) => (
              <li key={s.name}>
                <div className="flex justify-between text-sm">
                  <span className="font-mono text-slate-700">{s.name}.xml</span>
                  <span className="tabular-nums text-slate-500">
                    {s.count.toLocaleString("en-IN")}
                    {s.missingLastmod ? ` · ${s.missingLastmod} without date` : ""}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${(s.count / maxMap) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="mt-6">
        <Note>
          Approving a recommendation in these tools only records your decision. Nothing on the public site (noindex, redirects,
          canonicals, sitemap) changes until that change is made in the site code and deployed.
        </Note>
      </div>
    </>
  );
}
