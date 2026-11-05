"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import { ExternalLink, ScanSearch } from "lucide-react";
import type { AuditRow } from "@/lib/admin-seo-rules";
import { Badge, Card, ErrorState, PageHeader, Skeleton } from "../../_components/ui";
import { Btn, Note, SearchBox, SelectBox, Table, runPool, useAdminJson } from "../../_components/kit";
import { InspectForm, inspect, type InspectOutcome } from "../../_components/inspect";
import { DecisionBadge, DecisionControl, useReviews } from "../../_components/review";

type Snapshot = { auditedAt: string; rows: AuditRow[] };

function liveState(o?: InspectOutcome) {
  if (!o) return <span className="text-xs text-slate-400">not checked</span>;
  if (!o.ok) return <Badge tone="rose">{o.error}</Badge>;
  if (o.page.status !== 200) return <Badge tone="slate">HTTP {o.page.status}</Badge>;
  return o.page.noindex ? <Badge tone="rose">noindex</Badge> : <Badge tone="emerald">indexable</Badge>;
}

export default function NoindexManager() {
  const audit = useAdminJson<Snapshot>("/api/admin/seo/test-series");
  const reviews = useReviews("noindex");
  const [q, setQ] = useState("");
  const [decision, setDecision] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [live, setLive] = useState<Record<string, InspectOutcome>>({});
  const [busy, setBusy] = useState(false);
  const [single, setSingle] = useState<{ path: string; outcome: InspectOutcome } | null>(null);
  const stop = useRef(false);

  // Audit candidates plus any other path an admin has already recorded a noindex decision for.
  const rows = useMemo(() => {
    const list: { path: string; name: string; reason: string; sharedPct: number | null }[] = (audit.data?.rows ?? [])
      .filter((r) => r.action === "NOINDEX")
      .map((r) => ({ path: r.path, name: r.name, reason: r.reason, sharedPct: r.sharedPct }));
    const known = new Set(list.map((r) => r.path));
    for (const r of reviews.data ?? []) if (!known.has(r.path)) list.push({ path: r.path, name: r.path, reason: "Added by an admin", sharedPct: null });
    const term = q.trim().toLowerCase();
    return list.filter((r) => {
      const d = reviews.byPath.get(r.path)?.decision ?? "none";
      return (!decision || d === decision) && (!term || r.path.includes(term) || r.name.toLowerCase().includes(term));
    });
  }, [audit.data, reviews.data, reviews.byPath, q, decision]);

  const checkAll = async () => {
    setBusy(true);
    stop.current = false;
    await runPool(rows.map((r) => r.path), 4, (p) => inspect(p, "live"), (p, o) => setLive((l) => ({ ...l, [p]: o })), () => stop.current);
    setBusy(false);
  };

  return (
    <>
      <PageHeader title="Noindex Manager" subtitle="Review pages recommended for noindex. Nothing is noindexed automatically." />
      <Note tone="amber">
        Approving records your decision only. The live robots tag of a page changes only after the site code is updated for the
        approved list and deployed. Pages whose questions are later made exam-specific should be rejected, not noindexed.
      </Note>

      <Card title="Check any page" className="mb-6">
        <InspectForm onResult={(path, outcome) => setSingle({ path, outcome })} />
        {single && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-mono text-xs">{single.path}</span>
            {liveState(single.outcome)}
            {single.outcome.ok && (
              <span className="text-slate-500">
                robots: {single.outcome.page.robots ?? "—"}
                {single.outcome.page.xRobotsTag ? ` · X-Robots-Tag: ${single.outcome.page.xRobotsTag}` : ""}
              </span>
            )}
            <Btn onClick={() => setOpen(open === single.path ? null : single.path)}>Record decision</Btn>
          </div>
        )}
        {single && open === single.path && !rows.some((r) => r.path === single.path) && (
          <div className="mt-3">
            <DecisionControl kind="noindex" path={single.path} review={reviews.byPath.get(single.path)} onSaved={reviews.reload} />
          </div>
        )}
      </Card>

      {(audit.error || reviews.error) && <ErrorState message={audit.error || reviews.error} onRetry={() => (audit.reload(), reviews.reload())} />}
      {audit.loading && !audit.data && <Skeleton className="h-96" />}
      {audit.data && (
        <Card title={`Candidates (${rows.length})`}>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <SearchBox value={q} onChange={setQ} placeholder="Search exam or path" />
            <SelectBox
              label="Decision"
              value={decision}
              onChange={setDecision}
              options={[
                { value: "", label: "Any decision" },
                { value: "none", label: "No decision yet" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
                { value: "pending", label: "Pending" },
              ]}
            />
            {busy ? (
              <Btn tone="danger" onClick={() => (stop.current = true)}>
                Stop
              </Btn>
            ) : (
              <Btn onClick={checkAll} disabled={!rows.length}>
                <ScanSearch className="h-4 w-4" /> Check live robots
              </Btn>
            )}
          </div>
          <Table head={["Page", "Why", "Live now", "Decision", ""]} empty={!rows.length}>
            {rows.map((r) => (
              <Fragment key={r.path}>
                <tr className="align-top">
                  <td className="max-w-[260px] px-5 py-3">
                    <p className="font-medium text-slate-900">{r.name}</p>
                    <a href={r.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all font-mono text-xs text-slate-500 hover:text-indigo-700">
                      {r.path} <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="max-w-[340px] px-5 py-3 text-slate-600">{r.reason}</td>
                  <td className="px-5 py-3">{liveState(live[r.path])}</td>
                  <td className="px-5 py-3">
                    <DecisionBadge review={reviews.byPath.get(r.path)} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Btn onClick={() => setOpen(open === r.path ? null : r.path)}>{open === r.path ? "Close" : "Decide"}</Btn>
                  </td>
                </tr>
                {open === r.path && (
                  <tr>
                    <td colSpan={5} className="px-5 pb-4">
                      <DecisionControl kind="noindex" path={r.path} review={reviews.byPath.get(r.path)} onSaved={reviews.reload} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </Table>
          <p className="mt-3 text-xs text-slate-500">Candidates from the test-series audit of {audit.data.auditedAt}.</p>
        </Card>
      )}
    </>
  );
}
