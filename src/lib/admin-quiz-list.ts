// Query helpers for the admin Quiz Management list: one page of quizzes (no question bodies) and the
// category → subcategory counts for the filters. Pure functions only, so unit tests can load this file directly.

export const QUIZ_PAGE_SIZES = [12, 24, 48, 96] as const;
export const DEFAULT_QUIZ_PAGE_SIZE = 24;

export type QuizListParams = {
  page: number;
  limit: number;
  category: string;
  subcategory: string;
  q: string;
  status: "" | "published" | "draft";
};

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Read and clamp the list parameters from a request URL. */
export function parseQuizListParams(searchParams: URLSearchParams): QuizListParams {
  const page = Math.max(1, Math.floor(Number(searchParams.get("page"))) || 1);
  const rawLimit = Math.floor(Number(searchParams.get("limit"))) || DEFAULT_QUIZ_PAGE_SIZE;
  const limit = Math.min(100, Math.max(1, rawLimit));
  const status = searchParams.get("status");
  return {
    page,
    limit,
    category: (searchParams.get("category") ?? "").trim().slice(0, 200),
    subcategory: (searchParams.get("subcategory") ?? "").trim().slice(0, 200),
    q: (searchParams.get("q") ?? "").trim().slice(0, 200),
    status: status === "published" || status === "draft" ? status : "",
  };
}

/** Mongo filter for the list: exact category / subcategory, status, and a title or description search. */
export function quizListFilter(p: Pick<QuizListParams, "category" | "subcategory" | "q" | "status">): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (p.category) filter.category = p.category;
  if (p.subcategory) filter.subcategory = p.subcategory;
  if (p.status) filter.status = p.status;
  if (p.q) {
    const rx = { $regex: escapeRegex(p.q), $options: "i" };
    filter.$or = [{ title: rx }, { description: rx }];
  }
  return filter;
}

/** One page of quizzes with a question count instead of the questions, plus the total, in one round trip. */
export function quizListPipeline(p: QuizListParams): Record<string, unknown>[] {
  return [
    { $match: quizListFilter(p) },
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $facet: {
        items: [
          { $skip: (p.page - 1) * p.limit },
          { $limit: p.limit },
          {
            $project: {
              title: 1,
              description: 1,
              category: 1,
              subcategory: 1,
              timeLimit: 1,
              totalMarks: 1,
              status: 1,
              createdAt: 1,
              updatedAt: 1,
              questionCount: { $size: { $ifNull: ["$questions", []] } },
            },
          },
        ],
        total: [{ $count: "n" }],
      },
    },
  ];
}

export type QuizStatus = "published" | "draft";

/** "published" or "draft", or null for anything else. */
export function parseQuizStatus(value: unknown): QuizStatus | null {
  return value === "published" || value === "draft" ? value : null;
}

/**
 * Filter for a bulk status change: either explicit quiz ids, or a whole category (optionally one subcategory).
 * Never "every quiz": a bulk change must name what it applies to.
 */
export function bulkStatusFilter(body: {
  ids?: unknown;
  category?: unknown;
  subcategory?: unknown;
}): { filter: Record<string, unknown> } | { error: string } {
  if (Array.isArray(body.ids)) {
    const ids = body.ids.filter((id): id is string => typeof id === "string" && /^[a-f0-9]{24}$/i.test(id));
    if (!ids.length || ids.length !== body.ids.length) return { error: "ids must be quiz ids" };
    if (ids.length > 500) return { error: "At most 500 quizzes at a time" };
    return { filter: { _id: { $in: ids } } };
  }
  const category = typeof body.category === "string" ? body.category.trim() : "";
  if (!category) return { error: "Choose quizzes or a category" };
  const subcategory = typeof body.subcategory === "string" ? body.subcategory.trim() : "";
  return { filter: subcategory ? { category, subcategory } : { category } };
}

/** Category → subcategory counts, for the filter dropdowns. */
export const QUIZ_FACETS_PIPELINE: Record<string, unknown>[] = [
  {
    $group: {
      _id: { c: "$category", s: "$subcategory" },
      count: { $sum: 1 },
      published: { $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] } },
    },
  },
];

export type QuizFacetCount = { name: string; count: number; published: number };
export type QuizFacet = QuizFacetCount & { subcategories: QuizFacetCount[] };

/** Turn the grouped counts into sorted categories with their subcategories. Blank names are left out. */
export function buildQuizFacets(
  rows: { _id: { c?: string | null; s?: string | null }; count: number; published?: number }[],
): QuizFacet[] {
  const map = new Map<string, QuizFacet>();
  for (const r of rows) {
    const c = (r._id?.c ?? "").trim();
    if (!c) continue;
    const published = r.published ?? 0;
    const facet = map.get(c) ?? { name: c, count: 0, published: 0, subcategories: [] };
    facet.count += r.count;
    facet.published += published;
    const s = (r._id?.s ?? "").trim();
    if (s) {
      const sub = facet.subcategories.find((x) => x.name === s);
      if (sub) {
        sub.count += r.count;
        sub.published += published;
      } else facet.subcategories.push({ name: s, count: r.count, published });
    }
    map.set(c, facet);
  }
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  return [...map.values()].sort(byName).map((f) => ({ ...f, subcategories: f.subcategories.sort(byName) }));
}
