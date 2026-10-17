import type { Metadata } from "next";
import { cache } from "react";
import { connectToDatabase } from "@/lib/db";
import Quiz from "@/lib/models/Quiz";
import { getDetail } from "@/lib/content";
import { detailPath, idFromParam, type Section } from "@/lib/slug";
import { clip, formatDate, pageMetadata } from "@/lib/seo";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyDoc = Record<string, any>;

export type DetailSection = Section | "quizzes";

/** Load one quiz (without questions) for metadata and structured data. */
export const getQuizMeta = cache(async (id: string): Promise<AnyDoc | null> => {
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  try {
    await connectToDatabase();
    const quiz = (await Quiz.findById(id).select("-attempts").lean()) as AnyDoc | null;
    if (!quiz) return null;
    return JSON.parse(JSON.stringify({ ...quiz, questionCount: quiz.questions?.length ?? 0, questions: undefined }));
  } catch (error) {
    console.error(`metadata: failed to load quiz ${id}`, error);
    return null;
  }
});

/** Load one document for metadata; returns null for bad ids or DB errors. */
async function loadDoc(section: DetailSection, param: string): Promise<AnyDoc | null> {
  if (section === "quizzes") return getQuizMeta(idFromParam(param));
  try {
    return await getDetail(section, param);
  } catch (error) {
    console.error(`metadata: failed to load ${section}/${param}`, error);
    return null;
  }
}

/** Append `suffix` to `title` only when the result still fits in `max` characters. */
function withSuffix(title: string, suffix: string, max = 60): string {
  const lower = title.toLowerCase();
  if (suffix.toLowerCase().split(/\W+/).filter(Boolean).every((w) => lower.includes(w))) return title;
  return `${title}${suffix}`.length <= max ? `${title}${suffix}` : title;
}

function build(section: string, doc: AnyDoc): { title: string; description: string } {
  const title = clip(doc.title, 70);
  const org = doc.organization ? `${doc.organization}: ` : "";

  switch (section) {
    case "jobs": {
      const posts = doc.totalVacancy ? ` – ${doc.totalVacancy} Posts` : "";
      const lastDate = doc.lastDateApplyOnline || formatDate(doc.applicationDeadline);
      const t = withSuffix(withSuffix(title, posts), lastDate ? `, Last Date ${lastDate}` : "");
      const parts = [
        `${org}${doc.title}`,
        doc.totalVacancy && `${doc.totalVacancy} posts`,
        lastDate && `last date ${lastDate}`,
      ].filter(Boolean);
      return {
        title: withSuffix(t, " – Apply Online"),
        description: `${parts.join(", ")}. Check eligibility, age limit, application fee, important dates and the official apply link.`,
      };
    }
    case "results":
      return {
        title: withSuffix(title, " – Direct Link"),
        description: `${org}${doc.title}${doc.resultDate ? ` declared on ${formatDate(doc.resultDate)}` : ""}. Check how to download the result, the direct link and the next selection stage.`,
      };
    case "admit-cards":
      return {
        title: withSuffix(title, " – Download"),
        description: `${org}${doc.title}. Download the admit card / hall ticket from the official link and check exam date, venue and instructions.`,
      };
    case "answer-keys":
      return {
        title: withSuffix(title, " – Download PDF"),
        description: `${org}${doc.title}. Download the official answer key PDF, check your score and raise objections before the deadline.`,
      };
    case "admissions":
      return {
        title,
        description: `${org}${doc.title}${doc.applicationDeadline ? `, last date ${formatDate(doc.applicationDeadline)}` : ""}. Check eligibility, application process and the official link.`,
      };
    case "news":
      return { title, description: `${org}${clip(doc.content, 200)}` };
    case "quizzes": {
      const facts = [
        doc.timeLimit && `${doc.timeLimit} minutes`,
        doc.totalMarks && `${doc.totalMarks} marks`,
      ].filter(Boolean);
      return {
        title: withSuffix(title, " – Free Mock Test"),
        description: `${clip(doc.description, 110)}${facts.length ? ` (${facts.join(", ")})` : ""}. Attempt this free online mock test in Hindi and English.`,
      };
    }
    default:
      return { title, description: doc.description ?? "" };
  }
}

const FALLBACK: Record<string, string> = {
  jobs: "Government Job Details",
  results: "Sarkari Result Details",
  "admit-cards": "Admit Card Details",
  "answer-keys": "Answer Key Details",
  admissions: "Admission Details",
  news: "Exam News",
  quizzes: "Free Mock Test",
};

/** Unique title, description and canonical URL for a detail page such as /jobs/[id]. */
export async function detailMetadata(section: DetailSection, param: string): Promise<Metadata> {
  const doc = await loadDoc(section, param);
  if (!doc) {
    return pageMetadata({ title: FALLBACK[section], description: FALLBACK[section], path: `/${section}/${param}`, noIndex: true });
  }
  const path = section === "quizzes" ? `/quizzes/${doc._id}/instructions` : detailPath(section, doc as { _id: string; title: string });
  return pageMetadata({ ...build(section, doc), path });
}
