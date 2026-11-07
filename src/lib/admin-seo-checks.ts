// Pure SEO checks for the admin SEO tools. No database or Next imports, so unit tests load this file directly.
// These are internal content checks, not Google's ranking or indexing decisions.
import { detailText } from "./detail-titles.ts";
import { TITLE_MAX, clip, fitTitle, isPastDeadline } from "./seo.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyDoc = Record<string, any>;

export const DESCRIPTION_MAX = 160;
export const DESCRIPTION_MIN = 70;
export const TITLE_MIN = 25;

export type ContentIssue = "title-cut" | "title-short" | "description-short" | "duplicate" | "same-search-title" | "no-organization" | "expired" | "draft";

export const ISSUE_LABEL: Record<ContentIssue, string> = {
  "title-cut": "Title cut to 60 chars",
  "title-short": "Title too short",
  "description-short": "Description too short",
  duplicate: "Duplicate title",
  "same-search-title": "Same search title as another post",
  "no-organization": "No organization",
  expired: "Deadline passed",
  draft: "Draft (not public)",
};

export type ContentSeoRow = {
  id: string;
  section: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  status: string;
  issues: ContentIssue[];
};

/**
 * The title and description the public page really renders (same builders as the detail pages),
 * and what is wrong with them. `duplicate` is true when another post has the same title.
 */
export function contentSeoRow(section: string, doc: AnyDoc, duplicate = false): ContentSeoRow {
  const text = detailText(section, doc);
  const metaTitle = fitTitle(text.title);
  const metaDescription = clip(text.description, DESCRIPTION_MAX);
  const issues: ContentIssue[] = [];
  const status = String(doc.status ?? "published");
  if (status === "draft") issues.push("draft");
  if (text.title.replace(/\s+/g, " ").trim().length > TITLE_MAX) issues.push("title-cut");
  if (metaTitle.length < TITLE_MIN) issues.push("title-short");
  if (metaDescription.length < DESCRIPTION_MIN) issues.push("description-short");
  if (duplicate) issues.push("duplicate");
  if (!String(doc.organization ?? "").trim()) issues.push("no-organization");
  if (section === "jobs" && status !== "draft" && isPastDeadline(doc.lastDateApplyOnline, doc.applicationDeadline)) issues.push("expired");
  return { id: String(doc._id), section, title: String(doc.title ?? ""), metaTitle, metaDescription, status, issues };
}

// ---------- Page inspection (HTML of one page) ----------

export type JsonLdBlock = { types: string[]; data: unknown; error?: string; missing: string[] };

export type PageSeo = {
  status: number;
  location: string | null;
  title: string;
  description: string;
  canonical: string | null;
  robots: string | null;
  xRobotsTag: string | null;
  noindex: boolean;
  h1: string[];
  jsonLd: JsonLdBlock[];
  internalLinks: string[];
  /** Words of readable text in <main> (scripts, header, nav and footer left out). */
  words: number;
};

