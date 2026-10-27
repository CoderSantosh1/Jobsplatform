// Links from a job / result / admit card page to the matching exam's free test pages, so crawlers (and readers)
// reach the test series from every post. Pure functions; the data is passed in.
import { isHomeExamCategory } from "./home-categories.ts";

export type TestLink = { href: string; title: string };

type ExamLike = { slug: string; name: string; search: string; linkSearch?: string };
type GroupLike = { name: string; slug: string; subcategories: { name: string; slug: string; count: number }[] };

// Website names in titles ("at nbe.edu.in", "ssc.gov.in") are not exam names; drop them before matching.
const DOMAIN = /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:gov|nic|edu|ac|org|com|net|in)\b(?:\.[a-z]{2,})*/gi;

function tokens(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function titleWords(title: string): Set<string> {
  return new Set(tokens(title.replace(DOMAIN, " ")));
}

/** True when every word of `phrase` appears as a whole word in `title`. */
function containsAllWords(titleWords: Set<string>, phrase: string): boolean {
  const words = tokens(phrase);
  return words.length > 0 && words.every((w) => titleWords.has(w));
}

/**
 * Up to two links for a post title: the exam landing page (practice set, syllabus, pattern) and the most specific
 * mock-test page whose name appears in the title. Only government-exam categories are considered, and the longest
 * name wins (so "UP Police Sub Inspector" beats "UP Police"; ties go to the page with more tests).
 */
export function findTestLinks(title: string, exams: ExamLike[], groups: GroupLike[]): TestLink[] {
  const words = titleWords(title);
  const links: TestLink[] = [];

  const exam = exams
    .filter((e) => containsAllWords(words, e.linkSearch ?? e.search))
    .sort((a, b) => tokens(b.linkSearch ?? b.search).length - tokens(a.linkSearch ?? a.search).length)[0];
  if (exam) links.push({ href: `/${exam.slug}`, title: `${exam.name} Free Practice Set, Syllabus & Exam Pattern` });

  const best = groups
    .filter((g) => isHomeExamCategory(g.name))
    .flatMap((g) => g.subcategories.filter((s) => s.count > 0 && containsAllWords(words, s.name)).map((s) => ({ g, s })))
    .sort((a, b) => tokens(b.s.name).length - tokens(a.s.name).length || b.s.count - a.s.count)[0];
  if (best) {
    links.push({
      href: `/test-series/${best.g.slug}/${best.s.slug}`,
      title: `${best.s.name} Free Mock Test Series (${best.s.count} tests)`,
    });
  }
  return links;
}

export type ExamTestSeries = { href: string; name: string; count: number };

/**
 * The test-series page mapped to an exam (Exam.testSeries), or null when the exam has no mapping or the quiz data
 * no longer has tests there. Callers render a link / list a sitemap URL only for a non-null result.
 */
export function examTestSeries(
  exam: { testSeries?: { category: string; sub: string } },
  groups: GroupLike[],
): ExamTestSeries | null {
  if (!exam.testSeries) return null;
  const { category, sub } = exam.testSeries;
  const s = groups.find((g) => g.slug === category)?.subcategories.find((x) => x.slug === sub);
  if (!s || s.count <= 0) return null;
  return { href: `/test-series/${category}/${sub}`, name: s.name, count: s.count };
}
