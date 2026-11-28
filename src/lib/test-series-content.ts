// Exam-specific text for a test-series page (/test-series/<category>/<exam>), built only from that exam's own data:
// its quizzes (count, questions, timer, marks, dates), its exam-pattern data when we have it, and its related posts.
// Nothing here is generic filler, so each page says something different. Pure functions; tests load this directly.
import type { ExamPrep } from "./exam-prep.ts";
import type { Faq } from "./faq.ts";

type QuizLike = { questionCount: number; timeLimit?: number; totalMarks?: number; createdAt?: string };

export type SeriesStats = {
  tests: number;
  totalQuestions: number;
  questions: { min: number; max: number };
  minutes: { min: number; max: number };
  marks: { min: number; max: number };
  /** ISO date of the newest test, if known. */
  latest?: string;
};

function range(values: number[]): { min: number; max: number } {
  const good = values.filter((v) => Number.isFinite(v) && v > 0);
  return good.length ? { min: Math.min(...good), max: Math.max(...good) } : { min: 0, max: 0 };
}

export function seriesStats(quizzes: QuizLike[]): SeriesStats {
  const dates = quizzes.map((q) => q.createdAt).filter((d): d is string => !!d && !Number.isNaN(Date.parse(d)));
  return {
    tests: quizzes.length,
    totalQuestions: quizzes.reduce((n, q) => n + (q.questionCount || 0), 0),
    questions: range(quizzes.map((q) => q.questionCount)),
    minutes: range(quizzes.map((q) => q.timeLimit ?? 0)),
    marks: range(quizzes.map((q) => q.totalMarks ?? 0)),
    latest: dates.sort().at(-1),
  };
}

/** "20" or "20–50". Empty when unknown. */
export function rangeText(r: { min: number; max: number }): string {
  if (!r.max) return "";
  return r.min === r.max ? String(r.max) : `${r.min}–${r.max}`;
}

const nf = new Intl.NumberFormat("en-IN");
export const num = (n: number) => nf.format(n);

/** Page title: matches how people search ("<exam> mock test free") and states the real number of tests. */
export function seriesTitle(name: string, tests: number): string {
  return `${name} Mock Test 2026 – ${num(tests)} Free Online Tests`;
}

/** Meta description from the page's own numbers. */
export function seriesDescription(name: string, category: string, s: SeriesStats): string {
  const per = rangeText(s.questions);
  const mins = rangeText(s.minutes);
  const detail = [
    s.totalQuestions ? `${num(s.totalQuestions)} questions in all` : "",
    per ? `${per} questions per test` : "",
    mins ? `${mins}-minute timer` : "",
  ].filter(Boolean);
  const head = `Attempt ${num(s.tests)} free ${name} mock tests online${detail.length ? ` (${detail.join(", ")})` : ""}.`;
  // Meta descriptions are cut at 160 characters; add the closing line only when it fits whole.
  const tail = ` With score and answers. ${category} test series.`;
  return head.length + tail.length <= 160 ? head + tail : head;
}

/** First paragraph of the page. `latestLabel` is the newest test's date, already formatted for display. */
export function seriesIntro(name: string, s: SeriesStats, latestLabel?: string): string {
  const per = rangeText(s.questions);
  const mins = rangeText(s.minutes);
  const parts = [
    `Sarkari Results Now has ${num(s.tests)} free ${name} mock ${s.tests === 1 ? "test" : "tests"}${
      s.totalQuestions ? ` with ${num(s.totalQuestions)} practice questions in total` : ""
    }.`,
  ];
  if (per || mins) {
    parts.push(
      `Each test has ${per ? `${per} questions` : "a set of questions"}${mins ? ` and a ${mins}-minute timer` : ""}, and shows your score and the correct answers when you finish.`,
    );
  }
  if (latestLabel) parts.push(`The newest test was added on ${latestLabel}.`);
  parts.push(`Take them in order and review every wrong answer to find your weak topics before the real ${name} exam.`);
  return parts.join(" ");
}

/** Total questions, marks and time of an exam stage that has a pattern table. */
export function stageTotals(stage: ExamPrep["stages"][number]): { questions: number; marks: number } | null {
  if (!stage.rows?.length) return null;
  const sum = (key: "questions" | "marks") =>
    stage.rows!.reduce((n, r) => n + (typeof r[key] === "number" ? (r[key] as number) : Number.NaN), 0);
  const questions = sum("questions");
  const marks = sum("marks");
  return Number.isFinite(questions) && Number.isFinite(marks) ? { questions, marks } : null;
}

/**
 * FAQs for the page, each answered from data shown on it. `prep` is the exam's pattern data when we have it,
 * and `postTitles` the latest related job / admit card / result titles.
 */
export function seriesFaqs(opts: {
  name: string;
  stats: SeriesStats;
  latestLabel?: string;
  prep?: ExamPrep;
  postTitles?: string[];
}): Faq[] {
  const { name, stats: s, latestLabel, prep, postTitles = [] } = opts;
  const per = rangeText(s.questions);
  const mins = rangeText(s.minutes);
  const marks = rangeText(s.marks);
  const faqs: Faq[] = [
    {
      q: `Are these ${name} mock tests free?`,
      a: `Yes. All ${num(s.tests)} ${name} mock tests on this page are free to attempt online.`,
    },
    {
      q: `How many ${name} mock tests are available?`,
      a: `There are ${num(s.tests)} ${name} mock tests${s.totalQuestions ? ` with ${num(s.totalQuestions)} questions in total` : ""}.${
        latestLabel ? ` The newest one was added on ${latestLabel}.` : ""
      }`,
    },
  ];
  if (per || mins) {
    faqs.push({
      q: `How many questions are there in each ${name} mock test?`,
      a: `Each test has ${per ? `${per} questions` : "a fixed set of questions"}${mins ? ` to be finished in ${mins} minutes` : ""}${
        marks ? `, for ${marks} marks` : ""
      }. Your score and the correct answers are shown at the end.`,
    });
  }
  const stage = prep?.stages.find((st) => st.rows?.length);
  const totals = stage ? stageTotals(stage) : null;
  if (stage && totals) {
    faqs.push({
      q: `What is the ${name} exam pattern?`,
      a: `The ${stage.name} has ${totals.questions} questions for ${totals.marks} marks${stage.duration ? ` in ${stage.duration}` : ""}, across ${
        stage.rows!.length
      } sections: ${stage.rows!.map((r) => r.section).join(", ")}. ${prep!.markingNote} Confirm the pattern in the latest official notification.`,
    });
  }
  if (postTitles.length) {
    faqs.push({
      q: `Where can I find the latest ${name} notification, admit card and result?`,
      a: `The latest ${name} updates are listed on this page, for example: ${postTitles.slice(0, 3).join("; ")}.`,
    });
  }
  return faqs;
}