/** Readable words in a page's main content: <main> if present, without scripts, styles, header, nav or footer. */
export function mainWordCount(html: string): number {
  let h = html.replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ");
  const main = h.match(/<main\b[^>]*>([\s\S]*)<\/main>/i);
  if (main) h = main[1];
  const text = h
    .replace(/<(header|footer|nav)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(" ").length : 0;
}

export const LOW_WORDS = 300;
/** Legal and contact pages are not meant to rank, so only "thin" (not "low content") applies to them. */
export const UTILITY_PATHS = ["/contact", "/about", "/privacy-policy", "/terms", "/disclaimer"];
export const THIN_WORDS = 150;

export type HealthIssue =
  | "not-200"
  | "redirect"
  | "noindex-in-sitemap"
  | "canonical-other"
  | "canonical-missing"
  | "title-missing"
  | "title-long"
  | "description-missing"
  | "description-short"
  | "h1"
  | "thin"
  | "low-content"
  | "schema-invalid"
  | "schema-incomplete"
  | "duplicate-title"
  | "duplicate-description";

export const HEALTH_LABEL: Record<HealthIssue, string> = {
  "not-200": "Error status",
  redirect: "Redirects",
  "noindex-in-sitemap": "Noindex but in sitemap",
  "canonical-other": "Canonical points elsewhere",
  "canonical-missing": "No canonical",
  "title-missing": "No title",
  "title-long": "Title over 60",
  "description-missing": "No description",
  "description-short": "Short description",
  h1: "Not exactly one H1",
  thin: `Thin (< ${THIN_WORDS} words)`,
  "low-content": `Low content (< ${LOW_WORDS} words)`,
  "schema-invalid": "Invalid JSON-LD",
  "schema-incomplete": "JSON-LD missing fields",
  "duplicate-title": "Same title as another page",
  "duplicate-description": "Same description as another page",
};

/** Problems on one fetched page. Duplicate checks need the whole crawl, see `markDuplicates`. */
export function pageHealthIssues(path: string, page: PageSeo, origin: string, inSitemap = true): HealthIssue[] {
  if (page.status >= 300 && page.status < 400) return ["redirect"];
  if (page.status !== 200) return ["not-200"];
  const issues: HealthIssue[] = [];
  if (page.noindex && inSitemap) issues.push("noindex-in-sitemap");
  const canon = canonicalVerdict(path, page.canonical, origin);
  if (canon === "missing") issues.push("canonical-missing");
  else if (canon === "other") issues.push("canonical-other");
  if (!page.title) issues.push("title-missing");
  else if (page.title.length > TITLE_MAX) issues.push("title-long");
  if (!page.description) issues.push("description-missing");
  else if (page.description.length < DESCRIPTION_MIN) issues.push("description-short");
  if (page.h1.length !== 1) issues.push("h1");
  if (page.words < THIN_WORDS) issues.push("thin");
  else if (page.words < LOW_WORDS && !UTILITY_PATHS.includes(path.replace(/\/+$/, ""))) issues.push("low-content");
  if (page.jsonLd.some((b) => b.error)) issues.push("schema-invalid");
  if (page.jsonLd.some((b) => b.missing.length)) issues.push("schema-incomplete");
  return issues;
}

/** Add duplicate-title / duplicate-description to pages that share them with another indexable page. */
export function markDuplicates<T extends { path: string; page: Pick<PageSeo, "status" | "noindex" | "title" | "description">; issues: HealthIssue[] }>(rows: T[]): T[] {
  const live = rows.filter((r) => r.page.status === 200 && !r.page.noindex);
  for (const [field, issue] of [["title", "duplicate-title"], ["description", "duplicate-description"]] as const) {
    const groups = new Map<string, T[]>();
    for (const r of live) {
      const key = r.page[field].trim().toLowerCase();
      if (key) groups.set(key, [...(groups.get(key) ?? []), r]);
    }
    for (const group of groups.values()) if (group.length > 1) for (const r of group) if (!r.issues.includes(issue)) r.issues.push(issue);
  }
  return rows;
}

function decode(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
  return m ? decode(m[2] ?? m[3] ?? "") : null;
}

function findTag(html: string, tag: string, test: (t: string) => boolean): string | null {
  for (const m of html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, "gi"))) if (test(m[0])) return m[0];
  return null;
}

/** Required properties we check per schema.org type (a short, practical list, not the full spec). */
export const SCHEMA_REQUIRED: Record<string, string[]> = {
  JobPosting: ["title", "description", "datePosted", "hiringOrganization"],
  NewsArticle: ["headline", "datePublished"],
  Article: ["headline", "datePublished"],
  FAQPage: ["mainEntity"],
  BreadcrumbList: ["itemListElement"],
  Quiz: ["name"],
  Course: ["name", "description", "provider"],
  ItemList: ["itemListElement"],
  Organization: ["name", "url"],
  WebSite: ["name", "url"],
  Event: ["name", "startDate"],
};

function typesOf(node: unknown): string[] {
  if (!node || typeof node !== "object") return [];
  const t = (node as { "@type"?: unknown })["@type"];
  return Array.isArray(t) ? t.map(String) : t ? [String(t)] : [];
}

/** Missing required properties of one JSON-LD node, as "Type.property". */
export function schemaMissing(node: unknown): string[] {
  if (!node || typeof node !== "object") return [];
  const missing: string[] = [];
  for (const type of typesOf(node)) {
    for (const key of SCHEMA_REQUIRED[type] ?? []) {
      const v = (node as Record<string, unknown>)[key];
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) missing.push(`${type}.${key}`);
    }
  }
  return missing;
}

