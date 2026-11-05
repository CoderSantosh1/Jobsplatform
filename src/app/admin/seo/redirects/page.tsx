"use client";

import { Fragment, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { redirectProblems } from "@/lib/admin-seo-checks";
import { Badge, Card, ErrorState, PageHeader, Skeleton } from "../../_components/ui";
import { Btn, Note, Table, useAdminJson } from "../../_components/kit";
import { DecisionBadge, DecisionControl, useReviews } from "../../_components/review";

type Data = {
  live: { source: string; destination: string; permanent?: boolean; conditional: boolean }[];
  suggestions: { from: string; to: string; reason: string }[];
};

export default function RedirectManager() {
  const { data, error, loading, reload } = useAdminJson<Data>("/api/admin/seo/redirects");
  const reviews = useReviews("redirect");
  const [open, setOpen] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [adding, setAdding] = useState(false);

  const proposals = useMemo(() => {
    const list = (data?.suggestions ?? []).map((s) => ({ ...s, source: "Audit: consolidate" }));
    const known = new Set(list.map((s) => s.from));
    for (const r of reviews.data ?? []) if (!known.has(r.path)) list.push({ from: r.path, to: r.target, reason: r.note || "Added by an admin", source: "Admin" });
    return list;
  }, [data, reviews.data]);

  const existing = useMemo(
    () => [
      ...(data?.live ?? []).filter((r) => !r.conditional && !r.source.includes(":")).map((r) => ({ from: r.source, to: r.destination })),
      ...(reviews.data ?? []).filter((r) => r.decision === "approved").map((r) => ({ from: r.path, to: r.target })),
    ],
    [data, reviews.data],
  );
  const newProblems = from || to ? redirectProblems({ from: from.trim(), to: to.trim() }, existing) : [];

  return (
    <>
      <PageHeader title="Redirect Manager" subtitle="Redirects that are live today, and redirect proposals waiting for a decision." />
      <Note tone="amber">
        Nothing is redirected from this page. Approved proposals are a list for the next code change; each approval is checked first:
        no redirect to the homepage, no chains or loops, and the destination must answer 200 on the live site.
      </Note>
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Skeleton className="h-64" />}
      {data && (
        <div className="space-y-6">
          <Card title={`Proposals (${proposals.length})`} actions={<Btn onClick={() => setAdding((a) => !a)}><Plus className="h-4 w-4" /> Propose redirect</Btn>}>
            {adding && (
              <div className="mb-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium text-slate-600">
                    From (old URL path)
                    <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="/old-page" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm" />
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    To (closest matching page)
                    <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="/new-page" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm" />
                  </label>
                </div>
                {newProblems.length > 0 && (
                  <ul className="list-disc pl-5 text-sm text-rose-700">
                    {newProblems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                )}
                {from.trim() && to.trim() && !newProblems.length && (
                  <DecisionControl
                    kind="redirect"
                    path={from.trim()}
                    review={reviews.byPath.get(from.trim())}
                    defaultTarget={to.trim()}
                    needsTarget
                    onSaved={() => {
                      reviews.reload();
                      setFrom("");
                      setTo("");
                      setAdding(false);
                    }}
                  />
                )}
              </div>
            )}
            <Table head={["From", "To", "Why", "Decision", ""]} empty={!proposals.length}>
              {proposals.map((p) => (
                <Fragment key={p.from}>
                  <tr className="align-top">
                    <td className="max-w-[240px] break-all px-5 py-3 font-mono text-xs text-slate-700">{p.from}</td>
                    <td className="max-w-[240px] break-all px-5 py-3 font-mono text-xs text-slate-700">{reviews.byPath.get(p.from)?.target || p.to || "—"}</td>
                    <td className="max-w-[320px] px-5 py-3 text-slate-600">
                      <Badge tone="slate">{p.source}</Badge> <span className="ml-1">{p.reason}</span>
                    </td>
                    <td className="px-5 py-3">
                      <DecisionBadge review={reviews.byPath.get(p.from)} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Btn onClick={() => setOpen(open === p.from ? null : p.from)}>{open === p.from ? "Close" : "Decide"}</Btn>
                    </td>
                  </tr>
                  {open === p.from && (
                    <tr>
                      <td colSpan={5} className="px-5 pb-4">
                        <DecisionControl kind="redirect" path={p.from} review={reviews.byPath.get(p.from)} defaultTarget={p.to} needsTarget onSaved={reviews.reload} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </Table>
            <p className="mt-3 text-xs text-slate-500">
              Consolidation proposals also need the tests merged into the destination first, so no quiz attempts or question IDs are lost.
            </p>
          </Card>

          <Card title={`Live redirects (${data.live.length})`}>
            <Table head={["Source", "Destination", "Type", "Condition"]}>
              {data.live.map((r) => (
                <tr key={`${r.source}-${r.destination}`}>
                  <td className="px-5 py-2.5 font-mono text-xs text-slate-700">{r.source}</td>
                  <td className="break-all px-5 py-2.5 font-mono text-xs text-slate-700">{r.destination}</td>
                  <td className="px-5 py-2.5">
                    <Badge tone={r.permanent ? "indigo" : "amber"}>{r.permanent ? "308 permanent" : "307 temporary"}</Badge>
                  </td>
                  <td className="px-5 py-2.5 text-slate-500">{r.conditional ? "Host-based" : "Always"}</td>
                </tr>
              ))}
            </Table>
            <p className="mt-3 text-xs text-slate-500">From next.config.js. Changing these needs a code change and deploy.</p>
          </Card>
        </div>
      )}
    </>
  );
}
