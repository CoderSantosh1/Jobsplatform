// Admin Redirect Manager grouping: posts by section, test series by category, other pages apart, with pagination.
import { test } from "node:test";
import assert from "node:assert/strict";
import { countByTab, groupByHeading, pagedGroups, redirectGroup, slugLabel } from "../../src/lib/redirect-groups.ts";

const ID = "6ae2bccef231965137b40335";

test("redirectGroup puts posts under their section and test series under their category", () => {
  assert.deepEqual(redirectGroup(`/jobs/tnpsc-group-4-${ID}`), { tab: "posts", group: "Jobs" });
  assert.deepEqual(redirectGroup(`/admit-cards/${ID}`), { tab: "posts", group: "Admit Cards" });
  assert.deepEqual(redirectGroup("/test-series/police/bpsc-aedo"), { tab: "test-series", group: "Police" });
  assert.deepEqual(redirectGroup("/test-series/regulatory-body-exams/rbi-grade-b"), { tab: "test-series", group: "Regulatory Body Exams" });
  assert.deepEqual(redirectGroup("/test-series"), { tab: "test-series", group: "All test series" });
  assert.deepEqual(redirectGroup("/latest-jobs"), { tab: "other", group: "Other pages" });
  assert.deepEqual(redirectGroup("/jobs"), { tab: "other", group: "Other pages" });
});

test("slugLabel turns a category slug into a heading", () => {
  assert.equal(slugLabel("banking-exams"), "Banking Exams");
});

const rows = [
  { p: "/test-series/police/a" },
  { p: `/jobs/x-${ID}` },
  { p: "/test-series/banking-exams/b" },
  { p: "/test-series/police/c" },
  { p: "/contact-us" },
];

test("groupByHeading keeps one tab, sorts headings and keeps row order inside a group", () => {
  const groups = groupByHeading(rows, (r) => r.p, "test-series");
  assert.deepEqual(groups.map((g) => g.group), ["Banking Exams", "Police"]);
  assert.deepEqual(groups[1].rows.map((r) => r.p), ["/test-series/police/a", "/test-series/police/c"]);
});

test("countByTab counts every row once", () => {
  assert.deepEqual(countByTab(rows, (r) => r.p), { posts: 1, "test-series": 3, other: 1 });
});

test("pagedGroups cuts the grouped rows into pages and repeats a heading that spans pages", () => {
  const first = pagedGroups(rows, (r) => r.p, "test-series", 1, 2);
  assert.equal(first.pages, 2);
  assert.equal(first.total, 3);
  assert.deepEqual(first.groups.map((g) => [g.group, g.rows.length]), [["Banking Exams", 1], ["Police", 1]]);
  const second = pagedGroups(rows, (r) => r.p, "test-series", 2, 2);
  assert.deepEqual(second.groups.map((g) => [g.group, g.rows.map((r) => r.p)]), [["Police", ["/test-series/police/c"]]]);
});

test("pagedGroups clamps out-of-range pages and handles an empty tab", () => {
  assert.equal(pagedGroups(rows, (r) => r.p, "test-series", 99, 2).page, 2);
  assert.equal(pagedGroups(rows, (r) => r.p, "test-series", 0, 2).page, 1);
  const empty = pagedGroups([], (r: { p: string }) => r.p, "posts", 1, 20);
  assert.deepEqual([empty.page, empty.pages, empty.total, empty.groups.length], [1, 1, 0, 0]);
});
