// Display helpers for quiz cards. Pure functions, so unit tests can load this file directly.

/**
 * Short card title: drops a trailing "(20 Questions)" and a leading exam name that the card already shows as a tag,
 * so "Bihar Police Constable Mock Test 4 (20 Questions)" becomes "Mock Test 4". Falls back to the full title.
 */
export function shortQuizTitle(title: string, subcategory?: string): string {
  let t = title.replace(/\s*\(\s*\d+\s*(questions?|qs?)\s*\)\s*$/i, "").trim();
  const sub = subcategory?.trim();
  if (sub && t.toLowerCase().startsWith(sub.toLowerCase())) {
    const rest = t.slice(sub.length).replace(/^[\s:–—-]+/, "").trim();
    if (rest.length >= 3) t = rest;
  }
  return t || title;
}
