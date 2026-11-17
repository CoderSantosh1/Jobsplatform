// Test-series SEO rules derived from the audited snapshot (read-only).
// Used by /test-series/[category]/[sub], next.config.js redirects, and sitemap filtering.
import snapshot from "./admin-data/test-series-audit.json";

type SnapshotRow = {
  path: string;
  action: string;
  reason?: string;
};

const rows = (snapshot as { rows: SnapshotRow[] }).rows;

/** 58 duplicate/low-value test-series pages that should be noindexed until exam-specific questions are added. */
export const NOINDEX_TEST_SERIES_PATHS = new Set<string>(
  rows.filter((r) => r.action === "NOINDEX").map((r) => r.path),
);

/** 6 overlapping test-series pages permanently consolidated into their canonical category paths. */
export const CONSOLIDATED_TEST_SERIES_REDIRECTS: {
  source: string;
  destination: string;
  permanent: true;
}[] = rows
  .filter((r) => r.action === "CONSOLIDATE")
  .map((r) => {
    const match = r.reason?.match(/as (\/test-series\/[a-z0-9/-]+)/);
    return match ? { source: r.path, destination: match[1], permanent: true as const } : null;
  })
  .filter((r): r is { source: string; destination: string; permanent: true } => r !== null);

export const CONSOLIDATED_TEST_SERIES_SOURCES = new Set<string>(
  CONSOLIDATED_TEST_SERIES_REDIRECTS.map((r) => r.source),
);

export function isTestSeriesNoindex(path: string): boolean {
  return NOINDEX_TEST_SERIES_PATHS.has(path);
}

export function isTestSeriesExcludedFromSitemap(path: string): boolean {
  return NOINDEX_TEST_SERIES_PATHS.has(path) || CONSOLIDATED_TEST_SERIES_SOURCES.has(path);
}
