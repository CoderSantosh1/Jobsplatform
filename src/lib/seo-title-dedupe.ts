// Pure helper to propose distinct SEO titles for posts flagged with `same-search-title`
// (where different post titles truncate to the same 60-char <title>).
import { detailText } from "./detail-titles.ts";
import { TITLE_MAX, fitTitle } from "./seo.ts";

export type TitleDedupeCandidate = {
  id: string;
  section: string;
  title: string;
  metaTitle: string;
  url: string;
  organization?: string;
  totalVacancy?: string;
  lastDateApplyOnline?: string;
  applicationDeadline?: string;
  resultDate?: string;
};

export type TitleDedupeProposal = {
  id: string;
  section: string;
  url: string;
  oldTitle: string;
  oldMetaTitle: string;
  proposedTitle: string;
  proposedMetaTitle: string;
};

function shortDifferentiator(doc: TitleDedupeCandidate, index: number): string {
  const vacancy = doc.totalVacancy && !["", "n/a", "na", "0", "-"].includes(doc.totalVacancy.trim().toLowerCase())
    ? `${doc.totalVacancy.trim()} Posts`
    : "";
  const org = doc.organization?.trim() || "";
  if (vacancy && !doc.title.toLowerCase().includes(vacancy.toLowerCase())) return vacancy;
  if (org && org.length <= 18 && !doc.title.toLowerCase().includes(org.toLowerCase())) return org;
  const suffixBySection: Record<string, string[]> = {
    jobs: ["Apply Online", "Notification", "Vacancy Details"],
    results: ["Result Link", "Merit List", "Scorecard"],
    "admit-cards": ["Hall Ticket", "Exam City", "Admit Card"],
    "answer-keys": ["Answer Key", "Response Sheet", "Objection"],
    admissions: ["Admission Form", "Counselling", "Merit List"],
    news: ["Update", "Notice", "Latest News"],
  };
  const pool = suffixBySection[doc.section] ?? ["Update", "Details", "Notice"];
  return pool[index % pool.length];
}

/**
 * Given posts sharing a 60-char `metaTitle`, keep the oldest/first post untouched (index 0)
 * and propose a concise, distinct title for each subsequent post so its first 60 characters are unique.
 */
export function proposeDistinctTitles(
  group: TitleDedupeCandidate[],
  existingMetaTitles: Set<string>,
): TitleDedupeProposal[] {
  const used = new Set(Array.from(existingMetaTitles, (t) => t.toLowerCase()));
  const proposals: TitleDedupeProposal[] = [];

  for (let i = 1; i < group.length; i++) {
    const doc = group[i];
    const diff = shortDifferentiator(doc, i - 1);
    const maxBase = Math.max(24, TITLE_MAX - diff.length - 3);
    const words = doc.title.replace(/\s+/g, " ").trim().split(" ");
    let base = "";
    for (const w of words) {
      const next = base ? `${base} ${w}` : w;
      if (next.length > maxBase) break;
      base = next;
    }
    if (!base) base = doc.title.slice(0, maxBase).trim();

    let candidate = `${base} – ${diff}`;
    let meta = fitTitle(detailText(doc.section, { ...doc, title: candidate }).title);
    let attempt = 2;
    while (used.has(meta.toLowerCase()) && attempt <= 10) {
      candidate = `${base} (${diff} ${attempt})`;
      meta = fitTitle(detailText(doc.section, { ...doc, title: candidate }).title);
      attempt++;
    }
    used.add(meta.toLowerCase());
    proposals.push({
      id: doc.id,
      section: doc.section,
      url: doc.url,
      oldTitle: doc.title,
      oldMetaTitle: doc.metaTitle,
      proposedTitle: candidate,
      proposedMetaTitle: meta,
    });
  }
  return proposals;
}
