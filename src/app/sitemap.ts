import type { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/db";
import Job from "@/lib/models/Job";
import Result from "@/lib/models/Result";
import AdmitCard from "@/lib/models/AdmitCard";
import AnswerKey from "@/lib/models/AnswerKey";
import Admission from "@/lib/models/Admission";
import News from "@/lib/models/News";
import Quiz from "@/lib/models/Quiz";
import { SITE_URL } from "@/lib/seo";
import { detailPath, type Section } from "@/lib/slug";
import { EXAMS } from "@/lib/exams";
import { getCategoryGroups } from "@/lib/quizzes";

// Rebuild the sitemap at most once an hour so new posts reach Google quickly.
export const revalidate = 3600;

type Doc = { _id: unknown; title?: string; updatedAt?: Date; createdAt?: Date; postedDate?: Date; resultDate?: Date };

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: "daily" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/jobs", priority: 0.9, changeFrequency: "daily" },
  { path: "/results", priority: 0.9, changeFrequency: "daily" },
  { path: "/admit-cards", priority: 0.9, changeFrequency: "daily" },
  { path: "/answer-keys", priority: 0.8, changeFrequency: "daily" },
  { path: "/admissions", priority: 0.8, changeFrequency: "daily" },
  { path: "/news", priority: 0.7, changeFrequency: "daily" },
  { path: "/quizzes", priority: 0.8, changeFrequency: "daily" },
  { path: "/about", priority: 0.3, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.3, changeFrequency: "monthly" },
  { path: "/privacy-policy", priority: 0.2, changeFrequency: "monthly" },
  { path: "/disclaimer", priority: 0.2, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.2, changeFrequency: "monthly" },
];

function toEntries(
  docs: Doc[],
  section: Section | "quizzes",
  priority: number,
): MetadataRoute.Sitemap {
  return docs.map((doc) => ({
    url:
      section === "quizzes"
        ? `${SITE_URL}/quizzes/${String(doc._id)}/instructions`
        : `${SITE_URL}${detailPath(section, { _id: doc._id, title: doc.title })}`,
    lastModified: doc.updatedAt ?? doc.postedDate ?? doc.resultDate ?? doc.createdAt,
    changeFrequency: "weekly",
    priority,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  try {
    await connectToDatabase();
    const fields = "_id title updatedAt createdAt postedDate resultDate";
    const [jobs, results, admitCards, answerKeys, admissions, news, quizzes] = await Promise.all([
      // The public jobs list only shows published jobs, so only those are submitted.
      Job.find({ status: "published" }).select(fields).lean<Doc[]>(),
      Result.find().select(fields).lean<Doc[]>(),
      AdmitCard.find().select(fields).lean<Doc[]>(),
      AnswerKey.find({ status: { $ne: "draft" } }).select(fields).lean<Doc[]>(),
      Admission.find({ status: { $ne: "draft" } }).select(fields).lean<Doc[]>(),
      News.find({ status: { $ne: "draft" } }).select(fields).lean<Doc[]>(),
      Quiz.find().select(fields).lean<Doc[]>(),
    ]);
    const groups = await getCategoryGroups();
    const hubs: MetadataRoute.Sitemap = [
      ...EXAMS.map((e) => ({ url: `${SITE_URL}/${e.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
      ...groups.flatMap((g) => [
        { url: `${SITE_URL}/test-series/${g.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 },
        ...g.subcategories.map((s) => ({
          url: `${SITE_URL}/test-series/${g.slug}/${s.slug}`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
      ]),
    ];

    return [
      ...staticEntries,
      ...hubs,
      ...toEntries(jobs, "jobs", 0.8),
      ...toEntries(results, "results", 0.8),
      ...toEntries(admitCards, "admit-cards", 0.8),
      ...toEntries(answerKeys, "answer-keys", 0.7),
      ...toEntries(admissions, "admissions", 0.7),
      ...toEntries(news, "news", 0.6),
      ...toEntries(quizzes, "quizzes", 0.6),
    ];
  } catch (error) {
    console.error("sitemap: failed to load dynamic routes", error);
    return staticEntries;
  }
}
