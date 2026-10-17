import type { Metadata } from "next";

export const SITE_URL = "https://www.sarkariresultsnow.com";
export const SITE_NAME = "Sarkari Results Now";
export const DEFAULT_OG_IMAGE = "/logo.png";

/** Collapse whitespace, strip HTML tags and cut to `max` characters on a word boundary. */
export function clip(text: string | undefined | null, max: number): string {
  const clean = (text ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

/** Format a date the way Indian readers expect, e.g. "20 Oct 2026". */
export function formatDate(value: Date | string | undefined | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
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

/**
 * Build page metadata with a unique title, description and a canonical URL.
 * `path` must start with "/". The root layout's title template appends the site name.
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
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: desc,
      url: path,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_IN",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [DEFAULT_OG_IMAGE],
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}