function flatten(data: unknown): unknown[] {
  if (Array.isArray(data)) return data.flatMap(flatten);
  if (data && typeof data === "object" && Array.isArray((data as { "@graph"?: unknown })["@graph"])) {
    return flatten((data as { "@graph": unknown[] })["@graph"]);
  }
  return [data];
}

/** Title, description, canonical, robots, headings, JSON-LD and internal links of one page's HTML. */
export function parsePageSeo(html: string, opts: { status: number; location?: string | null; xRobotsTag?: string | null; origin: string }): PageSeo {
  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const descTag = findTag(html, "meta", (t) => attr(t, "name")?.toLowerCase() === "description");
  const robotsTag = findTag(html, "meta", (t) => attr(t, "name")?.toLowerCase() === "robots");
  const canonTag = findTag(html, "link", (t) => (attr(t, "rel") ?? "").toLowerCase().split(/\s+/).includes("canonical"));
  const robots = robotsTag ? attr(robotsTag, "content") : null;
  const xRobotsTag = opts.xRobotsTag ?? null;
  const noindex = /\bnoindex\b/i.test(`${robots ?? ""} ${xRobotsTag ?? ""}`);

  const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decode(m[1].replace(/<[^>]+>/g, " "))).filter(Boolean);

  const jsonLd: JsonLdBlock[] = [];
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]);
      for (const node of flatten(data)) jsonLd.push({ types: typesOf(node), data: node, missing: schemaMissing(node) });
    } catch (e) {
      jsonLd.push({ types: [], data: null, error: e instanceof Error ? e.message : "Invalid JSON", missing: [] });
    }
  }

  const links = new Set<string>();
  for (const m of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = attr(m[0], "href");
    if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) continue;
    try {
      const u = new URL(href, opts.origin);
      if (u.origin === new URL(opts.origin).origin) links.add(u.pathname);
    } catch {
      // ignore malformed links
    }
  }

  return {
    status: opts.status,
    location: opts.location ?? null,
    title,
    description: descTag ? attr(descTag, "content") ?? "" : "",
    canonical: canonTag ? attr(canonTag, "href") : null,
    robots,
    xRobotsTag,
    noindex,
    h1,
    jsonLd,
    internalLinks: [...links].sort(),
    words: mainWordCount(html),
  };
}

export type CanonicalVerdict = "self" | "other" | "missing";

/** Whether a page's canonical points at itself (ignoring host, trailing slash and query). */
export function canonicalVerdict(path: string, canonical: string | null, origin: string): CanonicalVerdict {
  if (!canonical) return "missing";
  const norm = (p: string) => decodeURI(p).replace(/\/+$/, "") || "/";
  try {
    return norm(new URL(canonical, origin).pathname) === norm(new URL(path, origin).pathname) ? "self" : "other";
  } catch {
    return "other";
  }
}

/** A site path we may fetch: starts with one "/", no spaces, no protocol or host. */
export function isSafePath(path: unknown): path is string {
  return typeof path === "string" && /^\/(?!\/)[^\s\\]*$/.test(path) && path.length <= 500;
}

// ---------- Redirect proposals ----------

export type RedirectRule = { from: string; to: string };

/** Problems with a proposed redirect, checked against the rules already approved or configured. */
export function redirectProblems(rule: RedirectRule, existing: RedirectRule[]): string[] {
  const problems: string[] = [];
  const clean = (p: string) => p.replace(/\/+$/, "") || "/";
  if (!isSafePath(rule.from)) problems.push("From must be a site path starting with /");
  if (!isSafePath(rule.to)) problems.push("To must be a site path starting with /");
  if (problems.length) return problems;
  const from = clean(rule.from);
  const to = clean(rule.to);
  if (from === "/") problems.push("The homepage cannot be redirected");
  if (to === "/") problems.push("Redirecting to the homepage is not allowed; pick the closest matching page");
  if (from === to) problems.push("From and To are the same page");
  const others = existing.filter((r) => clean(r.from) !== from);
  if (others.some((r) => clean(r.from) === to)) problems.push("To is itself redirected (would create a chain)");
  if (others.some((r) => clean(r.to) === from)) problems.push("Another rule already redirects to From (would create a chain)");
  return problems;
}
