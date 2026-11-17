"use client";

import { Fragment, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, Download, ExternalLink, Info, ListChecks, Search } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { auditCsv, filterAuditRows, uniquePct, type AuditFilters, type AuditRow } from "@/lib/admin-seo-rules";
import { Badge, Card, ErrorState, PageHeader, Skeleton, type Tone } from "../../_components/ui";

type Row = AuditRow & { completeness: number | null };
type Snapshot = { auditedAt: string; source: string; method: string; rows: Row[] };

const ACTIONS: { key: string; label: string; tone: Tone; help: string }[] = [
  { key: "KEEP", label: "Keep", tone: "emerald", help: "Category hubs to index." },
  { key: "IMPROVE", label: "Improve", tone: "indigo", help: "Working tests, but mostly shared questions and template text." },
  { key: "NOINDEX", label: "Noindex candidate", tone: "rose", help: "Almost all questions shared with other exams and no related posts." },
  { key: "CONSOLIDATE", label: "Consolidate", tone: "amber", help: "Same exam and title under two categories." },
  { key: "NONE (404)", label: "Already 404", tone: "slate", help: "Removed from the quiz data; nothing to do." },
];
const toneOf = (a: string) => ACTIONS.find((x) => x.key === a)?.tone ?? "slate";
const labelOf = (a: string) => ACTIONS.find((x) => x.key === a)?.label ?? a;
const PAGE = 25;

