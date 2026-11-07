// Server-side data for the admin SEO tools. Read-only towards content: it never edits posts, the sitemap,
// robots settings or redirects.
import type { Model } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Job from "@/lib/models/Job";
import Result from "@/lib/models/Result";
import AdmitCard from "@/lib/models/AdmitCard";
import AnswerKey from "@/lib/models/AnswerKey";
import Admission from "@/lib/models/Admission";
import News from "@/lib/models/News";
import { SITEMAP_NAMES, getSitemapEntries } from "@/lib/sitemap";
import { titleKey } from "@/lib/dedupe";
import { detailPath, type Section } from "@/lib/slug";
import { SITE_URL } from "@/lib/seo";
import { contentSeoRow, isSafePath, parsePageSeo, type ContentSeoRow, type PageSeo } from "@/lib/admin-seo-checks";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const SECTIONS: { section: Section; label: string; model: Model<any> }[] = [
  { section: "jobs", label: "Jobs", model: Job },
  { section: "results", label: "Results", model: Result },
  { section: "admit-cards", label: "Admit Cards", model: AdmitCard },
  { section: "answer-keys", label: "Answer Keys", model: AnswerKey },
  { section: "admissions", label: "Admissions", model: Admission },
  { section: "news", label: "News", model: News },
];

// Only the fields the title/description builders read; long body text is cut in the database.
const FIELDS = {
  title: 1,
  organization: 1,
  status: 1,
  totalVacancy: 1,
  lastDateApplyOnline: 1,
  applicationDeadline: 1,
  resultDate: 1,
  content: { $substrCP: [{ $ifNull: ["$content", ""] }, 0, 400] },
};

export type ContentAuditRow = ContentSeoRow & { url: string; adminTab: string };

/** Every post with the title and description its public page renders, and the issues found. */
export async function contentSeoAudit(): Promise<ContentAuditRow[]> {
  await connectToDatabase();
  const perSection = await Promise.all(
    SECTIONS.map(async ({ section, model }) => {
      const docs = await model.aggregate([{ $sort: { _id: -1 } }, { $project: FIELDS }]);
      const seen = new Map<string, number>();
      for (const d of docs) {
        const k = titleKey(d.title);
        if (k) seen.set(k, (seen.get(k) ?? 0) + 1);
      }
      const rows = docs.map((d: any) => ({
        ...contentSeoRow(section, d, (seen.get(titleKey(d.title)) ?? 0) > 1),
        url: detailPath(section, d),
        adminTab: section,
      }));
      // Different titles that become the same title in search results once cut to 60 characters
      // (usually the same notice posted twice). Not caught by the exact duplicate check, so Google sees two pages.
      const bySearchTitle = new Map<string, ContentAuditRow[]>();
      for (const r of rows) {
        if (r.status === "draft" || r.issues.includes("duplicate")) continue;
        const k = r.metaTitle.toLowerCase();
        bySearchTitle.set(k, [...(bySearchTitle.get(k) ?? []), r]);
      }
      for (const group of bySearchTitle.values()) if (group.length > 1) for (const r of group) r.issues.push("same-search-title");
      return rows;
    }),
  );
  return perSection.flat();
}

export type SitemapUrl = { loc: string; path: string; lastmod: string | null };

/** Every URL in each child sitemap, built by the same code that serves /sitemaps/<name>.xml. */
export async function sitemapInventory(): Promise<{ name: string; urls: SitemapUrl[] }[]> {
  return Promise.all(
    SITEMAP_NAMES.map(async (name) => {
      const entries = await getSitemapEntries(name);
      return {
        name,
        urls: entries.map((e) => ({
          loc: e.loc,
          path: e.loc.startsWith(SITE_URL) ? e.loc.slice(SITE_URL.length) || "/" : e.loc,
          lastmod: e.lastmod ? e.lastmod.toISOString() : null,
        })),
      };
    }),
  );
}

export type InspectTarget = "live" | "local";

/**
 * Fetch one page of this site and read its SEO tags. The host is fixed (the live site, or the server
 * answering this request), so an admin cannot make the server fetch other websites.
 */
export async function inspectPath(path: string, target: InspectTarget, requestUrl: string): Promise<PageSeo & { url: string }> {
  if (!isSafePath(path)) throw new Error("Enter a path that starts with /");
  const origin = target === "local" ? new URL(requestUrl).origin : SITE_URL;
  const url = `${origin}${path}`;
  const res = await fetch(url, {
    redirect: "manual",
    cache: "no-store",
    headers: { "User-Agent": "SarkariResultsNow-AdminInspector/1.0", Accept: "text/html" },
    signal: AbortSignal.timeout(15_000),
  });
  const type = res.headers.get("content-type") ?? "";
  const html = type.includes("html") ? await res.text() : "";
  return {
    url,
    ...parsePageSeo(html, {
      status: res.status,
      location: res.headers.get("location"),
      xRobotsTag: res.headers.get("x-robots-tag"),
      origin,
    }),
  };
}
