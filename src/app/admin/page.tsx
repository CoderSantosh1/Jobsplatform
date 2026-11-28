"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  ClipboardCheck,
  CreditCard,
  ExternalLink,
  FileText,
  Layers,
  PencilLine,
  PieChart,
  Plus,
  Trophy,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { Badge, Card, ErrorState, PageHeader, Skeleton, StatCard } from "./_components/ui";

type Row = { id: string; kind: string; label: string; title: string; status: string; date: string; url: string; adminTab: string };
type Overview = {
  generatedAt: string;
  totals: Record<string, { label: string; total: number; statuses: Record<string, number> }>;
  drafts: number;
  testSeriesPages: number;
  activity: ({ day: string } & Record<string, number>)[];
  recent: Row[];
  updated: Row[];
  seo: { auditedAt: string; total: number; counts: Record<string, number> };
};

const KIND_LABELS: Record<string, string> = {
  jobs: "Jobs",
  results: "Results",
  "admit-cards": "Admit Cards",
  "answer-keys": "Answer Keys",
  admissions: "Admissions",
  quizzes: "Mock Tests",
};
const fmt = new Intl.NumberFormat("en-IN");
const dateFmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function statusTone(status: string) {
  return status === "published" ? "emerald" : status === "draft" ? "amber" : "slate";
}

