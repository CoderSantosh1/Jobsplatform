import type { Metadata } from "next";
import { cache } from "react";
import { connectToDatabase } from "@/lib/db";
import Quiz from "@/lib/models/Quiz";
import { getCanonicalCopy, getDetail, type Doc } from "@/lib/content";
import { detailPath, idFromParam, quizPath, type Section } from "@/lib/slug";
import { pageMetadata } from "@/lib/seo";
import { detailText } from "@/lib/detail-titles";

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
  if (section === "quizzes") {
    // Single quizzes are thin, near-identical pages: keep them out of the index; /test-series pages rank instead.
    return pageMetadata({ ...detailText(section, doc), path: quizPath(doc as { _id: string; title: string }), noIndex: true });
  }
  // A post entered twice points its canonical at the oldest copy, so Google sees one page, not two duplicates.
  const canonical = await getCanonicalCopy(section, doc as Doc);
  return pageMetadata({ ...detailText(section, doc), path: detailPath(section, canonical) });
}
