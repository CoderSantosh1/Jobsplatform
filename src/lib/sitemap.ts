import type { Model } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Job from "@/lib/models/Job";
import Result from "@/lib/models/Result";
import AdmitCard from "@/lib/models/AdmitCard";
import AnswerKey from "@/lib/models/AnswerKey";
import Admission from "@/lib/models/Admission";
import News from "@/lib/models/News";
import Quiz from "@/lib/models/Quiz";
import { EXAMS } from "@/lib/exams";
import { examTestSeries } from "@/lib/exam-links";
import { getExamContent } from "@/lib/exam-content";
import { getExamPrep } from "@/lib/exam-prep";
import { uniqueByTitle } from "@/lib/dedupe";
import { withoutRedirectedPosts } from "@/lib/live-redirects";
import { LEGAL_LAST_UPDATED } from "@/lib/legal";
import { slugify, detailPath, type Section } from "@/lib/slug";
import { SITE_URL } from "@/lib/seo";
import { isTestSeriesExcludedFromSitemap } from "@/lib/test-series-seo";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type UrlEntry = { loc: string; lastmod?: Date };

/** Child sitemaps listed in /sitemap.xml. Single quiz pages are deliberately left out (they are noindex). */
export const SITEMAP_NAMES = [
  "pages",
  "jobs",
  "results",
  "admit-cards",
  "answer-keys",
  "admissions",
  "news",
  "test-series",
] as const;
export type SitemapName = (typeof SITEMAP_NAMES)[number];

const SECTION_MODELS: Record<Section, { model: Model<any>; filter: Record<string, unknown> }> = {
  jobs: { model: Job, filter: { status: "published" } },
  results: { model: Result, filter: {} },
  "admit-cards": { model: AdmitCard, filter: {} },
  "answer-keys": { model: AnswerKey, filter: { status: { $ne: "draft" } } },
  admissions: { model: Admission, filter: { status: { $ne: "draft" } } },
  news: { model: News, filter: { status: { $ne: "draft" } } },
};

type Row = { _id: unknown; title?: string; updatedAt?: Date; createdAt?: Date; postedDate?: Date; resultDate?: Date };

