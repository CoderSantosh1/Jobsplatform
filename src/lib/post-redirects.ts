// Post redirects approved in Admin → SEO → Redirect Manager (seoreviews, kind "redirect", decision "approved").
// A post URL is "/<section>/<slug>-<id>" and the slug changes with the title, so redirects match on section + id:
// every old slug and the bare id of a duplicate or deleted post go to the approved target.
// Pure functions only, so unit tests can load this file directly; the database side is in live-redirects.ts.
import { idFromParam, type Section } from "./slug.ts";

export const POST_SECTIONS: readonly Section[] = ["jobs", "results", "admit-cards", "answer-keys", "admissions", "news"];

/** "jobs:6ae2…" → target path. */
export type PostRedirectMap = Map<string, string>;

const ID = /^[a-f0-9]{24}$/i;

/** Section and id of a post URL path, or null when the path is not a post page. */
export function parsePostPath(path: string): { section: Section; id: string } | null {
  const match = path.trim().match(/^\/([a-z-]+)\/([^/?#]+)\/?$/);
  if (!match || !POST_SECTIONS.includes(match[1] as Section)) return null;
  const id = idFromParam(match[2]);
  return ID.test(id) ? { section: match[1] as Section, id: id.toLowerCase() } : null;
}

function key(section: Section, id: string): string {
  return `${section}:${id.toLowerCase()}`;
}

/** Build the lookup from approved redirect decisions. Non-post paths, unsafe targets and self-redirects are skipped. */
export function buildPostRedirectMap(rows: { path: string; target: string }[]): PostRedirectMap {
  const map: PostRedirectMap = new Map();
  for (const row of rows) {
    const from = parsePostPath(row.path ?? "");
    const target = (row.target ?? "").trim();
    if (!from || !target.startsWith("/") || target.startsWith("//")) continue;
    const to = parsePostPath(target);
    if (to && to.section === from.section && to.id === from.id) continue;
    map.set(key(from.section, from.id), target);
  }
  return map;
}

/** Where a post URL param (slug-id or bare id) should redirect, or null. */
export function postRedirectFor(map: PostRedirectMap, section: Section, param: string): string | null {
  const id = idFromParam(param);
  return ID.test(id) ? (map.get(key(section, id)) ?? null) : null;
}

/** Drop rows whose post redirects elsewhere, so lists and the sitemap never link to a redirect. */
export function dropRedirectedPosts<T extends { _id: unknown }>(map: PostRedirectMap, section: Section, rows: T[]): T[] {
  if (!map.size) return rows;
  return rows.filter((r) => !map.has(key(section, String(r._id))));
}
