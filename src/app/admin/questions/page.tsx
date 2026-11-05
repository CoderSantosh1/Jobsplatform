"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Library } from "lucide-react";
import { Badge, Card, ErrorState, PageHeader, Skeleton } from "../_components/ui";
import { Note, Pager, SearchBox, SelectBox, Table, useAdminJson } from "../_components/kit";

type QuestionRow = { _id: string; text: string; options: string[]; correctAnswer: string; quiz?: { _id: string; title: string; category: string; subcategory: string } };
type DuplicateRow = { text: string; uses: number; quizCount: number };
type Data = {
  mode: "list" | "duplicates";
  total: number;
  totalQuestions: number;
  page: number;
  pageSize: number;
  categories: string[];
  rows: (QuestionRow | DuplicateRow)[];
};

export default function QuestionBank() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [mode, setMode] = useState("list");
  const [page, setPage] = useState(0);

  // Wait for typing to pause before searching the database.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(input.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [input]);

  const url = `/api/admin/questions?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&page=${page}${mode === "duplicates" ? "&duplicates=1" : ""}`;
  const { data, error, loading, reload } = useAdminJson<Data>(url);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <PageHeader title="Question Bank" subtitle="Every question across all mock tests. Questions are edited inside their test, so their IDs never change." />
      <Note>
        “Repeated questions” lists question text used more than once. Exam pages built mostly from repeated questions look alike to
        search engines (see the Test Series SEO Audit).
      </Note>
      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <SearchBox value={input} onChange={setInput} placeholder="Search question text" />
          <SelectBox
            label="Category"
            value={category}
            onChange={(v) => (setCategory(v), setPage(0))}
            options={[{ value: "", label: "All categories" }, ...(data?.categories ?? []).map((c) => ({ value: c, label: c }))]}
          />
          <SelectBox
            label="View"
            value={mode}
            onChange={(v) => (setMode(v), setPage(0))}
            options={[
              { value: "list", label: "All questions" },
              { value: "duplicates", label: "Repeated questions" },
            ]}
          />
        </div>
        {data && (
          <p className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <Library className="h-4 w-4" /> {data.totalQuestions.toLocaleString("en-IN")} questions in total
          </p>
        )}
        {error && <ErrorState message={error} onRetry={reload} />}
        {loading && !data && <Skeleton className="h-96" />}
        {data && data.mode === "list" && (
          <Table head={["Question", "Options", "Test"]} empty={!data.rows.length}>
            {(data.rows as QuestionRow[]).map((r) => (
              <tr key={r._id} className={`align-top ${loading ? "opacity-60" : ""}`}>
                <td className="max-w-[380px] px-5 py-3 text-slate-900">{r.text}</td>
                <td className="max-w-[300px] px-5 py-3">
                  <ul className="space-y-0.5 text-slate-600">
                    {r.options.map((o, i) => (
                      <li key={i} className={o === r.correctAnswer ? "font-semibold text-emerald-700" : ""}>
                        {String.fromCharCode(65 + i)}. {o}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="max-w-[240px] px-5 py-3">
                  {r.quiz ? (
                    <>
                      <Link href={`/admin/quizzes/${r.quiz._id}/edit`} className="font-medium text-indigo-600 hover:underline">
                        {r.quiz.title}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {r.quiz.category} / {r.quiz.subcategory}
                      </p>
                    </>
                  ) : (
                    <Badge tone="rose">test missing</Badge>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
        {data && data.mode === "duplicates" && (
          <Table head={["Question", "Times used", "In tests"]} empty={!data.rows.length}>
            {(data.rows as DuplicateRow[]).map((r, i) => (
              <tr key={i} className={loading ? "opacity-60" : ""}>
                <td className="max-w-[520px] px-5 py-3 text-slate-900">{r.text}</td>
                <td className="px-5 py-3">
                  <Badge tone={r.uses >= 10 ? "rose" : "amber"}>{r.uses}</Badge>
                </td>
                <td className="px-5 py-3 tabular-nums text-slate-600">{r.quizCount}</td>
              </tr>
            ))}
          </Table>
        )}
        {data && <Pager page={page} pages={pages} total={data.total} onPage={setPage} />}
      </Card>
    </>
  );
}
