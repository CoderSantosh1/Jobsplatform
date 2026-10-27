// AEO: question-and-answer blocks and FAQPage structured data built from existing page data.
import { test } from "node:test";
import assert from "node:assert/strict";
import { examFaqs, faqJsonLd } from "../../src/lib/faq.ts";
import { EXAM_PREP } from "../../src/lib/exam-prep.ts";
import { EXAMS } from "../../src/lib/exams.ts";

const exam = { name: "SSC GD Constable", about: "Recruits constables for CAPFs.", body: "Staff Selection Commission (SSC)" };

test("faqJsonLd builds a FAQPage and skips empty entries", () => {
  assert.equal(faqJsonLd([]), null);
  assert.equal(faqJsonLd([{ q: " ", a: "x" }]), null);
  assert.deepEqual(faqJsonLd([{ q: "Q1?", a: "A1." }, { q: "Q2?", a: "" }]), {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [{ "@type": "Question", name: "Q1?", acceptedAnswer: { "@type": "Answer", text: "A1." } }],
  });
});

test("examFaqs without pattern data or tests only states what the page knows", () => {
  const faqs = examFaqs(exam);
  assert.deepEqual(
    faqs.map((f) => f.q),
    ["What is the SSC GD Constable exam?", "Who conducts the SSC GD Constable exam?"],
  );
  assert.equal(faqs[0].a, exam.about);
  assert.match(faqs[1].a, /Staff Selection Commission \(SSC\)/);
});

test("examFaqs answers pattern, marking, syllabus and practice questions from the exam data", () => {
  const prep = EXAM_PREP["ssc-gd"];
  const faqs = examFaqs(exam, prep, { count: 20 });
  const byQ = Object.fromEntries(faqs.map((f) => [f.q, f.a]));
  const stage = prep.stages.find((s) => s.rows)!;
  const total = stage.rows!.reduce((n, r) => n + Number(r.questions), 0);
  assert.match(byQ["How many questions are there in the SSC GD Constable exam?"], new RegExp(`has ${total} questions`));
  assert.equal(byQ["Is there negative marking in the SSC GD Constable exam?"], prep.markingNote);
  assert.match(byQ["What is the SSC GD Constable syllabus?"], new RegExp(prep.syllabus[0].section.replace(/[()&]/g, ".")));
  assert.match(byQ["Where can I practise SSC GD Constable mock tests for free?"], /20 free SSC GD Constable mock tests/);
  assert.equal(new Set(faqs.map((f) => f.q)).size, faqs.length);
});

test("every exam page gets valid FAQ markup", () => {
  for (const e of EXAMS) {
    const data = faqJsonLd(examFaqs(e, EXAM_PREP[e.slug], { count: 5 })) as { mainEntity: unknown[] } | null;
    assert.ok(data && data.mainEntity.length >= 3, `${e.slug} has too few FAQs`);
  }
});
