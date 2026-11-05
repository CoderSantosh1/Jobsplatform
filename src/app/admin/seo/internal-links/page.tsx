"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Link2, Unlink } from "lucide-react";
import type { AuditRow } from "@/lib/admin-seo-rules";
import { Badge, Card, ErrorState, PageHeader, Skeleton, StatCard } from "../../_components/ui";
import { Note, Pager, SearchBox, SelectBox, Table, useAdminJson } from "../../_components/kit";
import { InspectForm, type InspectOutcome } from "../../_components/inspect";

type Snapshot = { auditedAt: string; rows: AuditRow[] };
const PAGE = 25;

export default function InternalLinking() {
  const audit = useAdminJson<Snapshot>("/api/admin/seo/test-series");
  const [q, setQ] = useState("");
  const [band, setBand] = useState("weak");
  const [page, setPage] = useState(0);
  const [single, setSingle] = useState<{ path: string; outcome: InspectOutcome } | null>(null);

  const live = useMemo(() => (audit.data?.rows ?? []).filter((r) => r.status === 200), [audit.data]);
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return live
      .filter((r) => (band === "orphan" ? r.inlinks === 0 : band === "weak" ? r.inlinks <= 2 : true))
      .filter((r) => !term || r.path.includes(term) || r.name.toLowerCase().includes(term))
      .sort((a, b) => a.inlinks - b.inlinks || a.path.localeCompare(b.path));
  }, [live, q, band]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <>
      <PageHeader title="Internal Linking" subtitle="How many internal links point to each test-series page, and the links any page sends out." />
      <Note>
        Link counts come from the read-only crawl of /test-series (audit of {audit.data?.auditedAt ?? "…"}). Pages with few links are
        harder for search engines to discover; add links from related posts or category pages. Nothing is changed from here.
      </Note>
      {audit.error && <ErrorState message={audit.error} onRetry={audit.reload} />}
      {audit.loading && !audit.data && <Skeleton className="h-64" />}
      {audit.data && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Live test-series pages" value={live.length} icon={Link2} />
            <StatCard label="Orphan pages (0 links)" value={live.filter((r) => r.inlinks === 0).length} icon={Unlink} tone="rose" />
            <StatCard label="Weakly linked (≤ 2)" value={live.filter((r) => r.inlinks <= 2).length} icon={Link2} tone="amber" />
          </div>
          <Card title="Pages by incoming links">
            <div className="mb-4 flex flex-wrap gap-3">
              <SearchBox value={q} onChange={(v) => (setQ(v), setPage(0))} placeholder="Search pages" />
              <SelectBox
                label="Show"
                value={band}
                onChange={(v) => (setBand(v), setPage(0))}
                options={[
                  { value: "weak", label: "≤ 2 links" },
                  { value: "orphan", label: "Orphans (0)" },
                  { value: "all", label: "All pages" },
                ]}
              />
            </div>
            <Table head={["Page", "Category", "Incoming links", "Related posts", "In sitemap"]} empty={!shown.length}>
              {shown.map((r) => (
                <tr key={r.path}>
                  <td className="max-w-[320px] px-5 py-2.5">
                    <p className="font-medium text-slate-900">{r.name}</p>
                    <a href={r.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all font-mono text-xs text-slate-500 hover:text-indigo-700">
                      {r.path} <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-5 py-2.5 text-slate-600">{r.category}</td>
                  <td className="px-5 py-2.5">
                    <Badge tone={r.inlinks === 0 ? "rose" : r.inlinks <= 2 ? "amber" : "emerald"}>{r.inlinks}</Badge>
                  </td>
                  <td className="px-5 py-2.5 tabular-nums">{r.relatedPosts ?? "—"}</td>
                  <td className="px-5 py-2.5">{r.inSitemap ? <Badge tone="emerald">yes</Badge> : <Badge tone="slate">no</Badge>}</td>
                </tr>
              ))}
            </Table>
            <Pager page={page} pages={pages} total={rows.length} onPage={setPage} />
          </Card>
        </>
      )}

      <Card title="Outgoing links of a page" className="mt-6">
        <InspectForm onResult={(path, outcome) => setSingle({ path, outcome })} initial="/test-series" />
        {single && !single.outcome.ok && <p className="mt-3 text-sm text-rose-700">{single.outcome.error}</p>}
        {single && single.outcome.ok && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-slate-600">
              {single.outcome.page.internalLinks.length} unique internal links on <span className="font-mono">{single.path}</span>
            </p>
            <ul className="max-h-80 columns-1 gap-6 overflow-auto rounded-xl border border-slate-200 p-3 font-mono text-xs text-slate-700 sm:columns-2">
              {single.outcome.page.internalLinks.map((l) => (
                <li key={l} className="break-all py-0.5">
                  {l}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </>
  );
}
