// Exam landing pages: practice sets, syllabus and exam pattern data, and the practice-set scorer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { EXAM_PREP, scorePractice } from "../../src/lib/exam-prep.ts";
import { EXAMS } from "../../src/lib/exams.ts";

const REQUIRED = ["ssc-gd", "ssc-cgl", "bihar-police-constable", "bihar-stet", "rrb-ntpc", "rrb-group-d"];

test("every requested exam has a practice set, syllabus and pattern, and an exam page", () => {
  const slugs = new Set(EXAMS.map((e) => e.slug));
  for (const slug of REQUIRED) {
    const prep = EXAM_PREP[slug];
    assert.ok(prep, `${slug} has prep data`);
    assert.ok(slugs.has(slug), `${slug} has an exam page`);
    assert.ok(prep.practice.length >= 10, `${slug} has at least 10 questions`);
    assert.ok(prep.syllabus.length > 0 && prep.syllabus.every((s) => s.topics.length > 0), `${slug} syllabus`);
    assert.ok(prep.stages.length > 0, `${slug} pattern`);
  }
  for (const slug of Object.keys(EXAM_PREP)) assert.ok(slugs.has(slug), `${slug} prep belongs to an exam page`);
});

test("every practice question is well-formed", () => {
  for (const [slug, prep] of Object.entries(EXAM_PREP)) {
    prep.practice.forEach((q, i) => {
      const where = `${slug} Q${i + 1}`;
      assert.equal(q.options.length, 4, `${where} has 4 options`);
      assert.equal(new Set(q.options).size, 4, `${where} options are distinct`);
      assert.ok(q.answer >= 0 && q.answer <= 3, `${where} answer index`);
      assert.ok(q.q.trim().length > 5 && q.explanation.trim().length > 10, `${where} text and explanation`);
      assert.ok(q.section.trim(), `${where} section`);
    });
  }
});

test("no practice question is reused across exams (each page has original content)", () => {
  const seen = new Map<string, string>();
  for (const [slug, prep] of Object.entries(EXAM_PREP)) {
    for (const q of prep.practice) {
      const key = q.q.toLowerCase().replace(/\s+/g, " ").trim();
      assert.ok(!seen.has(key), `"${q.q}" appears in both ${seen.get(key)} and ${slug}`);
      seen.set(key, slug);
    }
  }
});

test("exam pattern totals match the official structure", () => {
  const totals = (slug: string, stage = 0) => {
    const rows = EXAM_PREP[slug].stages[stage].rows ?? [];
    return [rows.reduce((n, r) => n + Number(r.questions), 0), rows.reduce((n, r) => n + Number(r.marks), 0)];
  };
  assert.deepEqual(totals("ssc-gd"), [80, 160]);
  assert.deepEqual(totals("ssc-cgl"), [100, 200]);
  assert.deepEqual(totals("rrb-ntpc", 0), [100, 100]);
  assert.deepEqual(totals("rrb-ntpc", 1), [120, 120]);
  assert.deepEqual(totals("rrb-group-d"), [100, 100]);
  assert.deepEqual(totals("bihar-stet"), [150, 150]);
  assert.deepEqual(totals("bihar-police-constable"), [100, 100]);
});

test("scorePractice applies the exam's marking scheme", () => {
  const gd = EXAM_PREP["ssc-gd"];
  const allRight = gd.practice.map((q) => q.answer);
  assert.deepEqual(scorePractice(gd, allRight), { correct: 10, wrong: 0, skipped: 0, score: 20, maxScore: 20 });

  // 6 right, 2 wrong, 2 skipped on SSC GD: 6×2 − 2×0.25 = 11.5
  const mixed = gd.practice.map((q, i) => (i < 6 ? q.answer : i < 8 ? (q.answer + 1) % 4 : null));
  assert.deepEqual(scorePractice(gd, mixed), { correct: 6, wrong: 2, skipped: 2, score: 11.5, maxScore: 20 });

  // RRB: 3 wrong, rest skipped = −1
  const ntpc = EXAM_PREP["rrb-ntpc"];
  const threeWrong = ntpc.practice.map((q, i) => (i < 3 ? (q.answer + 1) % 4 : null));
  assert.equal(scorePractice(ntpc, threeWrong).score, -1);

  // No negative marking for Bihar STET
  const stet = EXAM_PREP["bihar-stet"];
  assert.equal(scorePractice(stet, stet.practice.map((q) => (q.answer + 1) % 4)).score, 0);
});

test("homepage Popular Exams shows only government-exam categories, in a fixed order", async () => {
  const { pickHomeCategories } = await import("../../src/lib/home-categories.ts");
  const cats = [
    { name: "Marketing", subcategories: [{ name: "Digital Marketing" }] },
    { name: "Banking Exams", subcategories: [{ name: "IBPS PO" }] },
    { name: "Software Development", subcategories: [{ name: "Python Programming" }] },
    { name: "SSC Exams", subcategories: [{ name: "SSC CGL" }] },
    { name: "Campus Placement", subcategories: [{ name: "TCS NQT" }] },
    { name: "Railways  exams", subcategories: [{ name: "RRB NTPC" }] },
    { name: "Police", subcategories: [] },
  ];
  assert.deepEqual(pickHomeCategories(cats).map((c) => c.name), ["SSC Exams", "Railways  exams", "Banking Exams"]);
});
