"use client";

// Admin Quiz Management: quizzes are loaded one page at a time from the server (no question bodies), filtered by
// category, subcategory, status and search. The category sidebar comes from one small count query.
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Folder, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import SearchBar from "@/components/ui/SearchBar";
import { adminFetch } from "@/lib/admin-fetch";
import { DEFAULT_QUIZ_PAGE_SIZE, QUIZ_PAGE_SIZES, type QuizFacet } from "@/lib/admin-quiz-list";

interface QuizRow {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  subcategory?: string;
  timeLimit?: number;
  totalMarks?: number;
  status?: "published" | "draft";
  questionCount: number;
  updatedAt?: string;
}

type Filters = { category: string; subcategory: string; q: string; status: "" | "published" | "draft"; page: number; limit: number };

const EMPTY: Filters = { category: "", subcategory: "", q: "", status: "", page: 1, limit: DEFAULT_QUIZ_PAGE_SIZE };

/** Filters from the address bar's query string, so Back from the edit page returns to the same list. */
function filtersFromSearch(search: string): Filters {
  const s = new URLSearchParams(search);
  const status = s.get("status");
  const limit = Number(s.get("limit"));
  return {
    category: s.get("category") ?? "",
    subcategory: s.get("subcategory") ?? "",
    q: s.get("q") ?? "",
    status: status === "published" || status === "draft" ? status : "",
    page: Math.max(1, Number(s.get("page")) || 1),
    limit: (QUIZ_PAGE_SIZES as readonly number[]).includes(limit) ? limit : DEFAULT_QUIZ_PAGE_SIZE,
  };
}

function toQuery(f: Filters): string {
  const s = new URLSearchParams();
  s.set("page", String(f.page));
  s.set("limit", String(f.limit));
  if (f.category) s.set("category", f.category);
  if (f.subcategory) s.set("subcategory", f.subcategory);
  if (f.q) s.set("q", f.q);
  if (f.status) s.set("status", f.status);
  return s.toString();
}

// The address bar is the source of truth for the filters: components read it with useSyncExternalStore and
// writing goes through setUrlFilters, which notifies them.
const urlListeners = new Set<() => void>();

function subscribeUrl(callback: () => void) {
  urlListeners.add(callback);
  window.addEventListener("popstate", callback);
  return () => {
    urlListeners.delete(callback);
    window.removeEventListener("popstate", callback);
  };
}

function setUrlFilters(f: Filters) {
  window.history.replaceState(null, "", `${window.location.pathname}?${toQuery(f)}`);
  urlListeners.forEach((listener) => listener());
}

type PageResult = { query: string; reloadKey: number; rows: QuizRow[]; total: number; pages: number };

async function fetchFacets(): Promise<QuizFacet[]> {
  const res = await adminFetch("/api/quizzes?facets=1");
  if (!res.ok) throw new Error(`Quiz categories failed (${res.status})`);
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}

async function fetchPage(f: Filters, signal: AbortSignal): Promise<{ page: number; rows: QuizRow[]; total: number; pages: number }> {
  const res = await adminFetch(`/api/quizzes?${toQuery(f)}`, { signal });
  if (!res.ok) throw new Error(`Quizzes failed (${res.status})`);
  const json = await res.json();
  return {
    page: json.page ?? f.page,
    rows: Array.isArray(json.data) ? json.data : [],
    total: json.total ?? 0,
    pages: json.pages ?? 1,
  };
}

