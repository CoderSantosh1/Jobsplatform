// Admin Test Series SEO Audit: filters, sorting, completeness checklist, CSV export and the stored snapshot.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { auditCsv, contentCompleteness, filterAuditRows, uniquePct, type AuditRow } from "../../src/lib/admin-seo-rules.ts";

const row = (over: Partial<AuditRow> = {}): AuditRow => ({
  path: "/test-series/ssc-exams/ssc-cgl",
  name: "SSC CGL",
  category: "ssc-exams",
  type: "exam",
  status: 200,
  action: "IMPROVE",
  tests: 20,
  sharedPct: 80,
  reusedSamples: 2,
  templatePct: 55,
  relatedPosts: 1,
  inSitemap: true,
  inlinks: 2,
  indexable: true,
  canonicalOk: true,
  reason: "Shared questions, template text",
  ...over,
});

test("completeness counts the five checklist items and skips non-exam pages", () => {
  assert.equal(contentCompleteness(row()), 3);
  assert.equal(contentCompleteness(row({ sharedPct: 40, templatePct: 45 })), 5);
  assert.equal(contentCompleteness(row({ tests: 5, relatedPosts: 0, inSitemap: false, sharedPct: 99 })), 0);
  assert.equal(contentCompleteness(row({ type: "category" })), null);
  assert.equal(contentCompleteness(row({ status: 404 })), null);
});

test("unique % is the complement of shared %", () => {
  assert.equal(uniquePct(row({ sharedPct: 89.7 })), 10.3);
  assert.equal(uniquePct(row({ sharedPct: null })), null);
});

test("filters combine and sorting puts missing values last", () => {
  const rows = [
    row({ path: "/a", name: "Alpha", category: "police", action: "NOINDEX", sharedPct: 99 }),
    row({ path: "/b", name: "Beta", category: "ssc-exams", action: "IMPROVE", sharedPct: 50 }),
    row({ path: "/c", name: "Gamma", category: "ssc-exams", action: "NONE (404)", sharedPct: null, type: "exam" }),
  ];
  assert.deepEqual(filterAuditRows(rows, { category: "ssc-exams" }).map((r) => r.path), ["/b", "/c"]);
  assert.deepEqual(filterAuditRows(rows, { action: "NOINDEX" }).map((r) => r.path), ["/a"]);
  assert.deepEqual(filterAuditRows(rows, { q: "bet" }).map((r) => r.path), ["/b"]);
  assert.deepEqual(filterAuditRows(rows, { sort: "sharedPct", dir: "asc" }).map((r) => r.path), ["/b", "/a", "/c"]);
  assert.deepEqual(filterAuditRows(rows, { sort: "sharedPct", dir: "desc" }).map((r) => r.path), ["/a", "/b", "/c"]);
  assert.deepEqual(filterAuditRows(rows, { sort: "uniquePct", dir: "desc" }).map((r) => r.path), ["/b", "/a", "/c"]);
});

test("CSV quotes values with commas and gives full URLs", () => {
  const csv = auditCsv([row()]).split("\n");
  assert.equal(csv.length, 2);
  assert.match(csv[0], /^name,path,category,/);
  assert.match(csv[1], /https:\/\/www\.sarkariresultsnow\.com\/test-series\/ssc-exams\/ssc-cgl/);
  assert.match(csv[1], /"Shared questions, template text"$/);
});

test("stored audit snapshot is complete and consistent", () => {
  const snap = JSON.parse(fs.readFileSync("src/lib/admin-data/test-series-audit.json", "utf8"));
  assert.match(snap.auditedAt, /^\d{4}-\d{2}-\d{2}$/);
  const rows: AuditRow[] = snap.rows;
  assert.ok(rows.length >= 522);
  assert.equal(new Set(rows.map((r) => r.path)).size, rows.length, "no duplicate URLs");
  const valid = new Set(["KEEP", "IMPROVE", "NOINDEX", "CONSOLIDATE", "NONE (404)"]);
  for (const r of rows) {
    assert.ok(valid.has(r.action), r.path);
    assert.match(r.path, /^\/test-series\/[a-z0-9-]+(\/[a-z0-9-]+)?$/);
    assert.equal(r.action === "NONE (404)", r.status !== 200, r.path);
  }
  assert.equal(rows.filter((r) => r.action === "NONE (404)").length, 15);
  assert.equal(rows.filter((r) => r.action === "CONSOLIDATE").length, 6);
});
