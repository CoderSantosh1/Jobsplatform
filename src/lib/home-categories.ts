// Which quiz categories the homepage "Popular Exams" block shows, and in what order. The homepage is for a sarkari
// exam audience, so only government-exam categories appear here; every other category still has its own
// /test-series page.

export const HOME_EXAM_CATEGORIES = [
  "SSC Exams",
  "Railways Exams",
  "Banking Exams",
  "Police",
  "Teaching Exams",
  "Defence Exams",
  "State Govt. Exams",
  "Civil Services Exam",
  "NRA CET",
  "Insurance Exams",
  "Nursing Exams",
  "Engineering Recruitment Exams",
  "Judiciary Exams",
  "Regulatory Body Exams",
  "Other Govt. Exams",
];

const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "");
const HOME_KEYS = new Set(HOME_EXAM_CATEGORIES.map(normalize));

export function isHomeExamCategory(name: string): boolean {
  return HOME_KEYS.has(normalize(name));
}

/** Keeps the government-exam categories (in HOME_EXAM_CATEGORIES order) that have at least one exam. */
export function pickHomeCategories<T extends { name: string; subcategories?: unknown[] }>(categories: T[]): T[] {
  const byName = new Map(categories.map((c) => [normalize(c.name), c]));
  return HOME_EXAM_CATEGORIES.map((name) => byName.get(normalize(name))).filter(
    (c): c is T => !!c && (c.subcategories?.length ?? 0) > 0,
  );
}
