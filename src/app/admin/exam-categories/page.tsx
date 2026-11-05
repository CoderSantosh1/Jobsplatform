"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Badge, Card, ErrorState, PageHeader, Skeleton, type Tone } from "../_components/ui";
import { Note, SearchBox, Table, fmtDate, useAdminJson } from "../_components/kit";

type Sub = { name: string; url: string; tests: number; published: number; questions: number; lastAdded: string | null; action: string | null };
type Cat = { name: string; url: string; action: string | null; inCategoryList: boolean; tests: number; questions: number; subs: Sub[] };

const ACTION_TONE: Record<string, Tone> = { KEEP: "emerald", IMPROVE: "indigo", NOINDEX: "rose", CONSOLIDATE: "amber", "NONE (404)": "slate" };

export default function ExamCategories() {
  const { data, error, loading, reload } = useAdminJson<Cat[]>("/api/admin/exam-categories");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const cats = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? [])
      .map((c) => (c.name.toLowerCase().includes(term) ? c : { ...c, subs: c.subs.filter((s) => s.name.toLowerCase().includes(term)) }))
      .filter((c) => c.name.toLowerCase().includes(term) || c.subs.length);
  }, [data, q]);

  return (
    <>
      <PageHeader
        title="Exam Categories"
        subtitle="Test-series categories and exams with their tests, questions and public page."
        actions={
          <Link href="/admin/content?tab=categories" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
            Edit categories
          </Link>
        }
      />
      <Note>
        Counts come from the tests themselves. Renaming a category or exam changes its public URL, so do it only together with a
        redirect from the old URL. The SEO column is the recommendation from the Test Series SEO Audit.
      </Note>
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <Skeleton className="h-96" />}
      {data && (
        <>
          <div className="mb-4">
            <SearchBox value={q} onChange={setQ} placeholder="Search categories or exams" />
          </div>
          <div className="space-y-3">
            {cats.map((c) => {
              const isOpen = open === c.name || Boolean(q.trim());
              return (
                <Card key={c.name}>
                  <button type="button" onClick={() => setOpen(open === c.name ? null : c.name)} className="flex w-full flex-wrap items-center gap-3 text-left">
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`} />
                    <span className="font-semibold text-slate-900">{c.name || "(no category)"}</span>
                    <span className="text-sm text-slate-500">
                      {c.subs.length} exams · {c.tests.toLocaleString("en-IN")} tests · {c.questions.toLocaleString("en-IN")} questions
                    </span>
                    {!c.inCategoryList && <Badge tone="amber">not in category list</Badge>}
                    {c.action && <Badge tone={ACTION_TONE[c.action] ?? "slate"}>{c.action}</Badge>}
                  </button>
                  {isOpen && (
                    <div className="mt-4">
                      {c.subs.length === 0 ? (
                        <p className="text-sm text-slate-500">No tests in this category yet.</p>
                      ) : (
                        <Table head={["Exam", "Tests", "Published", "Questions", "Last test added", "SEO", ""]}>
                          {c.subs.map((s) => (
                            <tr key={s.url + s.name}>
                              <td className="px-5 py-2.5 font-medium text-slate-900">{s.name || "(none)"}</td>
                              <td className="px-5 py-2.5 tabular-nums">{s.tests}</td>
                              <td className="px-5 py-2.5 tabular-nums">{s.published}</td>
                              <td className="px-5 py-2.5 tabular-nums">{s.questions.toLocaleString("en-IN")}</td>
                              <td className="whitespace-nowrap px-5 py-2.5 text-slate-500">{fmtDate(s.lastAdded)}</td>
                              <td className="px-5 py-2.5">{s.action ? <Badge tone={ACTION_TONE[s.action] ?? "slate"}>{s.action}</Badge> : <span className="text-xs text-slate-400">not audited</span>}</td>
                              <td className="whitespace-nowrap px-5 py-2.5 text-right">
                                <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-700">
                                  Page <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </td>
                            </tr>
                          ))}
                        </Table>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
