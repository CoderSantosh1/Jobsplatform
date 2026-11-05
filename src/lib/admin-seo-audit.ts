// Test-series SEO audit snapshot for the admin panel (server only). The snapshot is produced by a read-only crawl;
// nothing here changes pages, the sitemap or robots settings.
import snapshot from "./admin-data/test-series-audit.json";
import { contentCompleteness, type AuditRow } from "./admin-seo-rules";

export type AuditSnapshot = { auditedAt: string; source: string; method: string; rows: AuditRow[] };

const data = snapshot as AuditSnapshot;

export function auditSnapshot(): AuditSnapshot & { rows: (AuditRow & { completeness: number | null })[] } {
  return { ...data, rows: data.rows.map((r) => ({ ...r, completeness: contentCompleteness(r) })) };
}

export function auditSummary() {
  const counts: Record<string, number> = {};
  for (const r of data.rows) counts[r.action] = (counts[r.action] ?? 0) + 1;
  return { auditedAt: data.auditedAt, total: data.rows.length, counts };
}
