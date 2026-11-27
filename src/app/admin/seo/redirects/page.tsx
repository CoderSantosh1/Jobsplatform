"use client";

import { Fragment, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { redirectProblems } from "@/lib/admin-seo-checks";
import { Badge, Card, ErrorState, PageHeader, Skeleton } from "../../_components/ui";
import { Btn, Note, Table, useAdminJson } from "../../_components/kit";
import { DecisionBadge, DecisionControl, useReviews } from "../../_components/review";
import { REDIRECT_TABS, countByTab, pagedGroups, type RedirectTab } from "@/lib/redirect-groups";

const PAGE_SIZE = 20;

/** Previous / next pager under a table; hidden when everything fits on one page. */
function Pager({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
      <span>
        {first}–{last} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Btn disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Btn>
        <span>
          Page {page} of {pages}
        </span>
        <Btn disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Btn>
      </div>
    </div>
  );
}

/** Posts / Test series / Other pages, with how many rows each tab holds. */
function Tabs({ tab, counts, onTab }: { tab: RedirectTab; counts: Record<RedirectTab, number>; onTab: (t: RedirectTab) => void }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {REDIRECT_TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={tab === t.key}
          onClick={() => onTab(t.key)}
          className={`rounded-full border px-3 py-1 text-sm font-medium ${
            tab === t.key ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {t.label} <span className={tab === t.key ? "text-indigo-100" : "text-slate-400"}>({counts[t.key]})</span>
        </button>
      ))}
    </div>
  );
}

/** A full-width heading row inside a table, for one section or category. */
function GroupRow({ label, count, colSpan }: { label: string; count: number; colSpan: number }) {
  return (
    <tr className="bg-slate-50">
      <td colSpan={colSpan} className="px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label} <span className="ml-1 font-normal normal-case text-slate-400">({count})</span>
      </td>
    </tr>
  );
}

type Data = {
  live: { source: string; destination: string; permanent?: boolean; conditional: boolean; origin: "code" | "admin" }[];
  suggestions: { from: string; to: string; reason: string; source: string }[];
};

export default function RedirectManager() {
  const { data, error, loading, reload } = useAdminJson<Data>("/api/admin/seo/redirects");
  const reviews = useReviews("redirect");
  const [open, setOpen] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [adding, setAdding] = useState(false);

  const proposals = useMemo(() => {
    const list = [...(data?.suggestions ?? [])];
    const known = new Set(list.map((s) => s.from));
    for (const r of reviews.data ?? []) if (!known.has(r.path)) list.push({ from: r.path, to: r.target, reason: r.note || "Added by an admin", source: "Admin" });
    return list;
  }, [data, reviews.data]);

  const existing = useMemo(
    () => [
      ...(data?.live ?? [])
        .filter((r) => r.origin === "code" && !r.conditional && !r.source.includes(":"))
        .map((r) => ({ from: r.source, to: r.destination })),
      ...(reviews.data ?? []).filter((r) => r.decision === "approved").map((r) => ({ from: r.path, to: r.target })),
    ],
    [data, reviews.data],
  );
  const newProblems = from || to ? redirectProblems({ from: from.trim(), to: to.trim() }, existing) : [];

  // Posts by section, test series by category, everything else apart.
  const [tab, setTabState] = useState<RedirectTab>("posts");
  const [proposalPage, setProposalPage] = useState(1);
  const [livePage, setLivePage] = useState(1);
  const setTab = (next: RedirectTab) => {
    setTabState(next);
    setProposalPage(1);
    setLivePage(1);
    setOpen(null);
  };
  const proposalCounts = useMemo(() => countByTab(proposals, (p) => p.from), [proposals]);
  const liveCounts = useMemo(() => countByTab(data?.live ?? [], (r) => r.source), [data]);
  const proposalView = useMemo(() => pagedGroups(proposals, (p) => p.from, tab, proposalPage, PAGE_SIZE), [proposals, tab, proposalPage]);
  const liveView = useMemo(() => pagedGroups(data?.live ?? [], (r) => r.source, tab, livePage, PAGE_SIZE), [data, tab, livePage]);

  return (
    <>
      <PageHeader title="Redirect Manager" subtitle="Redirects that are live today, and redirect proposals waiting for a decision." />
      <Note tone="amber">
        <strong>Post URLs go live on approval:</strong> approving a redirect for a post URL (/jobs/…, /results/…, /admit-cards/…,
        /answer-keys/…, /admissions/…, /news/…) makes it a 301 on the live site within a few minutes, matching every old slug of
        that post, and removes the post from the lists and the sitemap. Withdraw (reject) the approval to undo it. Approvals for
        other paths are still a list for the next code change. Every approval is checked first: no redirect to the homepage, no
        chains or loops, and the destination must answer 200 on the live site.
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
            <div className="mb-4">
              <Tabs tab={tab} counts={proposalCounts} onTab={setTab} />
            </div>
            <Table head={["From", "To", "Why", "Decision", ""]} empty={!proposalView.total}>
              {proposalView.groups.map((g) => (
                <Fragment key={g.group}>
                  <GroupRow label={g.group} count={g.rows.length} colSpan={5} />
                  {g.rows.map((p) => (
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
                </Fragment>
              ))}
            </Table>
            <Pager page={proposalView.page} pages={proposalView.pages} total={proposalView.total} onPage={setProposalPage} />
            <p className="mt-3 text-xs text-slate-500">
              Consolidation proposals also need the tests merged into the destination first, so no quiz attempts or question IDs are lost.
            </p>
          </Card>

          <Card title={`Live redirects (${data.live.length})`}>
            <div className="mb-4">
              <Tabs tab={tab} counts={liveCounts} onTab={setTab} />
            </div>
            <Table head={["Source", "Destination", "Type", "Condition", "Managed in"]} empty={!liveView.total}>
              {liveView.groups.map((g) => (
                <Fragment key={g.group}>
                  <GroupRow label={g.group} count={g.rows.length} colSpan={5} />
                  {g.rows.map((r) => (
                    <tr key={`${r.source}-${r.destination}`}>
                      <td className="max-w-[260px] break-all px-5 py-2.5 font-mono text-xs text-slate-700">{r.source}</td>
                      <td className="max-w-[260px] break-all px-5 py-2.5 font-mono text-xs text-slate-700">{r.destination}</td>
                      <td className="px-5 py-2.5">
                        <Badge tone={r.permanent ? "indigo" : "amber"}>{r.permanent ? "308 permanent" : "307 temporary"}</Badge>
                      </td>
                      <td className="px-5 py-2.5 text-slate-500">{r.conditional ? "Host-based" : r.origin === "admin" ? "Any slug of this post" : "Always"}</td>
                      <td className="px-5 py-2.5">
                        <Badge tone={r.origin === "admin" ? "emerald" : "slate"}>{r.origin === "admin" ? "Admin (live)" : "Code"}</Badge>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </Table>
            <Pager page={liveView.page} pages={liveView.pages} total={liveView.total} onPage={setLivePage} />
            <p className="mt-3 text-xs text-slate-500">
              &quot;Code&quot; rules come from next.config.js and need a code change and deploy. &quot;Admin&quot; rules are the approved post
              redirects above; withdraw the approval to remove one.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
