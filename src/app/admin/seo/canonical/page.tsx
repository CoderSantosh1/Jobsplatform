"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import { Download, ScanSearch } from "lucide-react";
import { canonicalVerdict, type CanonicalVerdict } from "@/lib/admin-seo-checks";
import { Badge, Card, ErrorState, PageHeader, Skeleton } from "../../_components/ui";
import { Btn, Note, Pager, SelectBox, Table, csv, download, runPool, useAdminJson } from "../../_components/kit";
import { inspect, TARGETS, type InspectOutcome, type InspectTarget } from "../../_components/inspect";
import { DecisionBadge, DecisionControl, useReviews } from "../../_components/review";

type Sitemap = { name: string; urls: { loc: string; path: string; lastmod: string | null }[] };
type Checked = { path: string; outcome: InspectOutcome; verdict: CanonicalVerdict | "error" };
const PAGE = 25;
const ORIGIN = "https://www.sarkariresultsnow.com";

const VERDICT = {
  self: { label: "Self-canonical", tone: "emerald" },
  other: { label: "Points elsewhere", tone: "amber" },
  missing: { label: "Missing", tone: "rose" },
  error: { label: "Not checked", tone: "slate" },
} as const;

export default function CanonicalManager() {
  const maps = useAdminJson<Sitemap[]>("/api/admin/seo/sitemap");
  const reviews = useReviews("canonical");
  const [name, setName] = useState("jobs");
  const [limit, setLimit] = useState("50");
  const [target, setTarget] = useState<InspectTarget>("live");
  const [results, setResults] = useState<Record<string, Checked>>({});
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const stop = useRef(false);

  const urls = useMemo(() => maps.data?.find((s) => s.name === name)?.urls ?? [], [maps.data, name]);
  const rows = useMemo(() => Object.values(results).filter((r) => !filter || r.verdict === filter), [results, filter]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of Object.values(results)) c[r.verdict] = (c[r.verdict] ?? 0) + 1;
    return c;
  }, [results]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE);

  const run = async () => {
    const paths = urls.slice(0, limit === "all" ? urls.length : Number(limit)).map((u) => u.path);
    setResults({});
    setPage(0);
    setBusy(true);
    stop.current = false;
    await runPool(
      paths,
      4,
      (p) => inspect(p, target),
      (p, outcome) =>
        setResults((r) => ({
          ...r,
          [p]: { path: p, outcome, verdict: outcome.ok && outcome.page.status === 200 ? canonicalVerdict(p, outcome.page.canonical, ORIGIN) : "error" },
        })),
      () => stop.current,
    );
    setBusy(false);
  };

  return (
    <>
      <PageHeader
        title="Canonical Manager"
        subtitle="Fetch pages from a sitemap and check that each page's canonical tag points at itself."
        actions={
          <Btn
            disabled={!rows.length}
            onClick={() =>
              download(
                "canonical-check.csv",
                csv([["path", "verdict", "status", "canonical"], ...rows.map((r) => [r.path, r.verdict, r.outcome.ok ? r.outcome.page.status : r.outcome.error, r.outcome.ok ? r.outcome.page.canonical : ""])]),
              )
            }
          >
            <Download className="h-4 w-4" /> Export CSV
          </Btn>
        }
      />
      <Note>
        Duplicate posts (same title entered twice) intentionally point their canonical at the oldest copy, so “Points elsewhere” is
        expected for them. Recording a decision here does not change any canonical tag on the site.
      </Note>
      {maps.error && <ErrorState message={maps.error} onRetry={maps.reload} />}
      {maps.loading && !maps.data && <Skeleton className="h-40" />}
      {maps.data && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <SelectBox label="Sitemap" value={name} onChange={setName} options={maps.data.map((s) => ({ value: s.name, label: `${s.name} (${s.urls.length})` }))} />
            <SelectBox label="How many" value={limit} onChange={setLimit} options={["25", "50", "100", "250", "all"].map((v) => ({ value: v, label: v === "all" ? `All ${urls.length}` : `First ${v}` }))} />
            <SelectBox label="Check on" value={target} onChange={(v) => setTarget(v as InspectTarget)} options={TARGETS} />
            {busy ? (
              <Btn tone="danger" onClick={() => (stop.current = true)}>
                Stop ({Object.keys(results).length})
              </Btn>
            ) : (
              <Btn tone="primary" onClick={run} disabled={!urls.length}>
                <ScanSearch className="h-4 w-4" /> Check canonicals
              </Btn>
            )}
          </div>
          {Object.keys(results).length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {(["", "self", "other", "missing", "error"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => (setFilter(k), setPage(0))}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${filter === k ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600"}`}
                >
                  {k ? VERDICT[k].label : "All"} · {k ? counts[k] ?? 0 : Object.keys(results).length}
                </button>
              ))}
            </div>
          )}
          <Table head={["Page", "Canonical", "Result", "Decision", ""]} empty={!shown.length}>
            {shown.map((r) => (
              <Fragment key={r.path}>
                <tr>
                  <td className="max-w-[300px] break-all px-5 py-2.5 font-mono text-xs text-slate-700">{r.path}</td>
                  <td className="max-w-[300px] break-all px-5 py-2.5 font-mono text-xs text-slate-500">
                    {r.outcome.ok ? r.outcome.page.canonical ?? "—" : r.outcome.error}
                  </td>
                  <td className="px-5 py-2.5">
                    <Badge tone={VERDICT[r.verdict].tone}>{VERDICT[r.verdict].label}</Badge>
                    {r.outcome.ok && r.outcome.page.status !== 200 && <span className="ml-1 text-xs text-slate-500">HTTP {r.outcome.page.status}</span>}
                  </td>
                  <td className="px-5 py-2.5">
                    <DecisionBadge review={reviews.byPath.get(r.path)} />
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    {r.verdict !== "self" && (
                      <Btn onClick={() => setOpen(open === r.path ? null : r.path)}>{open === r.path ? "Close" : "Decide"}</Btn>
                    )}
                  </td>
                </tr>
                {open === r.path && (
                  <tr>
                    <td colSpan={5} className="px-5 pb-4">
                      <DecisionControl
                        kind="canonical"
                        path={r.path}
                        review={reviews.byPath.get(r.path)}
                        defaultTarget={r.path}
                        needsTarget
                        onSaved={reviews.reload}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </Table>
          {Object.keys(results).length > 0 && <Pager page={page} pages={pages} total={rows.length} onPage={setPage} />}
          {!Object.keys(results).length && !busy && <p className="text-sm text-slate-500">Pick a sitemap and press “Check canonicals”.</p>}
        </Card>
      )}
    </>
  );
}
