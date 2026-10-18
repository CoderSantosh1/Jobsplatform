// Unit tests for the SEO helpers. Run with: pnpm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { clip, displayDate, fitTitle, formatDate, isBlank, isPastDeadline, pageMetadata, parseDate } from "../../src/lib/seo.ts";
import { detailPath, idFromParam, quizPath, slugify, testSeriesPath } from "../../src/lib/slug.ts";
import { EXAMS } from "../../src/lib/exams.ts";

const ID = "6ad059ee984e13945230c1c2";

test("fitTitle adds the short suffix when it fits", () => {
  assert.equal(fitTitle("About Us"), "About Us | SRN");
});

test("fitTitle never exceeds 60 characters", () => {
  const titles = [
    "Python Programming Mock Test 2026 – 5 Free Tests in Hindi & English",
    "High Court Recruitment 2026 – Court Assistant (Technical Assistant) 150 Posts, Last Date 20 Oct",
    "A".repeat(120),
    "Sarkari Results Now: Sarkari Result, Govt Jobs, Admit Card",
  ];
  for (const t of titles) assert.ok(fitTitle(t).length <= 60, `${fitTitle(t)} (${fitTitle(t).length})`);
});

test("fitTitle cuts on a word boundary without ellipsis or dangling bracket", () => {
  const out = fitTitle("High Court Recruitment 2026 – Court Assistant (Technical Assistant) 150 Posts, Last Date 20 Oct");
  assert.ok(!out.includes("…"));
  assert.ok(!/\([^)]*$/.test(out), `unclosed bracket in "${out}"`);
  assert.ok(!/[\s–&,(-]$/.test(out), `ends with filler: "${out}"`);
  assert.ok(!/\s(and|of|for|&)$/i.test(out));
});

test("pageMetadata uses absolute fitted titles and a canonical path", () => {
  const meta = pageMetadata({ title: "x".repeat(80), description: "d", path: "/jobs" });
  const title = (meta.title as { absolute: string }).absolute;
  assert.ok(title.length <= 60);
  assert.deepEqual(meta.alternates, { canonical: "/jobs" });
  assert.equal(meta.robots, undefined);
  assert.deepEqual(pageMetadata({ title: "t", description: "d", path: "/p", noIndex: true }).robots, { index: false, follow: true });
});

test("social image is the 1200x630 og-image", () => {
  const meta = pageMetadata({ title: "t", description: "d", path: "/" });
  const img = (meta.openGraph?.images as { url: string; width: number }[])[0];
  assert.equal(img.url, "/og-image.png");
  assert.equal(img.width, 1200);
});

test("clip strips tags and keeps the limit", () => {
  assert.equal(clip("<b>Hello</b>   world", 50), "Hello world");
  assert.ok(clip("word ".repeat(100), 40).length <= 40);
});

test("parseDate understands ISO and Indian dd-mm-yyyy dates", () => {
  assert.equal(parseDate("2026-10-20")?.toISOString().slice(0, 10), "2026-10-20");
  assert.equal(parseDate("20-10-2026")?.toISOString().slice(0, 10), "2026-10-20");
  assert.equal(parseDate("20/10/2026")?.toISOString().slice(0, 10), "2026-10-20");
  assert.equal(parseDate("10/20/2026")?.toISOString().slice(0, 10), "2026-10-20");
  assert.equal(parseDate("31-02-2026"), undefined);
  assert.equal(parseDate("Notify Soon"), undefined);
});

test("formatDate shows Indian style and the right calendar day", () => {
  assert.equal(formatDate("2026-10-20"), "20 Oct 2026");
  // Midnight IST is 18:30 UTC the previous day; it must still read as 20 Oct.
  assert.equal(formatDate("2026-10-19T18:30:00.000Z"), "20 Oct 2026");
  assert.equal(displayDate("Notify Soon"), "Notify Soon");
});

test("isPastDeadline", () => {
  assert.equal(isPastDeadline("2020-01-01"), true);
  assert.equal(isPastDeadline(new Date(Date.now() + 7 * 864e5)), false);
  assert.equal(isPastDeadline("Notify Soon"), false);
  assert.equal(isPastDeadline(undefined, "2020-01-01"), true);
});

test("isBlank hides admin placeholders", () => {
  for (const v of ["", " N/A ", "-", "Not mentioned/-", null, undefined]) assert.equal(isBlank(v), true);
  assert.equal(isBlank("100"), false);
});

test("slugs and ids round-trip", () => {
  assert.equal(slugify("UCO Bank Apprentice Recruitment 2026 (530 Posts)"), "uco-bank-apprentice-recruitment-2026-530-posts");
  assert.equal(slugify("एसएससी जीडी"), "");
  assert.equal(detailPath("jobs", { _id: ID, title: "UCO Bank Apprentice 2026" }), `/jobs/uco-bank-apprentice-2026-${ID}`);
  assert.equal(detailPath("jobs", { _id: ID, title: "हिंदी" }), `/jobs/${ID}`);
  assert.equal(idFromParam(`uco-bank-apprentice-2026-${ID}`), ID);
  assert.equal(idFromParam(ID), ID);
  assert.equal(quizPath({ _id: ID, title: "SSC GD Mock Test 01" }), `/quizzes/ssc-gd-mock-test-01-${ID}/instructions`);
  assert.equal(testSeriesPath("SSC", "SSC GD"), "/test-series/ssc/ssc-gd");
});

test("exam slugs are unique and URL-safe", () => {
  const slugs = EXAMS.map((e) => e.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const s of slugs) assert.match(s, /^[a-z0-9-]+$/);
});
