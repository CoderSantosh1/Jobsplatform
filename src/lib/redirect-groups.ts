// Groups redirect paths for the admin Redirect Manager: posts by section, test series by category, the rest apart.
// Pure functions only, so unit tests can load this file directly.
import { parsePostPath } from "./post-redirects.ts";

export type RedirectTab = "posts" | "test-series" | "other";

export const REDIRECT_TABS: { key: RedirectTab; label: string }[] = [
  { key: "posts", label: "Posts" },
  { key: "test-series", label: "Test series" },
  { key: "other", label: "Other pages" },
];

const SECTION_NAMES: Record<string, string> = {
  jobs: "Jobs",
  results: "Results",
  "admit-cards": "Admit Cards",
  "answer-keys": "Answer Keys",
  admissions: "Admissions",
  news: "News",
};

/** "regulatory-body-exams" → "Regulatory Body Exams". */
export function slugLabel(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Tab and group heading for a redirect source path. */
export function redirectGroup(path: string): { tab: RedirectTab; group: string } {
  const post = parsePostPath(path);
  if (post) return { tab: "posts", group: SECTION_NAMES[post.section] ?? post.section };
  const ts = path.trim().match(/^\/test-series(?:\/([^/?#:]+))?/);
  if (ts) return { tab: "test-series", group: ts[1] ? slugLabel(ts[1]) : "All test series" };
  return { tab: "other", group: "Other pages" };
}

/** Rows of one tab, grouped by heading (headings sorted A–Z, row order kept within a group). */
export function groupByHeading<T>(rows: T[], pathOf: (row: T) => string, tab: RedirectTab): { group: string; rows: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const g = redirectGroup(pathOf(row));
    if (g.tab !== tab) continue;
    groups.set(g.group, [...(groups.get(g.group) ?? []), row]);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([group, list]) => ({ group, rows: list }));
}

/**
 * One page of a tab's rows, still grouped. Rows are ordered group by group, then cut into pages of `size`,
 * so a group can continue on the next page (its heading is repeated there).
 */
export function pagedGroups<T>(
  rows: T[],
  pathOf: (row: T) => string,
  tab: RedirectTab,
  page: number,
  size: number,
): { groups: { group: string; rows: T[] }[]; page: number; pages: number; total: number } {
  const ordered = groupByHeading(rows, pathOf, tab).flatMap((g) => g.rows);
  const pages = Math.max(1, Math.ceil(ordered.length / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  const slice = ordered.slice((current - 1) * size, current * size);
  return { groups: groupByHeading(slice, pathOf, tab), page: current, pages, total: ordered.length };
}

/** How many rows fall in each tab. */
export function countByTab<T>(rows: T[], pathOf: (row: T) => string): Record<RedirectTab, number> {
  const counts: Record<RedirectTab, number> = { posts: 0, "test-series": 0, other: 0 };
  for (const row of rows) counts[redirectGroup(pathOf(row)).tab] += 1;
  return counts;
}