/** One bar per day (total posts created); hover or focus shows the split by content type. */
function ActivityChart({ activity }: { activity: Overview["activity"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const totals = activity.map((d) => Object.entries(d).reduce((n, [k, v]) => (k === "day" ? n : n + Number(v)), 0));
  const max = Math.max(1, ...totals);
  const sum = totals.reduce((a, b) => a + b, 0);
  const ticks = [0, Math.ceil(max / 2), max];
  const H = 160;
  const active = hover ?? null;

  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">
        {fmt.format(sum)} posts created in the last 30 days
      </p>
      <div className="relative flex gap-2">
        <div className="flex flex-col justify-between text-right text-[11px] tabular-nums text-slate-400" style={{ height: H }}>
          {[...ticks].reverse().map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0 border-t border-slate-100" />
          <div className="absolute inset-x-0 border-t border-slate-100" style={{ top: H / 2 }} />
          <div className="relative flex items-end gap-[2px] border-b border-slate-200" style={{ height: H }} role="img" aria-label={`Posts created per day, last 30 days; ${sum} in total`}>
            {activity.map((d, i) => (
              <button
                key={d.day}
                type="button"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={`${dateFmt(d.day)}: ${totals[i]} posts`}
                className="group flex h-full flex-1 items-end"
              >
                <span
                  className={`block w-full rounded-t-[4px] transition-colors ${active === i ? "bg-indigo-700" : "bg-indigo-500"} ${totals[i] ? "" : "opacity-0"}`}
                  style={{ height: `${(totals[i] / max) * 100}%`, minHeight: totals[i] ? 3 : 0 }}
                />
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
            <span>{dateFmt(activity[0].day)}</span>
            <span>{dateFmt(activity[activity.length - 1].day)}</span>
          </div>
          {active !== null && (
            <div
              className="pointer-events-none absolute z-10 w-44 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg"
              style={{ left: `${((active + 0.5) / activity.length) * 100}%`, bottom: H + 12 }}
            >
              <p className="font-semibold text-slate-900">{dateFmt(activity[active].day)}</p>
              <p className="mb-1 text-slate-500">{totals[active]} posts</p>
              {Object.entries(activity[active])
                .filter(([k, v]) => k !== "day" && Number(v) > 0)
                .map(([k, v]) => (
                  <p key={k} className="flex justify-between text-slate-700">
                    <span>{KIND_LABELS[k] ?? k}</span>
                    <span className="tabular-nums">{v}</span>
                  </p>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Distribution({ totals }: { totals: Overview["totals"] }) {
  const rows = Object.entries(totals).map(([k, v]) => ({ k, label: KIND_LABELS[k] ?? v.label, n: v.total })).sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...rows.map((r) => r.n));
  const all = rows.reduce((n, r) => n + r.n, 0);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.k}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium text-slate-700">{r.label}</span>
            <span className="tabular-nums text-slate-500">
              {fmt.format(r.n)} · {all ? Math.round((100 * r.n) / all) : 0}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${(r.n / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function PostsTable({ rows, dateLabel }: { rows: Row[]; dateLabel: string }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-slate-500">Nothing here yet.</p>;
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-5 py-2.5">Title</th>
            <th className="px-3 py-2.5">Type</th>
            <th className="px-3 py-2.5">{dateLabel}</th>
            <th className="px-3 py-2.5">Status</th>
            <th className="px-5 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.kind}-${r.id}`} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
              <td className="max-w-[340px] px-5 py-3 font-medium text-slate-900">
                <span className="line-clamp-2">{r.title}</span>
              </td>
              <td className="px-3 py-3 text-slate-600">{r.label}</td>
              <td className="whitespace-nowrap px-3 py-3 tabular-nums text-slate-600">{dateFmt(r.date)}</td>
              <td className="px-3 py-3">
                <Badge tone={statusTone(r.status)}>{r.status}</Badge>
              </td>
              <td className="px-5 py-3">
                <div className="flex justify-end gap-1">
                  <Link href={`/admin/content?tab=${r.adminTab}`} title="Manage" className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600">
                    <PencilLine className="h-4 w-4" />
                  </Link>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" title="View on site" className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const QUICK = [
  { label: "Create Job", href: "/admin/content?tab=jobs", icon: Briefcase },
  { label: "Create Result", href: "/admin/content?tab=results", icon: Trophy },
  { label: "Create Admit Card", href: "/admin/content?tab=admit-cards", icon: CreditCard },
  { label: "Add Test Series", href: "/admin/quizzes/create", icon: Layers },
  { label: "SEO Audit", href: "/admin/seo/test-series", icon: ClipboardCheck },
];

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await adminFetch("/api/admin/overview", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || "Could not load dashboard data.");
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load dashboard data.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const t = data?.totals;
  const posts = t ? ["jobs", "results", "admit-cards", "answer-keys", "admissions"].reduce((n, k) => n + (t[k]?.total ?? 0), 0) : 0;
  const seoIssues = data ? (data.seo.counts.NOINDEX ?? 0) + (data.seo.counts.CONSOLIDATE ?? 0) + (data.seo.counts.IMPROVE ?? 0) : 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={data ? `Live data from the database · updated ${new Date(data.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : "Overview of content and SEO"}
        actions={
          <button type="button" onClick={load} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            Refresh
          </button>
        }
      />

      {error && <ErrorState message={error} onRetry={load} />}

      {!error && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {!data ? (
              Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-[92px]" />)
            ) : (
              <>
                <StatCard label="Total Posts" value={fmt.format(posts)} hint="Jobs, results, admit cards, answer keys, admissions" icon={FileText} />
                <StatCard label="Published Jobs" value={fmt.format(t!.jobs.statuses.published ?? 0)} hint={`${fmt.format(t!.jobs.total)} jobs in total`} icon={Briefcase} tone="blue" />
                <StatCard label="Results" value={fmt.format(t!.results.total)} icon={Trophy} tone="amber" />
                <StatCard label="Admit Cards" value={fmt.format(t!["admit-cards"].total)} icon={CreditCard} tone="violet" />
                <StatCard label="Answer Keys" value={fmt.format(t!["answer-keys"]?.total ?? 0)} icon={FileText} tone="emerald" />
                <StatCard label="Test Series Pages" value={fmt.format(data.testSeriesPages)} hint={`${fmt.format(t!.quizzes.total)} mock tests`} icon={Layers} />
                <StatCard label="Draft Content" value={fmt.format(data.drafts)} hint="Across all content types" icon={PencilLine} tone="slate" />
                <StatCard label="SEO Issues" value={fmt.format(seoIssues)} hint={`Test-series audit of ${dateFmt(data.seo.auditedAt)}`} icon={AlertTriangle} tone="rose" />
              </>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card title="Publishing Activity" icon={BarChart3} className="xl:col-span-2">
              {data ? <ActivityChart activity={data.activity} /> : <Skeleton className="h-48" />}
            </Card>
            <Card title="Content Distribution" icon={PieChart}>
              {data ? <Distribution totals={data.totals} /> : <Skeleton className="h-48" />}
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card title="Recent Posts" icon={FileText} className="xl:col-span-2">
              {data ? <PostsTable rows={data.recent} dateLabel="Created" /> : <Skeleton className="h-64" />}
            </Card>
            <div className="space-y-6">
              <Card
                title="SEO Issues"
                icon={AlertTriangle}
                actions={
                  <Link href="/admin/seo/test-series" className="text-sm font-semibold text-indigo-600 hover:underline">
                    View audit
                  </Link>
                }
              >
                {data ? (
                  <ul className="space-y-2 text-sm">
                    {[
                      ["NOINDEX", "Noindex candidates", "rose"],
                      ["CONSOLIDATE", "Duplicate URLs to consolidate", "amber"],
                      ["IMPROVE", "Pages needing better content", "indigo"],
                      ["NONE (404)", "Already returning 404", "slate"],
                    ].map(([key, label, tone]) => (
                      <li key={key}>
                        <Link
                          href={`/admin/seo/test-series?action=${encodeURIComponent(key)}`}
                          className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 hover:border-indigo-200 hover:bg-indigo-50/40"
                        >
                          <span className="text-slate-700">{label}</span>
                          <Badge tone={tone as "rose"}>{fmt.format(data.seo.counts[key] ?? 0)}</Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Skeleton className="h-40" />
                )}
                <p className="mt-3 text-xs text-slate-500">
                  From the test-series audit of {data ? dateFmt(data.seo.auditedAt) : "…"}. These are recommendations, not Google&apos;s decisions.
                </p>
              </Card>
              <Card title="Quick Actions" icon={Plus}>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK.map((q) => (
                    <Link
                      key={q.label}
                      href={q.href}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 px-2 py-3 text-center text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700"
                    >
                      <q.icon className="h-5 w-5 text-indigo-600" />
                      {q.label}
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <div className="mt-6">
            <Card title="Recently Updated" icon={PencilLine}>
              {data ? <PostsTable rows={data.updated} dateLabel="Updated" /> : <Skeleton className="h-48" />}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
