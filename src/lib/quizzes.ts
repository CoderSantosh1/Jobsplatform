import { cache } from "react";
import { connectToDatabase } from "@/lib/db";
import Quiz from "@/lib/models/Quiz";
import Question from "@/lib/models/Question";
import QuizCategory from "@/lib/models/QuizCategory";
import { slugify } from "@/lib/slug";

export type QuizSummary = {
  _id: string;
  title: string;
  description: string;
  timeLimit: number;
  totalMarks: number;
  category: string;
  subcategory: string;
  questionCount: number;
  createdAt?: string;
};

export type CategoryGroup = {
  name: string;
  slug: string;
  icon?: string;
  count: number;
  subcategories: { name: string; slug: string; count: number }[];
};

const SUMMARY_PROJECTION = {
  title: 1,
  description: 1,
  timeLimit: 1,
  totalMarks: 1,
  category: 1,
  subcategory: 1,
  createdAt: 1,
  questionCount: { $size: { $ifNull: ["$questions", []] } },
};

function plain<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

/** Quizzes without their question arrays (the list page used to ship all 1,900 quizzes with questions). */
export async function findQuizzes(match: Record<string, unknown>, limit?: number): Promise<QuizSummary[]> {
  await connectToDatabase();
  const pipeline: Record<string, unknown>[] = [{ $match: match }, { $sort: { createdAt: -1 } }];
  if (limit) pipeline.push({ $limit: limit });
  pipeline.push({ $project: SUMMARY_PROJECTION });
  return plain(await Quiz.aggregate(pipeline as never));
}

/** Every category and subcategory that has quizzes, with counts and URL slugs. */
export const getCategoryGroups = cache(async (): Promise<CategoryGroup[]> => {
  await connectToDatabase();
  const [counts, categories] = await Promise.all([
    Quiz.aggregate([{ $group: { _id: { c: "$category", s: "$subcategory" }, n: { $sum: 1 } } }]),
    QuizCategory.find().select("name icon").lean<{ name: string; icon?: string }[]>(),
  ]);
  const icons = new Map(categories.map((c) => [c.name, c.icon]));
  const groups = new Map<string, CategoryGroup>();
  for (const row of counts as { _id: { c?: string; s?: string }; n: number }[]) {
    const name = row._id.c?.trim();
    if (!name) continue;
    const group =
      groups.get(name) ??
      { name, slug: slugify(name) || "all", icon: icons.get(name), count: 0, subcategories: [] };
    group.count += row.n;
    const sub = row._id.s?.trim();
    if (sub) group.subcategories.push({ name: sub, slug: slugify(sub) || "all", count: row.n });
    groups.set(name, group);
  }
  const list = [...groups.values()];
  list.forEach((g) => g.subcategories.sort((a, b) => b.count - a.count));
  return list.sort((a, b) => b.count - a.count);
});

export async function findCategory(categorySlug: string, subSlug?: string) {
  const groups = await getCategoryGroups();
  const category = groups.find((g) => g.slug === categorySlug);
  if (!category) return null;
  const sub = subSlug ? category.subcategories.find((s) => s.slug === subSlug) : undefined;
  if (subSlug && !sub) return null;
  return { category, sub };
}

/** A few questions from one quiz, shown as text so the page has real, indexable content. */
export async function sampleQuestions(quizId: string, count = 3) {
  await connectToDatabase();
  const rows = await Question.find({ quizId })
    .select("text options")
    .limit(count)
    .lean<{ _id: unknown; text: string; options?: string[] }[]>();
  return plain(rows) as { _id: string; text: string; options?: string[] }[];
}

/** Link for a category: single-exam categories go straight to that exam (the category URL redirects there). */
export function categoryHref(group: CategoryGroup): string {
  return group.subcategories.length === 1
    ? `/test-series/${group.slug}/${group.subcategories[0].slug}`
    : `/test-series/${group.slug}`;
}
