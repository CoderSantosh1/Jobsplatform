import type { Metadata } from "next";

export const SITE_URL = "https://www.sarkariresultsnow.com";
export const SITE_NAME = "Sarkari Results Now";
export const SITE_SHORT = "SRN";
export const TITLE_MAX = 60;
export const DEFAULT_OG_IMAGE = "/og-image.png";
const OG_IMAGE = { url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME };

/** Collapse whitespace, strip HTML tags and cut to `max` characters on a word boundary. */
export function clip(text: string | undefined | null, max: number): string {
  const clean = (text ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

/**
 * Parse admin-entered dates: Date objects, ISO strings, and Indian "dd-mm-yyyy" / "dd/mm/yyyy"
 * (read month-first only when the second number cannot be a month, e.g. "10/20/2026").
 */
export function parseDate(value: Date | string | undefined | null): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  const text = String(value).trim();
  const m = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) {
    let [day, month] = [Number(m[1]), Number(m[2])];
    if (month > 12 && day <= 12) [day, month] = [month, day];
    const date = new Date(Date.UTC(Number(m[3]), month - 1, day));
    return date.getUTCMonth() === month - 1 ? date : undefined;
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Format a date the way Indian readers expect, e.g. "20 Oct 2026" (Indian time zone). */
export function formatDate(value: Date | string | undefined | null): string {
  const date = parseDate(value);
  if (!date) return "";
  const dateOnly = typeof value === "string" && /^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/.test(value.trim());
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    // Plain dates are calendar days; timestamps are shown in Indian time.
    timeZone: dateOnly ? "UTC" : "Asia/Kolkata",
  });
}

/** True when an application deadline is more than a day in the past. */
export function isPastDeadline(...candidates: (Date | string | undefined | null)[]): boolean {
  const deadline = candidates.map(parseDate).find(Boolean);
  return !!deadline && deadline.getTime() < Date.now() - 24 * 60 * 60 * 1000;
}

/** Like formatDate, but keeps free-text values such as "Notify Soon" as they are. */
export function displayDate(value: Date | string | undefined | null): string {
  if (!value) return "";
  return formatDate(value) || String(value).trim();
}

/** True for admin placeholders that should not be shown to readers. */
export function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  const text = String(value).trim().toLowerCase();
  return ["", "n/a", "na", "-", "0", "not mentioned", "not mentioned/-", "null", "undefined", "nil"].includes(text);
}

const TRAILING_FILLER = /[\s,.;:|&(–—-]+$|\s+(and|or|of|for|in|the|to|a|an|with|at|by|from)$/i;

/**
 * Fit a title into `max` characters for search results: add " | SRN" when it fits,
 * otherwise cut at a word boundary (never mid-word, no "…", no dangling "(" or "&").
 */
export function fitTitle(title: string, max = TITLE_MAX, suffix = ` | ${SITE_SHORT}`): string {
  const clean = title.replace(/\s+/g, " ").trim();
  if (clean.length + suffix.length <= max) return clean + suffix;
  if (clean.length <= max) return clean;
  let cut = clean.slice(0, max + 1);
  cut = cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : max);
  // Drop an unclosed bracket part such as "Court Assistant (Technical".
  const open = cut.lastIndexOf("(");
  if (open > 0 && cut.indexOf(")", open) === -1) cut = cut.slice(0, open);
  let prev;
  do {
    prev = cut;
    cut = cut.replace(TRAILING_FILLER, "");
  } while (cut !== prev);
  return cut || clean.slice(0, max);
}

/**
 * Build page metadata with a unique title, description and a canonical URL.
 * `path` must start with "/". The <title> is fitted to 60 characters; social cards keep the full title.
 */
export function pageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  const desc = clip(description, 160);
  return {
    title: { absolute: fitTitle(title) },
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: desc,
      url: path,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_IN",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [OG_IMAGE],
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}
