"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Download, ExternalLink, HeartPulse, ScanSearch } from "lucide-react";
import { HEALTH_LABEL, markDuplicates, markGraphIssues, pageHealthIssues, type HealthIssue } from "@/lib/admin-seo-checks";
import { Badge, Card, ErrorState, PageHeader, Skeleton, StatCard, type Tone } from "../../_components/ui";
import { Btn, Note, Pager, SearchBox, SelectBox, Table, csv, download, fmtDate, runPool, useAdminJson } from "../../_components/kit";
import { inspect, TARGETS, type Inspected, type InspectTarget } from "../../_components/inspect";

type Sitemap = { name: string; urls: { path: string }[] };
type Row = (
  | { path: string; sitemap: string; page: Inspected; issues: HealthIssue[] }
  | { path: string; sitemap: string; page: null; error: string; issues: HealthIssue[] }
) & { inboundCount?: number };
type Saved = { at: string; target: InspectTarget; rows: Row[] };

const ORIGIN = "https://www.sarkariresultsnow.com";
const STORE = "admin-page-health-v2";
const PAGE = 25;
// Problems that stop a page from being indexed or shown correctly come first.
const SEVERE: HealthIssue[] = ["not-200", "noindex-in-sitemap", "canonical-other", "canonical-missing", "thin", "title-missing", "description-missing", "viewport-missing", "schema-invalid", "redirect", "broken-links"];
const tone = (i: HealthIssue): Tone => (SEVERE.includes(i) ? "rose" : i.startsWith("duplicate") || i === "orphan" ? "violet" : "amber");

function load(): Saved | null {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}
function save(s: Saved) {
  try {
    localStorage.setItem(STORE, JSON.stringify(s));
  } catch {
    // storage full or blocked: results stay on screen for this visit
  }
}

