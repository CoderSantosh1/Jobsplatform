// Duplicate posts (the same job/result entered twice) look like "Duplicate without user-selected canonical"
// to Google. We pick one copy per title as the canonical: the oldest, since it has been live longest.
// Pure functions only, so unit tests can load this file directly.
import { slugify } from "./slug.ts";

/** Key that treats titles differing only in case, spacing or punctuation as the same post. */
export function titleKey(title: string | undefined | null): string {
  return slugify(title, 200);
}

/** Mongo ObjectIds sort by creation time, so the smaller id is the older document. */
function olderFirst(a: { _id: unknown }, b: { _id: unknown }): number {
  return String(a._id) < String(b._id) ? -1 : String(a._id) > String(b._id) ? 1 : 0;
}

/** The canonical copy among documents sharing a title (oldest wins). */
export function canonicalOf<T extends { _id: unknown }>(copies: T[]): T | undefined {
  return [...copies].sort(olderFirst)[0];
}

/**
 * Keep one document per title for the sitemap. Titles with no Latin characters have an empty key
 * and are never merged, because we cannot tell them apart reliably.
 */
export function uniqueByTitle<T extends { _id: unknown; title?: string }>(rows: T[]): T[] {
  const best = new Map<string, T>();
  const keep: T[] = [];
  for (const row of rows) {
    const key = titleKey(row.title);
    if (!key) {
      keep.push(row);
      continue;
    }
    const current = best.get(key);
    if (!current || olderFirst(row, current) < 0) best.set(key, row);
  }
  const winners = new Set([...best.values()]);
  // Preserve the input order.
  return rows.filter((r) => winners.has(r) || keep.includes(r));
}

/** Case-insensitive regex source matching any title that slugifies to `key` (verify with titleKey after). */
export function titleRegexSource(key: string): string {
  return `^[^a-z0-9]*${key.split("-").join("[^a-z0-9]+")}[^a-z0-9]*$`;
}
