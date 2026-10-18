// Pure title/description builders for detail pages. No database imports, so unit tests can load it.
import { TITLE_MAX, clip, displayDate, formatDate, isBlank } from "./seo.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyDoc = Record<string, any>;

/** Append `suffix` to `title` only when it still leaves room for " | SRN" within the title limit. */
export function withSuffix(title: string, suffix: string, max = TITLE_MAX - 6): string {
  if (!suffix) return title;
  const lower = title.toLowerCase();
  if (suffix.toLowerCase().split(/\W+/).filter(Boolean).every((w) => lower.includes(w))) return title;
  return `${title}${suffix}`.length <= max ? `${title}${suffix}` : title;
}

export function detailText(section: string, doc: AnyDoc): { title: string; description: string } {
  const title = String(doc.title ?? "").replace(/\s+/g, " ").trim();
  const org = doc.organization ? `${doc.organization}: ` : "";

  switch (section) {
    case "jobs": {
      const vacancy = isBlank(doc.totalVacancy) ? "" : String(doc.totalVacancy).trim();
      const lastDate = displayDate(doc.lastDateApplyOnline) || formatDate(doc.applicationDeadline);
      const t = withSuffix(withSuffix(title, vacancy ? ` – ${vacancy} Posts` : ""), lastDate ? `, Last Date ${lastDate}` : "");
      const parts = [`${org}${title}`, vacancy && `${vacancy} posts`, lastDate && `last date ${lastDate}`].filter(Boolean);
      return {
        title: withSuffix(t, " – Apply Online"),
        description: `${parts.join(", ")}. Check eligibility, age limit, application fee, important dates and the official apply link.`,
      };
    }
    case "results":
      return {
        title: withSuffix(title, " – Direct Link"),
        description: `${org}${title}${doc.resultDate ? ` declared on ${formatDate(doc.resultDate)}` : ""}. Check how to download the result, the direct link and the next selection stage.`,
      };
    case "admit-cards":
      return {
        title: withSuffix(title, " – Download"),
        description: `${org}${title}. Download the admit card / hall ticket from the official link and check exam date, venue and instructions.`,
      };
    case "answer-keys":
      return {
        title: withSuffix(title, " – Download PDF"),
        description: `${org}${title}. Download the official answer key PDF, check your score and raise objections before the deadline.`,
      };
    case "admissions":
      return {
        title,
        description: `${org}${title}${doc.applicationDeadline ? `, last date ${formatDate(doc.applicationDeadline)}` : ""}. Check eligibility, application process and the official link.`,
      };
    case "news":
      return { title, description: `${org}${clip(doc.content, 200)}` };
    case "quizzes": {
      const facts = [doc.timeLimit && `${doc.timeLimit} minutes`, doc.totalMarks && `${doc.totalMarks} marks`].filter(Boolean);
      return {
        title: withSuffix(title, " – Free Mock Test"),
        description: `${clip(doc.description, 110)}${facts.length ? ` (${facts.join(", ")})` : ""}. Attempt this free online mock test with a timer and answers.`,
      };
    }
    default:
      return { title, description: doc.description ?? "" };
  }
}
