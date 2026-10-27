// Question-and-answer blocks for answer engines (Google AI Overviews, featured snippets, ChatGPT, Perplexity).
// Every answer is built from data the page already shows; nothing here is written from scratch.
// Pure functions only, so unit tests can load this file directly.
import type { ExamPrep } from "./exam-prep.ts";

export type Faq = { q: string; a: string };

/** schema.org FAQPage for FAQs that are also shown on the page, or null when there are none. */
export function faqJsonLd(faqs: Faq[]): Record<string, unknown> | null {
  const items = faqs.filter((f) => f.q.trim() && f.a.trim());
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** FAQs for an exam landing page, from the exam description, its pattern/syllabus data and its test series. */
export function examFaqs(
  exam: { name: string; about: string; body: string },
  prep?: ExamPrep,
  testSeries?: { count: number } | null,
): Faq[] {
  const faqs: Faq[] = [
    { q: `What is the ${exam.name} exam?`, a: exam.about },
    { q: `Who conducts the ${exam.name} exam?`, a: `The ${exam.name} exam is conducted by the ${exam.body}.` },
  ];

  if (prep) {
    const stage = prep.stages.find(
      (s) => s.rows && s.rows.length > 0 && s.rows.every((r) => typeof r.questions === "number" && typeof r.marks === "number"),
    );
    if (stage?.rows) {
      const questions = stage.rows.reduce((n, r) => n + Number(r.questions), 0);
      const marks = stage.rows.reduce((n, r) => n + Number(r.marks), 0);
      faqs.push({
        q: `How many questions are there in the ${exam.name} exam?`,
        a:
          `The ${stage.name} has ${questions} questions for ${marks} marks` +
          (stage.duration ? ` in ${stage.duration}` : "") +
          `, from ${listJoin(stage.rows.map((r) => r.section))}.`,
      });
    }
    faqs.push({ q: `Is there negative marking in the ${exam.name} exam?`, a: prep.markingNote });
    if (prep.syllabus.length > 0) {
      faqs.push({
        q: `What is the ${exam.name} syllabus?`,
        a: `The ${exam.name} syllabus covers ${listJoin(prep.syllabus.map((s) => s.section))}. The full topic list is on this page.`,
      });
    }
  }

  if (testSeries && testSeries.count > 0) {
    faqs.push({
      q: `Where can I practise ${exam.name} mock tests for free?`,
      a:
        `Sarkari Results Now has ${testSeries.count} free ${exam.name} mock tests with a timer, score and answers` +
        (prep ? `, plus a free ${exam.name} practice set with explanations on this page.` : "."),
    });
  }
  return faqs;
}
