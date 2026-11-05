"use client";

import { useMemo, useRef, useState } from "react";
import { Download, ExternalLink, ScanSearch } from "lucide-react";
import { Badge, Card, ErrorState, PageHeader, Skeleton } from "../../_components/ui";
import { Btn, Note, Pager, SearchBox, SelectBox, Table, csv, download, fmtDate, runPool, useAdminJson } from "../../_components/kit";
import { inspect, TARGETS, type InspectOutcome, type InspectTarget } from "../../_components/inspect";

type Sitemap = { name: string; urls: { loc: string; path: string; lastmod: string | null }[] };
const PAGE = 25;

function statusBadge(o: InspectOutcome | undefined) {
  if (!o) return <span className="text-xs text-slate-400">not checked</span>;
  if (!o.ok) return <Badge tone="rose">{o.error}</Badge>;
  const p = o.page;
  if (p.status >= 300 && p.status < 400) return <Badge tone="amber">{p.status} → {p.location}</Badge>;
  if (p.status !== 200) return <Badge tone="rose">{p.status}</Badge>;
  if (p.noindex) return <Badge tone="rose">200 · noindex</Badge>;
  return <Badge tone="emerald">200 · indexable</Badge>;
}

export default function SitemapManager() {
  const { data, error, loading, reload } = useAdminJson<Sitemap[]>("/api/admin/seo/sitemap");
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState<InspectTarget>("live");
  const [checks, setChecks] = useState<Record<string, InspectOutcome>>({});
  const [busy, setBusy] = useState(false);
  const stop = useRef(false);

  const all = useMemo(() => (data ?? []).flatMap((s) => s.urls.map((u) => ({ ...u, sitemap: s.name }))), [data]);
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((u) => (!name || u.sitemap === name) && (!term || u.path.toLowerCase().includes(term)));
  }, [all, name, q]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE);
  const problems = Object.values(checks).filter((o) => !o.ok || o.page.status !== 200 || o.page.noindex).length;

  const check = async (paths: string[]) => {
    setBusy(true);
    stop.current = false;
    await runPool(paths, 4, (p) => inspect(p, target), (p, r) => setChecks((c) => ({ ...c, [p]: r })), () => stop.current);
    setBusy(false);
  };

  return (
    <>
      <PageHeader
        title="Sitemap Manager"
        subtitle="Every URL the site lists in /sitemap.xml, generated live by the same code that serves the sitemaps."
        actions={
          <>
            <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              sitemap.xml <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <Btn onClick={() => download("sitemap-urls.csv", csv([["sitemap", "url", "lastmod"], ...rows.map((u) => [u.sitemap, u.loc, u.lastmod])]))} disabled={!rows.length}>
              <Download className="h-4 w-4" /> Export CSV
            </Btn>
          </>
        }
      />
      <Note>
        A sitemap should only list pages that answer 200 and are indexable. Use “Check this page” to fetch the listed URLs and spot
        redirects, 404s or noindex pages. Sitemap contents come from the site code, so this page does not edit them.
      </Note>
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Skeleton className="h-96" />}
      {data && (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => (setName(""), setPage(0))}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${!name ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600"}`}
            >
              All · {all.length.toLocaleString("en-IN")}
            </button>
            {data.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => (setName(s.name), setPage(0))}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${name === s.name ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600"}`}
              >
                {s.name} · {s.urls.length.toLocaleString("en-IN")}
              </button>
            ))}
          </div>
          <Card>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <SearchBox value={q} onChange={(v) => (setQ(v), setPage(0))} placeholder="Search URLs" />
              <SelectBox label="Check on" value={target} onChange={(v) => setTarget(v as InspectTarget)} options={TARGETS} />
              {busy ? (
                <Btn tone="danger" onClick={() => (stop.current = true)}>
                  Stop
                </Btn>
              ) : (
                <Btn tone="primary" onClick={() => check(shown.map((u) => u.path))} disabled={!shown.length}>
                  <ScanSearch className="h-4 w-4" /> Check this page
                </Btn>
              )}
              {Object.keys(checks).length > 0 && (
                <span className="text-sm text-slate-600">
                  {Object.keys(checks).length} checked · <span className={problems ? "font-semibold text-rose-600" : "text-emerald-700"}>{problems} problems</span>
                </span>
              )}
            </div>
            <Table head={["URL", "Sitemap", "Last modified", "Status"]} empty={!shown.length}>
              {shown.map((u) => (
                <tr key={u.loc}>
                  <td className="max-w-[420px] break-all px-5 py-2.5">
                    <a href={u.loc} target="_blank" rel="noreferrer" className="font-mono text-xs text-slate-700 hover:text-indigo-700">
                      {u.path}
                    </a>
                  </td>
                  <td className="px-5 py-2.5 text-slate-500">{u.sitemap}</td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-slate-500">{u.lastmod ? fmtDate(u.lastmod) : <Badge tone="amber">none</Badge>}</td>
                  <td className="px-5 py-2.5">{statusBadge(checks[u.path])}</td>
                </tr>
              ))}
            </Table>
            <Pager page={page} pages={pages} total={rows.length} onPage={setPage} />
          </Card>
        </>
      )}
    </>
  );
}
