import type { Model } from "mongoose";
import { cache } from "react";
import { connectToDatabase } from "@/lib/db";
import Job from "@/lib/models/Job";
import Result from "@/lib/models/Result";
import AdmitCard from "@/lib/models/AdmitCard";
import AnswerKey from "@/lib/models/AnswerKey";
import Admission from "@/lib/models/Admission";
import News from "@/lib/models/News";
import { detailPath, idFromParam, type Section } from "@/lib/slug";
import { canonicalOf, titleKey, titleRegexSource } from "@/lib/dedupe";
import { titleWordRegexes } from "@/lib/search";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Doc = Record<string, any> & { _id: string; title: string };

const MODELS: Record<Section, Model<any>> = {
  jobs: Job,
  results: Result,
  "admit-cards": AdmitCard,
  "answer-keys": AnswerKey,
  admissions: Admission,
  news: News,
};

export const SECTION_LABEL: Record<Section, string> = {
  jobs: "Latest Jobs",
  results: "Results",
  "admit-cards": "Admit Cards",
  "answer-keys": "Answer Keys",
  admissions: "Admissions",
  news: "News",
};

function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/** Load one document by URL param (slug-id or bare id). Cached per request so metadata and page share it. */
export const getDetail = cache(async (section: Section, param: string): Promise<Doc | null> => {
  const id = idFromParam(param);
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  await connectToDatabase();
  const doc = await MODELS[section].findById(id).lean();
  if (!doc) return null;

  const plain = doc as any;
  // News images are stored inline in Mongo; expose them as a data URL.
  if (section === "news" && plain.image?.data && plain.image?.contentType) {
    const base64 = Buffer.from(plain.image.data.buffer ?? plain.image.data).toString("base64");
    plain.imageUrl = `data:${plain.image.contentType};base64,${base64}`;
  }
  delete plain.image;
  return toPlain(plain) as Doc;
});

/** Words from a title that identify the exam/organisation, e.g. "UP Police Constable Result 2026" → ["UP", "Police", "Constable"]. */
const STOP_WORDS = new Set(
  "result results admit card answer key recruitment online form apply notification exam download out released declared final merit list post posts vacancy new latest and for the of in to 2023 2024 2025 2026 2027".split(" "),
);

export function keyTerms(title: string, max = 3): string[] {
  return (title.match(/[A-Za-z0-9]+/g) ?? [])
    .filter((w) => !STOP_WORDS.has(w.toLowerCase()) && (w.length > 2 || /^[A-Z]{2,}$/.test(w)))
    .slice(0, max);
}

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type RelatedLink = { href: string; title: string; section: Section };

/**
 * Related posts from every section that share the exam name or organisation,
 * so a job page links to its admit card, answer key and result.
 */
export const getRelated = cache(async (section: Section, doc: Doc, limit = 8): Promise<RelatedLink[]> => {
  const terms = keyTerms(doc.title, 2);
  if (!terms.length && !doc.organization) return [];
  const pattern = terms.length ? terms.map(escapeRegex).join(".*") : escapeRegex(doc.organization);
  const query = { _id: { $ne: doc._id }, title: { $regex: pattern, $options: "i" } };

  try {
    await connectToDatabase();
    const found = await Promise.all(
      (Object.keys(MODELS) as Section[]).map(async (s) => {
        const rows = await MODELS[s]
          .find(query)
          .select("_id title")
          .sort({ createdAt: -1, postedDate: -1, resultDate: -1 })
          .limit(3)
          .lean<{ _id: unknown; title: string }[]>();
        return rows.map((r) => ({ href: detailPath(s, r), title: r.title, section: s }));
      }),
    );
    // Other sections first: they are the most useful next step for the reader.
    return [...found.filter((_, i) => Object.keys(MODELS)[i] !== section).flat(), ...found.flat().filter((r) => r.section === section)].slice(0, limit);
  } catch (error) {
    console.error("getRelated failed", error);
    return [];
  }
});

/** Documents each section shows publicly (same rules as the lists and the sitemap). */
export const PUBLIC_FILTER: Record<Section, Record<string, unknown>> = {
  jobs: { status: "published" },
  results: {},
  "admit-cards": {},
  "answer-keys": { status: { $ne: "draft" } },
  admissions: { status: { $ne: "draft" } },
  news: { status: { $ne: "draft" } },
};

/**
 * Same rule as PUBLIC_FILTER, for one loaded document: unpublished jobs and draft answer keys, admissions and
 * news are not public. Results and admit cards are always listed (their filter is empty), so they always are.
 */
export function isPublicDoc(section: Section, doc: { status?: unknown }): boolean {
  if (section === "jobs") return doc.status === "published";
  if (section === "results" || section === "admit-cards") return true;
  return doc.status !== "draft";
}

/**
 * When the same post was entered more than once, the oldest public copy is canonical.
 * Returns that copy (possibly `doc` itself), so later copies can point their canonical tag at it.
 */
export const getCanonicalCopy = cache(async (section: Section, doc: Doc): Promise<{ _id: string; title: string }> => {
  const key = titleKey(doc.title);
  if (!key) return doc;
  try {
    await connectToDatabase();
    const rows = await MODELS[section]
      .find({ ...PUBLIC_FILTER[section], title: { $regex: titleRegexSource(key), $options: "i" } })
      .select("_id title")
      .sort({ _id: 1 })
      .limit(20)
      .lean<{ _id: unknown; title: string }[]>();
    const copies = rows.filter((r) => titleKey(r.title) === key).map((r) => ({ _id: String(r._id), title: r.title }));
    return canonicalOf([...copies, { _id: String(doc._id), title: doc.title }]) ?? doc;
  } catch (error) {
    console.error("getCanonicalCopy failed", error);
    return doc;
  }
});

/** Latest posts of one section, for "more" links on a detail page. */
export const getLatest = cache(async (section: Section, excludeId: string, limit = 6): Promise<RelatedLink[]> => {
  try {
    await connectToDatabase();
    const filter: Record<string, unknown> = { _id: { $ne: excludeId } };
    if (section === "jobs") filter.status = "published";
    const rows = await MODELS[section]
      .find(filter)
      .select("_id title")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<{ _id: unknown; title: string }[]>();
    return rows.map((r) => ({ href: detailPath(section, r), title: r.title, section }));
  } catch (error) {
    console.error("getLatest failed", error);
    return [];
  }
});

/** Posts in any section whose title matches every word of `term`, newest first. Used by exam and test-series pages. */
export const searchPosts = cache(async (term: string, perSection = 5): Promise<Record<Section, RelatedLink[]>> => {
  const regexes = titleWordRegexes(term);
  const empty = Object.fromEntries((Object.keys(MODELS) as Section[]).map((s) => [s, []])) as unknown as Record<Section, RelatedLink[]>;
  if (!regexes.length) return empty;
  const query = { $and: regexes.map((source) => ({ title: { $regex: source, $options: "i" } })) };
  try {
    await connectToDatabase();
    const entries = await Promise.all(
      (Object.keys(MODELS) as Section[]).map(async (s) => {
        const rows = await MODELS[s]
          .find(query)
          .select("_id title")
          .sort({ createdAt: -1 })
          .limit(perSection)
          .lean<{ _id: unknown; title: string }[]>();
        return [s, rows.map((r) => ({ href: detailPath(s, r), title: r.title, section: s }))] as const;
      }),
    );
    return Object.fromEntries(entries) as Record<Section, RelatedLink[]>;
  } catch (error) {
    console.error("searchPosts failed", error);
    return empty;
  }
});
