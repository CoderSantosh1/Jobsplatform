// Exam-specific test-series page text (src/lib/test-series-content.ts): every number comes from the exam's own quizzes.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rangeText,
  seriesDescription,
  seriesFaqs,
  seriesIntro,
  seriesStats,
  seriesTitle,
  stageTotals,
} from "../../src/lib/test-series-content.ts";
import { getExamPrep } from "../../src/lib/exam-prep.ts";

const quizzes = [
  { questionCount: 20, timeLimit: 15, totalMarks: 20, createdAt: "2026-10-20T10:00:00.000Z" },
  { questionCount: 20, timeLimit: 15, totalMarks: 20, createdAt: "2026-10-27T10:00:00.000Z" },
  { questionCount: 50, timeLimit: 60, totalMarks: 50, createdAt: "2025-06-24T10:00:00.000Z" },
];

test("seriesStats counts tests and questions, finds ranges and the newest date", () => {
  const s = seriesStats(quizzes);
  assert.equal(s.tests, 3);
  assert.equal(s.totalQuestions, 90);
  assert.deepEqual(s.questions, { min: 20, max: 50 });
  assert.deepEqual(s.minutes, { min: 15, max: 60 });
  assert.equal(s.latest, "2026-10-27T10:00:00.000Z");
});

test("seriesStats handles no quizzes and missing fields", () => {
  const s = seriesStats([{ questionCount: 0 }]);
  assert.equal(s.totalQuestions, 0);
  assert.equal(rangeText(s.questions), "");
  assert.equal(s.latest, undefined);
});

test("rangeText shows one number or a range", () => {
  assert.equal(rangeText({ min: 20, max: 20 }), "20");
  assert.equal(rangeText({ min: 20, max: 50 }), "20–50");
});

test("title, description and intro use the exam's own numbers", () => {
  const s = seriesStats(quizzes);
  assert.equal(seriesTitle("Bihar STET", 1853), "Bihar STET Mock Test 2026 – 1,853 Free Online Tests");
  const d = seriesDescription("Bihar STET", "Teaching Exams", s);
  assert.match(d, /3 free Bihar STET mock tests/);
  assert.match(d, /90 questions in all, 20–50 questions per test, 15–60-minute timer/);
  assert.ok(d.length <= 160, `description is ${d.length} characters`);
  const long = seriesDescription("Bihar Police Prohibition Sub Inspector", "Engineering Recruitment Exams", s);
  assert.ok(long.length <= 160 || !long.includes("test series."), "the closing line is dropped rather than cut");
  const intro = seriesIntro("Bihar STET", s, "27 Oct 2026");
  assert.match(intro, /3 free Bihar STET mock tests with 90 practice questions/);
  assert.match(intro, /newest test was added on 27 Oct 2026/);
  assert.match(seriesIntro("X", seriesStats([quizzes[0]])), /1 free X mock test with/);
});

test("FAQs answer from the data and add exam-pattern and update questions only when there is data", () => {
  const s = seriesStats(quizzes);
  const basic = seriesFaqs({ name: "Delhi Forest Guard", stats: s });
  assert.equal(basic.length, 3);
  assert.match(basic[2].a, /20–50 questions to be finished in 15–60 minutes, for 20–50 marks/);

  const prep = getExamPrep("ssc-gd");
  assert.ok(prep);
  const full = seriesFaqs({ name: "SSC GD Constable", stats: s, prep, postTitles: ["SSC GD Result 2026", "SSC GD Admit Card"] });
  const pattern = full.find((f) => f.q.includes("exam pattern"));
  assert.ok(pattern);
  assert.match(pattern.a, /80 questions for 160 marks in 60 minutes, across 4 sections/);
  assert.match(full.at(-1)!.a, /SSC GD Result 2026; SSC GD Admit Card/);
});

test("stageTotals adds up numeric rows and gives up on text rows", () => {
  assert.deepEqual(stageTotals({ name: "CBT", rows: [{ section: "A", questions: 20, marks: 40 }, { section: "B", questions: 30, marks: 30 }] }), {
    questions: 50,
    marks: 70,
  });
  assert.equal(stageTotals({ name: "CBT", rows: [{ section: "A", questions: "varies", marks: 40 }] }), null);
  assert.equal(stageTotals({ name: "Interview" }), null);
});