/** The real last-change date of a document: updatedAt, else the date it was posted. */
function modified(row: Row): Date | undefined {
  const value = row.updatedAt ?? row.postedDate ?? row.createdAt ?? row.resultDate;
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function latest(dates: (Date | undefined)[]): Date | undefined {
  let max: Date | undefined;
  for (const d of dates) if (d && (!max || d > max)) max = d;
  return max;
}

async function sectionRows(section: Section): Promise<Row[]> {
  const { model, filter } = SECTION_MODELS[section];
  return model
    .find(filter)
    .select("_id title updatedAt createdAt postedDate resultDate")
    .sort({ _id: -1 })
    .lean<Row[]>();
}

async function sectionEntries(section: Section): Promise<UrlEntry[]> {
  // A post entered twice is listed once, at its canonical (oldest) copy.
  // Posts with an approved redirect (admin Redirect Manager) are not submitted either.
  const rows = uniqueByTitle(await withoutRedirectedPosts(section, await sectionRows(section)));
  return rows.map((r) => ({ loc: `${SITE_URL}${detailPath(section, { _id: r._id, title: r.title })}`, lastmod: modified(r) }));
}

/** Newest change in a section, without loading every document. */
async function sectionLatest(section: Section): Promise<Date | undefined> {
  const { model, filter } = SECTION_MODELS[section];
  const [byUpdate, byCreate] = await Promise.all([
    model.findOne({ ...filter, updatedAt: { $exists: true } }).sort({ updatedAt: -1 }).select("updatedAt").lean<Row>(),
    model.findOne(filter).sort({ _id: -1 }).select("updatedAt createdAt postedDate resultDate").lean<Row>(),
  ]);
  return latest([byUpdate ? modified(byUpdate) : undefined, byCreate ? modified(byCreate) : undefined]);
}

async function quizLatest(match: Record<string, unknown> = {}): Promise<Date | undefined> {
  const row = await Quiz.findOne(match).sort({ updatedAt: -1 }).select("updatedAt createdAt").lean<Row>();
  return row ? modified(row) : undefined;
}

async function pagesEntries(): Promise<UrlEntry[]> {
  const sections = Object.keys(SECTION_MODELS) as Section[];
  const dates = await Promise.all(sections.map(sectionLatest));
  const bySection = Object.fromEntries(sections.map((s, i) => [s, dates[i]])) as Record<Section, Date | undefined>;
  const quizzes = await quizLatest();
  // Exam pages with nothing to show are noindex, so they must not be submitted either. Pages with a practice set,
  // syllabus and exam pattern (EXAM_PREP) always have their own content.
  const exams = (
    await Promise.all(EXAMS.map(async (e) => (getExamPrep(e.slug) || (await getExamContent(e)).hasContent ? e : null)))
  ).filter((e): e is (typeof EXAMS)[number] => e !== null);
  const legal = new Date(LEGAL_LAST_UPDATED);

  return [
    { loc: `${SITE_URL}/`, lastmod: latest([...dates, quizzes]) },
    ...sections.map((s) => ({ loc: `${SITE_URL}/${s}`, lastmod: bySection[s] })),
    { loc: `${SITE_URL}/quizzes`, lastmod: quizzes },
    { loc: `${SITE_URL}/test-series`, lastmod: quizzes },
    // Exam pages aggregate posts from every section; they change whenever a section does.
    ...exams.map((e) => ({ loc: `${SITE_URL}/${e.slug}`, lastmod: latest(dates) })),
    ...["/about", "/privacy-policy", "/disclaimer", "/terms", "/contact"].map((p) => ({ loc: `${SITE_URL}${p}`, lastmod: legal })),
  ];
}

async function testSeriesEntries(): Promise<UrlEntry[]> {
  const rows = (await Quiz.aggregate([
    {
      $group: {
        _id: { c: "$category", s: "$subcategory" },
        last: { $max: { $ifNull: ["$updatedAt", "$createdAt"] } },
        count: { $sum: 1 },
      },
    },
  ])) as { _id: { c?: string; s?: string }; last?: Date; count: number }[];

  const categories = new Map<string, Date | undefined>();
  const subCounts = new Map<string, number>();
  const singleExam = new Map<string, UrlEntry>();
  const groups = new Map<string, { name: string; slug: string; subcategories: { name: string; slug: string; count: number }[] }>();
  const subLastmod = new Map<string, Date | undefined>();
  for (const r of rows) {
    const c = r._id.c?.trim();
    if (!c) continue;
    const cSlug = slugify(c) || "all";
    categories.set(cSlug, latest([categories.get(cSlug), r.last]));
    const s = r._id.s?.trim();
    if (s) {
      const sSlug = slugify(s) || "all";
      subCounts.set(cSlug, (subCounts.get(cSlug) ?? 0) + 1);
      singleExam.set(cSlug, { loc: `${SITE_URL}/test-series/${cSlug}/${sSlug}`, lastmod: r.last });
      const group = groups.get(cSlug) ?? { name: c, slug: cSlug, subcategories: [] };
      group.subcategories.push({ name: s, slug: sSlug, count: r.count });
      groups.set(cSlug, group);
      subLastmod.set(`/test-series/${cSlug}/${sSlug}`, r.last);
    }
  }
  // Category pages are submitted, but not all ~500 per-exam pages: they share one template (a list of numbered
  // mock tests), and a large number of near-identical URLs may be one factor in Google leaving many of the site's
  // URLs as "Discovered - currently not indexed". Per-exam pages stay indexable and are linked from their category.
  // A single-exam category redirects to its exam page, so that exam page is listed instead.
  const entries = [...categories].map(([slug, last]) =>
    subCounts.get(slug) === 1 ? singleExam.get(slug)! : { loc: `${SITE_URL}/test-series/${slug}`, lastmod: last },
  );
  // Plus the per-exam pages of the main exams (EXAMS), when the quiz data still has tests there.
  for (const exam of EXAMS) {
    const ts = examTestSeries(exam, [...groups.values()]);
    if (ts) entries.push({ loc: `${SITE_URL}${ts.href}`, lastmod: subLastmod.get(ts.href) });
  }
  // Two Hindi-only names can both slug to "all"; keep one URL each.
  // Exclude noindex and permanently consolidated/redirected test-series paths.
  const seen = new Set<string>();
  return entries.filter((e) => {
    const path = e.loc.startsWith(SITE_URL) ? e.loc.slice(SITE_URL.length) : e.loc;
    if (isTestSeriesExcludedFromSitemap(path)) return false;
    return !seen.has(e.loc) && seen.add(e.loc);
  });
}

export async function getSitemapEntries(name: SitemapName): Promise<UrlEntry[]> {
  await connectToDatabase();
  if (name === "pages") return pagesEntries();
  if (name === "test-series") return testSeriesEntries();
  return sectionEntries(name);
}

function escapeXml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function urlsetXml(entries: UrlEntry[]): string {
  const body = entries
    .map((e) => `<url><loc>${escapeXml(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod.toISOString()}</lastmod>` : ""}</url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function sitemapIndexXml(items: { loc: string; lastmod?: Date }[]): string {
  const body = items
    .map((i) => `<sitemap><loc>${escapeXml(i.loc)}</loc>${i.lastmod ? `<lastmod>${i.lastmod.toISOString()}</lastmod>` : ""}</sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

export function newest(entries: UrlEntry[]): Date | undefined {
  return latest(entries.map((e) => e.lastmod));
}

export const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
};

/** lastmod for each child sitemap in the index, using cheap "newest document" queries. */
export async function sitemapIndexItems(): Promise<{ loc: string; lastmod?: Date }[]> {
  await connectToDatabase();
  const sections = Object.keys(SECTION_MODELS) as Section[];
  const [sectionDates, quizzes] = await Promise.all([Promise.all(sections.map(sectionLatest)), quizLatest()]);
  const dates: Record<string, Date | undefined> = Object.fromEntries(sections.map((s, i) => [s, sectionDates[i]]));
  dates["test-series"] = quizzes;
  dates.pages = latest([...sectionDates, quizzes]);
  return SITEMAP_NAMES.map((name) => ({ loc: `${SITE_URL}/sitemaps/${name}.xml`, lastmod: dates[name] }));
}
