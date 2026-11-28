"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Download, ExternalLink, Sparkles } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { ISSUE_LABEL, type ContentIssue } from "@/lib/admin-seo-checks";
import type { TitleDedupeProposal } from "@/lib/seo-title-dedupe";
import { Badge, Card, ErrorState, PageHeader, Skeleton, type Tone } from "../../_components/ui";
import { Btn, Note, Pager, SearchBox, SelectBox, Table, csv, download, useAdminJson } from "../../_components/kit";

type Row = {
  id: string;
  section: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  status: string;
  issues: ContentIssue[];
  url: string;
  adminTab: string;
};

const SECTIONS = [
  { value: "", label: "All sections" },
  { value: "jobs", label: "Jobs" },
  { value: "results", label: "Results" },
  { value: "admit-cards", label: "Admit Cards" },
  { value: "answer-keys", label: "Answer Keys" },
  { value: "admissions", label: "Admissions" },
];
const ISSUE_TONE: Record<ContentIssue, Tone> = {
  "title-cut": "amber",
  "title-short": "amber",
  "description-short": "amber",
  duplicate: "rose",
  "same-search-title": "rose",
  "no-organization": "slate",
  expired: "violet",
  draft: "slate",
};
const PAGE = 25;

function ContentAudit() {
  const params = useSearchParams();
  const { data, error, loading, reload } = useAdminJson<Row[]>("/api/admin/seo/content");
  const [q, setQ] = useState("");
  const [section, setSection] = useState("");
  const [issue, setIssue] = useState(params?.get("issue") ?? "any");
  const [page, setPage] = useState(0);
  const [proposals, setProposals] = useState<TitleDedupeProposal[] | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [dedupeBusy, setDedupeBusy] = useState(false);
  const [dedupeMsg, setDedupeMsg] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of data ?? []) for (const i of r.issues) c[i] = (c[i] ?? 0) + 1;
    return c;
  }, [data]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? []).filter(
      (r) =>
        (!section || r.section === section) &&
        (issue === "" || (issue === "any" ? r.issues.some((i) => i !== "draft") : r.issues.includes(issue as ContentIssue))) &&
        (!term || r.title.toLowerCase().includes(term) || r.metaTitle.toLowerCase().includes(term)),
    );
  }, [data, q, section, issue]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE);
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(0);
  };

  const loadPreview = async () => {
    setDedupeBusy(true);
    setDedupeMsg("");
    try {
      const res = await adminFetch("/api/admin/seo/content/dedupe-titles", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || "Could not load preview.");
      const list = (json.data?.proposals ?? []) as TitleDedupeProposal[];
      setProposals(list);
      setEdits(Object.fromEntries(list.map((p) => [`${p.section}:${p.id}`, p.proposedTitle])));
    } catch (e) {
      setDedupeMsg(e instanceof Error ? e.message : "Could not load preview.");
    } finally {
      setDedupeBusy(false);
    }
  };

  const applyTitles = async () => {
    if (!proposals?.length) return;
    setDedupeBusy(true);
    setDedupeMsg("");
    try {
      const updates = proposals.map((p) => ({
        id: p.id,
        section: p.section,
        newTitle: edits[`${p.section}:${p.id}`] ?? p.proposedTitle,
      }));
      const res = await adminFetch("/api/admin/seo/content/dedupe-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true, updates }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || "Update failed.");
      setDedupeMsg(`Updated ${json.data.updatedCount} post title(s).`);
      setProposals(null);
      reload();
    } catch (e) {
      setDedupeMsg(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setDedupeBusy(false);
    }
  };

  const exportCsv = () =>
    download(
      "content-seo-audit.csv",
      csv([
        ["section", "title", "meta_title", "meta_title_length", "meta_description", "meta_description_length", "status", "issues", "url"],
        ...rows.map((r) => [r.section, r.title, r.metaTitle, r.metaTitle.length, r.metaDescription, r.metaDescription.length, r.status, r.issues.join(" "), `https://www.sarkariresultsnow.com${r.url}`]),
      ]),
    );

  return (
    <>
      <PageHeader
        title="Content SEO Audit"
        subtitle="The title and description each post's public page shows in search results, built by the same code as the page."
        actions={
          <div className="flex flex-wrap gap-2">
            {(counts["same-search-title"] ?? 0) > 0 && (
              <Btn tone="primary" onClick={loadPreview} disabled={dedupeBusy}>
                <Sparkles className="h-4 w-4" /> Preview title fixes ({counts["same-search-title"]})
              </Btn>
            )}
            <Btn onClick={exportCsv} disabled={!rows.length}>
              <Download className="h-4 w-4" /> Export CSV
            </Btn>
          </div>
        }
      />
      <Note>
        Titles over 60 characters are cut at a word boundary by the site. Duplicate titles already point their canonical at the oldest copy.
        Use &ldquo;Preview title fixes&rdquo; to inspect and approve distinct titles for posts that collide at 60 characters.
      </Note>
      {dedupeMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{dedupeMsg}</span>
        </div>
      )}
      {proposals && (
        <Card title={`Proposed Distinct Titles (${proposals.length})`} className="mb-6">
          {proposals.length === 0 ? (
            <p className="text-sm text-slate-600">No colliding search titles need changes.</p>
          ) : (
            <>
              <Table head={["Section / URL", "Old Title", "Proposed Title (editable)", "60-char Preview"]}>
                {proposals.map((p) => {
                  const key = `${p.section}:${p.id}`;
                  return (
                    <tr key={key} className="align-top">
                      <td className="px-5 py-3 text-xs">
                        <span className="uppercase text-slate-400">{p.section}</span>
                        <p className="font-mono text-slate-600">{p.url}</p>
                      </td>
                      <td className="max-w-[240px] px-5 py-3 text-sm text-slate-700">{p.oldTitle}</td>
                      <td className="px-5 py-3">
                        <input
                          value={edits[key] ?? p.proposedTitle}
                          onChange={(e) => setEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-full min-w-[260px] rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                        />
                      </td>
                      <td className="max-w-[220px] px-5 py-3 text-xs text-slate-600">{p.proposedMetaTitle}</td>
                    </tr>
                  );
                })}
              </Table>
              <div className="mt-4 flex justify-end gap-2">
                <Btn onClick={() => setProposals(null)} disabled={dedupeBusy}>Cancel</Btn>
                <Btn tone="primary" onClick={applyTitles} disabled={dedupeBusy}>
                  Approve &amp; Apply ({proposals.length})
                </Btn>
              </div>
            </>
          )}
        </Card>
      )}
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Skeleton className="h-96" />}
      {data && (
        <Card>
          <div className="mb-4 flex flex-wrap gap-2">
            {(Object.keys(ISSUE_LABEL) as ContentIssue[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => reset(setIssue)(issue === k ? "any" : k)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${issue === k ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {ISSUE_LABEL[k]} · {(counts[k] ?? 0).toLocaleString("en-IN")}
              </button>
            ))}
          </div>
          <div className="mb-4 flex flex-wrap gap-3">
            <SearchBox value={q} onChange={reset(setQ)} placeholder="Search titles" />
            <SelectBox label="Section" value={section} onChange={reset(setSection)} options={SECTIONS} />
            <SelectBox
              label="Issue"
              value={issue}
              onChange={reset(setIssue)}
              options={[{ value: "any", label: "Any issue" }, { value: "", label: "All posts" }, ...(Object.keys(ISSUE_LABEL) as ContentIssue[]).map((k) => ({ value: k, label: ISSUE_LABEL[k] }))]}
            />
          </div>
          <Table head={["Post", "Search title", "Description", "Issues", ""]} empty={!shown.length}>
            {shown.map((r) => (
              <tr key={`${r.section}-${r.id}`} className="align-top">
                <td className="max-w-[220px] px-5 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{r.section}</p>
                  <p className="font-medium text-slate-900">{r.title || "(untitled)"}</p>
                </td>
                <td className="max-w-[240px] px-5 py-3 text-slate-700">
                  {r.metaTitle}
                  <span className={`ml-1 text-xs tabular-nums ${r.metaTitle.length > 60 ? "text-rose-600" : "text-slate-400"}`}>({r.metaTitle.length})</span>
                </td>
                <td className="max-w-[300px] px-5 py-3 text-slate-600">
                  <span className="line-clamp-3">{r.metaDescription || "—"}</span>
                  <span className="text-xs tabular-nums text-slate-400">({r.metaDescription.length})</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex max-w-[180px] flex-wrap gap-1">
                    {r.issues.length ? r.issues.map((i) => <Badge key={i} tone={ISSUE_TONE[i]}>{ISSUE_LABEL[i]}</Badge>) : <Badge tone="emerald">OK</Badge>}
                  </div>
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right">
                  <Link href={`/admin/content?tab=${r.adminTab}`} className="mr-3 text-sm font-medium text-indigo-600 hover:underline">
                    Manage
                  </Link>
                  {r.status !== "draft" && (
                    <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
                      View <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </Table>
          <Pager page={page} pages={pages} total={rows.length} onPage={setPage} />
        </Card>
      )}
    </>
  );
}

export default function ContentAuditPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <ContentAudit />
    </Suspense>
  );
}