/** Page numbers around the current page, with gaps: 1 … 4 5 [6] 7 8 … 20. */
function pageWindow(page: number, pages: number): (number | "gap")[] {
  const set = new Set([1, pages, page - 2, page - 1, page, page + 1, page + 2].filter((p) => p >= 1 && p <= pages));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export default function QuizList() {
  // null on the server and during hydration, then the real query string.
  const search = useSyncExternalStore(subscribeUrl, () => window.location.search, () => null);
  const ready = search !== null;
  const filters = useMemo(() => (search === null ? EMPTY : filtersFromSearch(search)), [search]);
  const query = toQuery(filters);

  const [result, setResult] = useState<PageResult | null>(null);
  const [facets, setFacets] = useState<QuizFacet[] | null>(null);
  // undefined = follow the selected category; null = all collapsed; a name = that category open.
  const [expandedChoice, setExpanded] = useState<string | null | undefined>(undefined);
  const expanded = expandedChoice === undefined ? filters.category || null : expandedChoice;
  // Bumped after a delete or status change so both lists load again.
  const [reloadKey, setReloadKey] = useState(0);
  // Which status change is running: a quiz id, "bulk", or null.
  const [busy, setBusy] = useState<string | null>(null);

  const loading = !result || result.query !== query || result.reloadKey !== reloadKey;
  const quizzes = result?.rows ?? [];
  const total = result?.total ?? 0;
  const pages = result?.pages ?? 1;
  const facetsLoading = facets === null;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    fetchFacets()
      .then((data) => {
        if (!cancelled) setFacets(data);
      })
      .catch((error) => {
        console.error("Error fetching quiz categories:", error);
        toast.error("Failed to load quiz categories");
        if (!cancelled) setFacets((prev) => prev ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, reloadKey]);

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    fetchPage(filters, controller.signal)
      .then((page) => {
        // The server clamps an out-of-range page; follow it.
        if (page.page !== filters.page) setUrlFilters({ ...filters, page: page.page });
        else setResult({ ...page, query: toQuery(filters), reloadKey });
      })
      .catch((error) => {
        if ((error as Error).name === "AbortError") return;
        console.error("Error fetching quizzes:", error);
        toast.error("Failed to fetch quizzes");
        setResult({ query: toQuery(filters), reloadKey, rows: [], total: 0, pages: 1 });
      });
    return () => controller.abort();
  }, [ready, filters, reloadKey]);

  /** Change filters (back to page 1 unless a page is given). */
  const update = (patch: Partial<Filters>) => setUrlFilters({ ...filters, page: 1, ...patch });
  const goTo = (page: number) => setUrlFilters({ ...filters, page });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    try {
      const response = await adminFetch(`/api/quizzes/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete quiz");
      toast.success("Quiz deleted successfully");
      setReloadKey((k) => k + 1);
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz");
    }
  };

  /** Publish or unpublish: one quiz (ids) or a whole category / subcategory. */
  const changeStatus = async (body: Record<string, unknown>, busyKey: string) => {
    setBusy(busyKey);
    try {
      const res = await adminFetch("/api/quizzes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to update status");
      const n = json.data?.modified ?? 0;
      const word = body.status === "published" ? "published" : "moved to draft";
      toast.success(n === 1 ? `1 quiz ${word}` : `${n} quizzes ${word}`);
      setReloadKey((k) => k + 1);
    } catch (error) {
      console.error("Error updating quiz status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setBusy(null);
    }
  };

  const toggleQuiz = (quiz: QuizRow) =>
    changeStatus({ ids: [quiz._id], status: quiz.status === "published" ? "draft" : "published" }, quiz._id);

  // Counts for the selected category or subcategory, for the bulk buttons.
  const selectedFacet = filters.category ? (facets ?? []).find((f) => f.name === filters.category) : undefined;
  const selected = filters.subcategory ? selectedFacet?.subcategories.find((s) => s.name === filters.subcategory) : selectedFacet;
  const selectedDrafts = selected ? selected.count - selected.published : 0;

  const bulkChange = (status: "published" | "draft") => {
    if (!selected) return;
    const n = status === "published" ? selectedDrafts : selected.published;
    const where = filters.subcategory ? `${filters.category} › ${filters.subcategory}` : `${filters.category} (all subcategories)`;
    const what = status === "published" ? `Publish ${n} draft quizzes` : `Move ${n} published quizzes to draft`;
    if (!confirm(`${what} in ${where}?`)) return;
    changeStatus({ status, category: filters.category, ...(filters.subcategory ? { subcategory: filters.subcategory } : {}) }, "bulk");
  };

  const allCount = (facets ?? []).reduce((n, f) => n + f.count, 0);
  const allDrafts = (facets ?? []).reduce((n, f) => n + f.count - f.published, 0);
  const first = total ? (filters.page - 1) * filters.limit + 1 : 0;
  const last = Math.min(filters.page * filters.limit, total);
  const heading = filters.subcategory
    ? `${filters.category} › ${filters.subcategory}`
    : filters.category || "All quizzes";

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Quizzes</h1>
          <Link href="/admin/quizzes/create">
            <Button>Create New Quiz</Button>
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchBar
            value={filters.q}
            onChange={(q) => {
              if (q !== filters.q) update({ q });
            }}
            placeholder="Search quizzes by title or description..."
            delay={350}
          />
          <select
            aria-label="Status"
            value={filters.status}
            onChange={(e) => update({ status: e.target.value as Filters["status"] })}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Category → subcategory tree with quiz counts */}
        <aside className="h-fit rounded-xl border border-slate-200 bg-white lg:sticky lg:top-4">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">Categories</div>
          <nav className="max-h-[320px] overflow-y-auto p-2 lg:max-h-[calc(100vh-8rem)]" aria-label="Quiz categories">
            <button
              type="button"
              onClick={() => {
                setExpanded(null);
                update({ category: "", subcategory: "" });
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                !filters.category ? "bg-indigo-50 font-semibold text-indigo-700" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>All quizzes</span>
              <span className="text-xs text-slate-400">
                {facetsLoading ? "…" : allCount}
                {!facetsLoading && allDrafts > 0 && <span className="ml-1 text-amber-600">· {allDrafts} draft</span>}
              </span>
            </button>
            {facetsLoading && (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading categories…
              </div>
            )}
            {(facets ?? []).map((c) => {
              const isOpen = expanded === c.name;
              const active = filters.category === c.name;
              return (
                <div key={c.name}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => {
                      setExpanded(isOpen && active ? null : c.name);
                      update({ category: c.name, subcategory: "" });
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                      active && !filters.subcategory ? "bg-indigo-50 font-semibold text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    <Folder className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    <span className="whitespace-nowrap text-xs text-slate-400">
                      {c.count}
                      {c.count - c.published > 0 && <span className="ml-1 text-amber-600">· {c.count - c.published} draft</span>}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="mb-1 ml-6 border-l border-slate-100 pl-2">
                      {c.subcategories.map((s) => (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => update({ category: c.name, subcategory: s.name })}
                          className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                            active && filters.subcategory === s.name
                              ? "bg-indigo-50 font-semibold text-indigo-700"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate">{s.name}</span>
                          <span className="whitespace-nowrap text-xs text-slate-400">
                            {s.count}
                            {s.count - s.published > 0 && <span className="ml-1 text-amber-600">· {s.count - s.published} draft</span>}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{heading}</h2>
              <p className="text-sm text-slate-500">
                {loading ? "Loading…" : total ? `Showing ${first}–${last} of ${total} quizzes` : "No quizzes"}
                {filters.q && ` matching “${filters.q}”`}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Per page
              <select
                value={filters.limit}
                onChange={(e) => update({ limit: Number(e.target.value) })}
                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
              >
                {QUIZ_PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selected && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-sm text-slate-600">
                <span className="font-medium text-emerald-700">{selected.published} published</span>
                {" · "}
                <span className="font-medium text-amber-700">{selectedDrafts} draft</span>
                <span className="text-slate-400"> in {filters.subcategory ? "this subcategory" : "this category"}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={busy !== null || selectedDrafts === 0} onClick={() => bulkChange("published")}>
                  {busy === "bulk" ? "Saving…" : `Publish all drafts (${selectedDrafts})`}
                </Button>
                <Button variant="outline" size="sm" disabled={busy !== null || selected.published === 0} onClick={() => bulkChange("draft")}>
                  Move all to draft ({selected.published})
                </Button>
              </div>
            </div>
          )}

          {loading && !quizzes.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : !quizzes.length ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  {filters.q || filters.category || filters.status
                    ? "No quizzes match these filters."
                    : "No quizzes found. Create your first quiz!"}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid gap-6 md:grid-cols-2 xl:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
              {quizzes.map((quiz) => (
                <Card key={quiz._id}>
                  <CardHeader>
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                        {quiz.category || "No category"}
                        {quiz.subcategory ? ` › ${quiz.subcategory}` : ""}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          quiz.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {quiz.status === "published" ? "Published" : "Draft"}
                      </span>
                    </div>
                    <CardTitle className="text-base">{quiz.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {quiz.description && <p className="mb-4 line-clamp-2 text-sm text-gray-500">{quiz.description}</p>}
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Time Limit:</span> {quiz.timeLimit} minutes
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Questions:</span> {quiz.questionCount}
                      </p>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <Link href={`/admin/quizzes/${quiz._id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant={quiz.status === "published" ? "outline" : "default"}
                        size="sm"
                        disabled={busy !== null}
                        onClick={() => toggleQuiz(quiz)}
                      >
                        {busy === quiz._id ? "Saving…" : quiz.status === "published" ? "Unpublish" : "Publish"}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(quiz._id)}>
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav className="mt-6 flex flex-wrap items-center justify-center gap-1" aria-label="Quiz pages">
              <Button variant="outline" size="sm" disabled={filters.page <= 1 || loading} onClick={() => goTo(filters.page - 1)}>
                Previous
              </Button>
              {pageWindow(filters.page, pages).map((p, i) =>
                p === "gap" ? (
                  <span key={`gap-${i}`} className="px-2 text-slate-400">
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === filters.page ? "default" : "outline"}
                    size="sm"
                    aria-current={p === filters.page ? "page" : undefined}
                    disabled={loading && p !== filters.page}
                    onClick={() => goTo(p)}
                  >
                    {p}
                  </Button>
                ),
              )}
              <Button variant="outline" size="sm" disabled={filters.page >= pages || loading} onClick={() => goTo(filters.page + 1)}>
                Next
              </Button>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