const COLUMNS: { key: AuditFilters["sort"]; label: string; className?: string }[] = [
  { key: "name", label: "Exam / page" },
  { key: "category", label: "Category" },
  { key: "uniquePct", label: "Unique Q%", className: "text-right" },
  { key: "sharedPct", label: "Shared Q%", className: "text-right" },
  { key: "completeness", label: "Completeness", className: "text-right" },
  { key: "inlinks", label: "Internal links", className: "text-right" },
  { key: "relatedPosts", label: "Related posts", className: "text-right" },
  { key: "action", label: "Recommendation" },
];

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function AuditTable() {
  const params = useSearchParams();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<AuditFilters>({ action: params?.get("action") ?? "", sort: "action", dir: "asc" });
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [consolidatePreview, setConsolidatePreview] = useState<{
    sourcePath: string;
    destinationPath: string;
    sourceQuizCount: number;
    destinationQuizCount: number;
    sourceQuestionCount: number;
    sourceAttemptCount: number;
    duplicateQuizTitles: string[];
  }[] | null>(null);
  const [consolidateBusy, setConsolidateBusy] = useState(false);
  const [consolidateMsg, setConsolidateMsg] = useState("");

  const loadConsolidatePreview = async () => {
    setConsolidateBusy(true);
    setConsolidateMsg("");
    try {
      const res = await adminFetch("/api/admin/seo/test-series/consolidate", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || "Could not load consolidation preview.");
      setConsolidatePreview(json.data?.pairs ?? []);
    } catch (e) {
      setConsolidateMsg(e instanceof Error ? e.message : "Could not load consolidation preview.");
    } finally {
      setConsolidateBusy(false);
    }
  };

  const runConsolidate = async () => {
    setConsolidateBusy(true);
    setConsolidateMsg("");
    try {
      const res = await adminFetch("/api/admin/seo/test-series/consolidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || "Consolidation failed.");
      setConsolidateMsg(`Migrated ${json.data.migratedQuizzes} quiz(zes) across ${json.data.pairsChecked} pairs.`);
      setConsolidatePreview(null);
      load();
    } catch (e) {
      setConsolidateMsg(e instanceof Error ? e.message : "Consolidation failed.");
    } finally {
      setConsolidateBusy(false);
    }
  };

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await adminFetch("/api/admin/seo/test-series", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || "Could not load the audit.");
      setSnap(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the audit.");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => (snap ? filterAuditRows(snap.rows, filters) : []), [snap, filters]);
  const categories = useMemo(() => (snap ? [...new Set(snap.rows.map((r) => r.category))].sort() : []), [snap]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of snap?.rows ?? []) c[r.action] = (c[r.action] ?? 0) + 1;
    return c;
  }, [snap]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE);

  const set = (patch: Partial<AuditFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(0);
  };
  const sortBy = (key: AuditFilters["sort"]) =>
    setFilters((f) => ({ ...f, sort: key, dir: f.sort === key && f.dir === "asc" ? "desc" : "asc" }));

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => set({ action: filters.action === a.key ? "" : a.key })}
            aria-pressed={filters.action === a.key}
            className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition-colors ${
              filters.action === a.key ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-200"
            }`}
          >
            <Badge tone={a.tone}>{a.label}</Badge>
            <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{snap ? counts[a.key] ?? 0 : "–"}</p>
            <p className="mt-0.5 text-xs text-slate-500">{a.help}</p>
          </button>
        ))}
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.q ?? ""}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Search exam name or URL"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <select
            value={filters.category ?? ""}
            onChange={(e) => set({ category: e.target.value })}
            aria-label="Category"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={filters.action ?? ""} onChange={(e) => set({ action: e.target.value })} aria-label="Recommendation" className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">All recommendations</option>
            {ACTIONS.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label}
              </option>
            ))}
          </select>
          <select value={filters.type ?? ""} onChange={(e) => set({ type: e.target.value })} aria-label="Page type" className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">Exam and category pages</option>
            <option value="exam">Exam pages</option>
            <option value="category">Category pages</option>
          </select>
          <button
            type="button"
            disabled={!rows.length}
            onClick={() => download(`test-series-seo-audit-${snap?.auditedAt}.csv`, auditCsv(rows))}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        <div className="-mx-5 mt-4 overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {COLUMNS.map((c) => (
                  <th key={String(c.key)} className={`px-3 py-2.5 first:pl-5 ${c.className ?? ""}`}>
                    <button type="button" onClick={() => sortBy(c.key)} className="inline-flex items-center gap-1 hover:text-slate-800">
                      {c.label}
                      <ArrowUpDown className={`h-3 w-3 ${filters.sort === c.key ? "text-indigo-600" : "text-slate-300"}`} />
                    </button>
                  </th>
                ))}
                <th className="px-3 py-2.5">Review</th>
                <th className="px-5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!snap &&
                Array.from({ length: 8 }, (_, i) => (
                  <tr key={i}>
                    <td colSpan={10} className="px-5 py-2">
                      <Skeleton className="h-8" />
                    </td>
                  </tr>
                ))}
              {snap && !shown.length && (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-slate-500">
                    No pages match these filters.
                  </td>
                </tr>
              )}
              {shown.map((r) => {
                const u = uniquePct(r);
                const expanded = open === r.path;
                return (
                  <Fragment key={r.path}>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-3 py-3 pl-5">
                        <p className="font-medium text-slate-900">{r.name}</p>
                        <p className="max-w-[300px] truncate text-xs text-slate-500">{r.path}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{r.category}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{u === null ? "–" : `${u}%`}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{r.sharedPct === null ? "–" : `${r.sharedPct}%`}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{r.completeness === null ? "–" : `${r.completeness}/5`}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{r.inlinks}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-700">{r.relatedPosts ?? "–"}</td>
                      <td className="px-3 py-3">
                        <Badge tone={toneOf(r.action)}>{labelOf(r.action)}</Badge>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">Not reviewed</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setOpen(expanded ? null : r.path)}
                            aria-expanded={expanded}
                            title="Review recommendation"
                            className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                          </button>
                          {r.status === 200 && (
                            <a href={r.path} target="_blank" rel="noopener noreferrer" title="View page" className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          <Link href="/admin/quizzes" title="Inspect questions and edit tests" className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600">
                            <ListChecks className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b border-slate-100 bg-indigo-50/30">
                        <td colSpan={10} className="px-5 py-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="md:col-span-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Why</p>
                              <p className="mt-1 text-sm text-slate-800">{r.reason}</p>
                              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600 sm:grid-cols-4">
                                <div>
                                  <dt className="text-slate-400">Tests</dt>
                                  <dd className="tabular-nums">{r.tests ?? "–"}</dd>
                                </div>
                                <div>
                                  <dt className="text-slate-400">Sample Qs shown elsewhere</dt>
                                  <dd className="tabular-nums">{r.reusedSamples === null ? "–" : `${r.reusedSamples}/4`}</dd>
                                </div>
                                <div>
                                  <dt className="text-slate-400">Template text</dt>
                                  <dd className="tabular-nums">{r.templatePct === null ? "–" : `${r.templatePct}%`}</dd>
                                </div>
                                <div>
                                  <dt className="text-slate-400">In sitemap</dt>
                                  <dd>{r.inSitemap ? "Yes" : "No"}</dd>
                                </div>
                              </dl>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                              <p className="text-xs font-semibold text-slate-700">Approve action</p>
                              <p className="mt-1 text-xs text-slate-500">
                                Nothing is changed from this page. Approving, noindexing, merging or redirecting needs the review
                                log (next phase) and your explicit confirmation for each page.
                              </p>
                              <button type="button" disabled className="mt-2 w-full cursor-not-allowed rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400">
                                Approve (not available yet)
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
          <span>
            {rows.length ? `Showing ${page * PAGE + 1}–${Math.min(rows.length, (page + 1) * PAGE)} of ${rows.length}` : "0 pages"}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} aria-label="Previous page" className="rounded-lg border border-slate-200 p-2 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 tabular-nums">
              {page + 1} / {pages}
            </span>
            <button type="button" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} aria-label="Next page" className="rounded-lg border border-slate-200 p-2 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      <Card title="Test-Series Consolidation (6 Overlapping Pages)" className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Preview database quizzes, questions, and attempts before safely reassigning the 6 overlapping subcategories. All IDs and historical attempts are preserved.
          </p>
          <button
            type="button"
            disabled={consolidateBusy}
            onClick={loadConsolidatePreview}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
          >
            {consolidateBusy ? "Loading..." : "Preview Consolidation"}
          </button>
        </div>
        {consolidateMsg && <p className="mt-3 text-sm font-medium text-indigo-700">{consolidateMsg}</p>}
        {consolidatePreview && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50 text-slate-500">
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Destination</th>
                  <th className="px-3 py-2 text-right">Src Quizzes</th>
                  <th className="px-3 py-2 text-right">Questions</th>
                  <th className="px-3 py-2 text-right">Attempts</th>
                  <th className="px-3 py-2 text-right">Duplicates</th>
                </tr>
              </thead>
              <tbody>
                {consolidatePreview.map((p) => (
                  <tr key={p.sourcePath} className="border-b border-slate-50">
                    <td className="px-3 py-2 font-mono text-slate-700">{p.sourcePath}</td>
                    <td className="px-3 py-2 font-mono text-slate-700">{p.destinationPath}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.sourceQuizCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.sourceQuestionCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.sourceAttemptCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.duplicateQuizTitles.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConsolidatePreview(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={consolidateBusy}
                onClick={runConsolidate}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Confirm &amp; Consolidate
              </button>
            </div>
          </div>
        )}
      </Card>

      {snap && (
        <p className="mt-4 flex gap-2 text-xs text-slate-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {snap.source} {snap.method}
          </span>
        </p>
      )}
    </>
  );
}


export default function TestSeriesAuditPage() {
  return (
    <div>
      <PageHeader
        title="Test Series SEO Audit"
        subtitle="Which test-series pages to keep, improve, consolidate or noindex, with the evidence for each. Read-only: nothing here changes the site."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <AuditTable />
      </Suspense>
    </div>
  );
}
