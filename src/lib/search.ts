// Pure helpers for title search (no database imports, so unit tests can load them).

export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Words of a search term that are worth matching ("SSC CGL" → ["SSC", "CGL"]). */
export function searchWords(term: string): string[] {
  return (term.match(/[A-Za-z0-9]+/g) ?? []).filter((w) => w.length > 1);
}

/**
 * One regex source per word; a title matches when every word starts a word in it
 * ("SSC CGL" matches "SSC CGL Result 2026" but not "ASSC CGLX").
 */
export function titleWordRegexes(term: string): string[] {
  return searchWords(term).map((w) => "\\b" + escapeRegex(w));
}
