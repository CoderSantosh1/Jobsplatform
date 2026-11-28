import type { Metadata } from "next";
import { cache } from "react";
import { connectToDatabase } from "@/lib/db";
import { logMongoError } from "@/lib/mongo-error";
import Quiz from "@/lib/models/Quiz";
import { getCanonicalCopy, getDetail, isPublicDoc, type Doc } from "@/lib/content";
import { detailPath, idFromParam, quizPath, type Section } from "@/lib/slug";
import { pageMetadata } from "@/lib/seo";
import { detailText } from "@/lib/detail-titles";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyDoc = Record<string, any>;

export type DetailSection = Section | "quizzes";

/** Load one quiz (without questions) for metadata and structured data. */
export const getQuizMeta = cache(async (id: string): Promise<AnyDoc | null> => {
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  let stage: "connect" | "query" | "serialize" = "connect";
  try {
    await connectToDatabase();
    stage = "query";
    const quiz = (await Quiz.findById(id).select("-attempts").lean()) as AnyDoc | null;
    if (!quiz) {
      console.info(JSON.stringify({ event: "quiz_metadata_not_found", quizId: id, stage }));
      return null;
    }
    stage = "serialize";
    return JSON.parse(JSON.stringify({ ...quiz, questionCount: quiz.questions?.length ?? 0, questions: undefined }));
  } catch (error) {
    logMongoError("metadata: failed to load quiz", error, { quizId: id, stage });
    return null;
  }
});

/**
 * Whether a quiz exists: false only when the id is malformed or the database confirms there is no such quiz,
 * null when the database could not be reached (callers must not treat that as "missing").
 */
export const quizExists = cache(async (id: string): Promise<boolean | null> => {
  if (!/^[a-f0-9]{24}$/i.test(id)) return false;
  let stage: "connect" | "query" = "connect";
  try {
    await connectToDatabase();
    stage = "query";
    return (await Quiz.exists({ _id: id })) !== null;
  } catch (error) {
    logMongoError("quiz_exists_check_failed", error, { quizId: id, stage });
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
  // Drafts stay viewable by link (e.g. to preview them) but are kept out of search results.
  if (!isPublicDoc(section, doc)) {
    return pageMetadata({ ...detailText(section, doc), path: detailPath(section, doc as Doc), noIndex: true });
  }
  // A post entered twice points its canonical at the oldest copy, so Google sees one page, not two duplicates.
  const canonical = await getCanonicalCopy(section, doc as Doc);
  return pageMetadata({ ...detailText(section, doc), path: detailPath(section, canonical) });
}
