// Shared by server and client code: builds readable URLs like /jobs/uco-bank-apprentice-2026-6ad059ee984e13945230c1c2.

export type Section = "jobs" | "results" | "admit-cards" | "answer-keys" | "admissions" | "news";

/** Lowercase ASCII slug; Hindi or other non-Latin characters are dropped. */
export function slugify(text: string | undefined | null, maxLength = 80): string {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

/** The URL segment for a document: "<slug>-<id>", or just "<id>" when the title has no Latin characters. */
export function detailSegment(doc: { _id: unknown; title?: string }): string {
  const id = String(doc._id);
  const slug = slugify(doc.title);
  return slug ? `${slug}-${id}` : id;
}

export function detailPath(section: Section, doc: { _id: unknown; title?: string }): string {
  return `/${section}/${detailSegment(doc)}`;
}

/** Pull the 24-character Mongo id off the end of a URL segment; returns the input unchanged if none. */
export function idFromParam(param: string): string {
  const match = decodeURIComponent(param).match(/([a-f0-9]{24})$/i);
  return match ? match[1] : param;
}

/** Indexable test-series page for a quiz category or subcategory, e.g. /test-series/ssc/ssc-gd. */
export function testSeriesPath(category: string, subcategory?: string): string {
  const base = `/test-series/${slugify(category) || "all"}`;
  return subcategory ? `${base}/${slugify(subcategory) || "all"}` : base;
}

/** Instructions page of a quiz, e.g. /quizzes/ssc-gd-mock-test-01-<id>/instructions. */
export function quizPath(quiz: { _id: unknown; title?: string }): string {
  return `/quizzes/${detailSegment(quiz)}/instructions`;
}