export default function PageHealth() {
  const maps = useAdminJson<Sitemap[]>("/api/admin/seo/sitemap");
  const [target, setTarget] = useState<InspectTarget>("live");
  const [rows, setRows] = useState<Row[]>([]);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [issue, setIssue] = useState("any");
  const [section, setSection] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const stop = useRef(false);

  useEffect(() => {
    const s = load();
    if (s) {
      setRows(s.rows);
      setCheckedAt(s.at);
      setTarget(s.target);
    }
  }, []);

  const all = useMemo(() => (maps.data ?? []).flatMap((s) => s.urls.map((u) => ({ path: u.path, sitemap: s.name }))), [maps.data]);

  const run = async () => {
    setBusy(true);
    stop.current = false;
    setRows([]);
    setPage(0);
    const found: Row[] = [];
    await runPool(
      all,
      4,
      (u) => inspect(u.path, target),
      (u, o) => {
        const row: Row = o.ok
          ? { ...u, page: o.page, issues: pageHealthIssues(u.path, o.page, ORIGIN) }
          : { ...u, page: null, error: o.error, issues: ["not-200"] };
        found.push(row);
        setRows([...found]);
      },
      () => stop.current,
    );
    const liveWithDupes = markDuplicates(found.filter((r): r is Extract<Row, { page: Inspected }> => r.page !== null)) as Row[];
    const merged = markGraphIssues([...liveWithDupes, ...found.filter((r) => r.page === null)]);
    const at = new Date().toISOString();
    setRows(merged);
    setCheckedAt(at);
    save({ at, target, rows: merged });
    setBusy(false);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) for (const i of r.issues) c[i] = (c[i] ?? 0) + 1;
    return c;
  }, [rows]);
  const withIssues = rows.filter((r) => r.issues.length).length;
  const severe = rows.filter((r) => r.issues.some((i) => SEVERE.includes(i))).length;

  const shownAll = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows
      .filter((r) => (issue === "" ? true : issue === "any" ? r.issues.length > 0 : r.issues.includes(issue as HealthIssue)))
      .filter((r) => !section || r.sitemap === section)
      .filter((r) => !term || r.path.toLowerCase().includes(term) || (r.page?.title ?? "").toLowerCase().includes(term))
      .sort((a, b) => Number(b.issues.some((i) => SEVERE.includes(i))) - Number(a.issues.some((i) => SEVERE.includes(i))) || b.issues.length - a.issues.length);
  }, [rows, issue, section, q]);
  const pages = Math.max(1, Math.ceil(shownAll.length / PAGE));
  const shown = shownAll.slice(page * PAGE, page * PAGE + PAGE);

  const exportCsv = () =>
    download(
      "page-health.csv",
      csv([
        ["url", "sitemap", "status", "words", "title", "title_length", "description_length", "canonical", "noindex", "viewport", "inbound_links", "issues"],
        ...rows.map((r) => [
          `${ORIGIN}${r.path}`,
          r.sitemap,
          r.page?.status ?? ("error" in r ? r.error : ""),
          r.page?.words ?? "",
          r.page?.title ?? "",
          r.page?.title.length ?? "",
          r.page?.description.length ?? "",
          r.page?.canonical ?? "",
          r.page?.noindex ?? "",
          r.page ? r.page.hasViewport : "",
          r.inboundCount ?? "",
          r.issues.map((i) => HEALTH_LABEL[i]).join("; "),
        ]),
      ]),
    );

  return (
    <>
      <PageHeader
        title="Page Health"
        subtitle="Fetch every page in the sitemaps and check status, indexability, canonical, title, description, viewport, H1, content length, internal links and structured data."
        actions={
          <Btn onClick={exportCsv} disabled={!rows.length}>
            <Download className="h-4 w-4" /> Export CSV
          </Btn>
        }
      />
      <Note>
        Word counts are the readable text in the page body, without menus and footer. Under {150} words is “thin”, under {300} is “low content”.
        These are our own checks, not Google&apos;s decision. Fix a post by editing it in Content Management.
      </Note>
      {maps.error && <ErrorState message={maps.error} onRetry={maps.reload} />}
      {maps.loading && !maps.data && <Skeleton className="h-24" />}
      {maps.data && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <SelectBox label="Check on" value={target} onChange={(v) => setTarget(v as InspectTarget)} options={TARGETS} />
            {busy ? (
              <Btn tone="danger" onClick={() => (stop.current = true)}>
                Stop ({rows.length}/{all.length})
              </Btn>
            ) : (
              <Btn tone="primary" onClick={run} disabled={!all.length}>
                <ScanSearch className="h-4 w-4" /> Check all {all.length} pages
              </Btn>
            )}
            {checkedAt && !busy && <span className="text-sm text-slate-500">Last check: {fmtDate(checkedAt)} on the {target === "live" ? "live site" : "this server"}</span>}
          </div>
          {busy && (
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${(rows.length / Math.max(1, all.length)) * 100}%` }} />
            </div>
          )}
        </Card>
      )}

      {rows.length > 0 && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Pages checked" value={rows.length} icon={HeartPulse} />
            <StatCard label="Pages with any issue" value={withIssues} icon={HeartPulse} tone="amber" />
            <StatCard label="Indexing / content problems" value={severe} icon={HeartPulse} tone="rose" hint="errors, noindex, canonical, thin" />
          </div>
          <Card>
            <div className="mb-4 flex flex-wrap gap-2">
              {(Object.keys(HEALTH_LABEL) as HealthIssue[])
                .filter((k) => counts[k])
                .map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => (setIssue(issue === k ? "any" : k), setPage(0))}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${issue === k ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    {HEALTH_LABEL[k]} · {counts[k]}
                  </button>
                ))}
              {!withIssues && !busy && <Badge tone="emerald">No issues found</Badge>}
            </div>
            <div className="mb-4 flex flex-wrap gap-3">
              <SearchBox value={q} onChange={(v) => (setQ(v), setPage(0))} placeholder="Search path or title" />
              <SelectBox
                label="Sitemap"
                value={section}
                onChange={(v) => (setSection(v), setPage(0))}
                options={[{ value: "", label: "All sitemaps" }, ...(maps.data ?? []).map((s) => ({ value: s.name, label: s.name }))]}
              />
              <SelectBox
                label="Show"
                value={issue}
                onChange={(v) => (setIssue(v), setPage(0))}
                options={[{ value: "any", label: "Pages with issues" }, { value: "", label: "All pages" }, ...(Object.keys(HEALTH_LABEL) as HealthIssue[]).map((k) => ({ value: k, label: HEALTH_LABEL[k] }))]}
              />
            </div>
            <Table head={["Page", "Status", "Words", "Issues", ""]} empty={!shown.length}>
              {shown.map((r) => (
                <Fragment key={r.path}>
                  <tr className="align-top">
                    <td className="max-w-[360px] px-5 py-3">
                      <p className="line-clamp-2 font-medium text-slate-900">{r.page?.title || "—"}</p>
                      <a href={`${ORIGIN}${r.path}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all font-mono text-xs text-slate-500 hover:text-indigo-700">
                        {r.path} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      {r.page ? <Badge tone={r.page.status === 200 ? (r.page.noindex ? "rose" : "emerald") : "rose"}>{r.page.status}{r.page.noindex ? " · noindex" : ""}</Badge> : <Badge tone="rose">{"error" in r ? r.error : "error"}</Badge>}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-700">{r.page?.words ?? "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex max-w-[300px] flex-wrap gap-1">
                        {r.issues.length ? r.issues.map((i) => <Badge key={i} tone={tone(i)}>{HEALTH_LABEL[i]}</Badge>) : <Badge tone="emerald">OK</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {r.page && <Btn onClick={() => setOpen(open === r.path ? null : r.path)}>{open === r.path ? "Close" : "Details"}</Btn>}
                    </td>
                  </tr>
                  {open === r.path && r.page && (
                    <tr>
                      <td colSpan={5} className="bg-slate-50 px-5 py-4">
                        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[140px_1fr]">
                          <dt className="text-slate-500">Title ({r.page.title.length})</dt>
                          <dd>{r.page.title || "—"}</dd>
                          <dt className="text-slate-500">Description ({r.page.description.length})</dt>
                          <dd>{r.page.description || "—"}</dd>
                          <dt className="text-slate-500">Canonical</dt>
                          <dd className="break-all font-mono text-xs">{r.page.canonical ?? "—"}</dd>
                          <dt className="text-slate-500">Robots</dt>
                          <dd>{r.page.robots ?? "index (default)"}</dd>
                          <dt className="text-slate-500">Viewport</dt>
                          <dd>{r.page.hasViewport ? "Present" : "Missing"}</dd>
                          <dt className="text-slate-500">H1</dt>
                          <dd>{r.page.h1.join(" | ") || "—"}</dd>
                          <dt className="text-slate-500">Structured data</dt>
                          <dd>{r.page.jsonLd.map((b) => b.types.join("+") + (b.missing.length ? ` (missing ${b.missing.join(", ")})` : "")).join(", ") || "none"}</dd>
                          <dt className="text-slate-500">Links (out / in)</dt>
                          <dd>{r.page.internalLinks.length} outgoing / {r.inboundCount ?? 0} incoming</dd>
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </Table>
            <Pager page={page} pages={pages} total={shownAll.length} onPage={setPage} />
          </Card>
        </>
      )}
      {!rows.length && !busy && maps.data && <p className="text-sm text-slate-500">Press “Check all pages” to start. It takes about a minute.</p>}
    </>
  );
}
