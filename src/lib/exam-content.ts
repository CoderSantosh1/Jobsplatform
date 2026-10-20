import { cache } from "react";
import { searchPosts, type RelatedLink } from "@/lib/content";
import { findQuizzes, type QuizSummary } from "@/lib/quizzes";
import type { Exam } from "@/lib/exams";
import type { Section } from "@/lib/slug";

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type ExamContent = {
  posts: Record<Section, RelatedLink[]>;
  quizzes: QuizSummary[];
  /** False when nothing on the site matches the exam; such a page is only boilerplate (a "soft 404"). */
  hasContent: boolean;
};

/** Posts and mock tests for an exam landing page. Shared by the page, its metadata and the sitemap. */
export const getExamContent = cache(async (exam: Exam): Promise<ExamContent> => {
  const pattern = exam.search.split(/\s+/).map(escapeRegex).join(".*");
  const [posts, quizzes] = await Promise.all([
    searchPosts(exam.search, 6),
    findQuizzes(
      { $or: [{ subcategory: { $regex: pattern, $options: "i" } }, { title: { $regex: pattern, $options: "i" } }] },
      8,
    ),
  ]);
  const postCount = Object.values(posts).reduce((n, list) => n + list.length, 0);
  return { posts, quizzes, hasContent: postCount > 0 || quizzes.length > 0 };
});
