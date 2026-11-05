// Pure helpers for the admin SEO audit views, so unit tests can load this file directly.

export type AuditAction = "KEEP" | "IMPROVE" | "NOINDEX" | "CONSOLIDATE" | "NONE (404)";

export type AuditRow = {
  path: string;
  name: string;
  category: string;
  type: "exam" | "category";
  status: number;
  action: AuditAction;
  tests: number | null;
  sharedPct: number | null;
  reusedSamples: number | null;
  templatePct: number | null;
  relatedPosts: number | null;
  inSitemap: boolean;
  inlinks: number;
  indexable: boolean;
  canonicalOk: boolean | null;
  reason: string;
};

/**
 * Content completeness out of 5, an internal checklist (not a Google score): enough tests, mostly its own questions,
 * related posts, linked from the sitemap or an exam hub, and less than half template text. Null for non-exam pages.
 */
export function contentCompleteness(r: AuditRow): number | null {
  if (r.type !== "exam" || r.status !== 200) return null;
  return [
    (r.tests ?? 0) >= 20,
    r.sharedPct !== null && r.sharedPct <= 50,
    (r.relatedPosts ?? 0) >= 1,
    r.inSitemap,
    r.templatePct !== null && r.templatePct < 50,
  ].filter(Boolean).length;
}

export function uniquePct(r: Pick<AuditRow, "sharedPct">): number | null {
  return r.sharedPct === null ? null : +(100 - r.sharedPct).toFixed(1);
}

export type AuditFilters = { q?: string; category?: string; action?: string; type?: string; sort?: keyof AuditRow | "uniquePct" | "completeness"; dir?: "asc" | "desc" };

export function filterAuditRows<T extends AuditRow>(rows: T[], f: AuditFilters): T[] {
  const q = f.q?.trim().toLowerCase();
  const out = rows.filter(
    (r) =>
      (!q || r.name.toLowerCase().includes(q) || r.path.includes(q)) &&
      (!f.category || r.category === f.category) &&
      (!f.action || r.action === f.action) &&
      (!f.type || r.type === f.type),
  );
  if (!f.sort) return out;
  const key = f.sort;
  const sign = f.dir === "desc" ? -1 : 1;
  const val = (r: T) => (key === "uniquePct" ? uniquePct(r) : ((r as Record<string, unknown>)[key] as unknown));
  return [...out].sort((a, b) => {
    const x = val(a), y = val(b);
    if (x === y) return 0;
    if (x === null || x === undefined) return 1;
    if (y === null || y === undefined) return -1;
    return (x < y ? -1 : 1) * sign;
  });
}

/** CSV for download; values containing commas, quotes or line breaks are quoted. */
export function auditCsv(rows: (AuditRow & { completeness?: number | null })[]): string {
  const cols = [
    "name", "path", "category", "type", "status", "action", "tests", "uniquePct", "sharedPct", "reusedSamples",
    "templatePct", "completeness", "relatedPosts", "inSitemap", "inlinks", "reason",
  ] as const;
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const line = (r: AuditRow & { completeness?: number | null }) =>
    cols.map((c) => esc(c === "uniquePct" ? uniquePct(r) : c === "path" ? `https://www.sarkariresultsnow.com${r.path}` : (r as Record<string, unknown>)[c])).join(",");
  return [cols.join(","), ...rows.map(line)].join("\n");
}
