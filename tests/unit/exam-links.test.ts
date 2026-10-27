// "Related Updates" links from job / result / admit card pages to the exam's free test pages.
import { test } from "node:test";
import assert from "node:assert/strict";
import { examTestSeries, findTestLinks } from "../../src/lib/exam-links.ts";
import { EXAMS } from "../../src/lib/exams.ts";

const sub = (name: string, count = 10) => ({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), count });
const GROUPS = [
  { name: "SSC Exams", slug: "ssc-exams", subcategories: [sub("SSC GD Constable", 40), sub("SSC CGL", 60)] },
  { name: "Railways Exams", slug: "railways-exams", subcategories: [sub("RRB NTPC", 50), sub("RRB Group D", 30)] },
  {
    name: "Police",
    slug: "police",
    subcategories: [sub("Bihar Police Constable", 20), sub("Bihar Police Prohibition Constable", 5), sub("UP Police", 8)],
  },
  { name: "Teaching Exams", slug: "teaching-exams", subcategories: [sub("Bihar STET", 12), sub("CTET", 25)] },
  { name: "State Govt. Exams", slug: "state-govt-exams", subcategories: [sub("HSSC CET Group D", 6)] },
  { name: "Campus Placement", slug: "campus-placement", subcategories: [sub("Amazon"), sub("TCS NQT")] },
  { name: "Accounting and Commerce", slug: "accounting-and-commerce", subcategories: [sub("B.Com")] },
];

const hrefs = (title: string) => findTestLinks(title, EXAMS, GROUPS).map((l) => l.href);

test("a post links to its exam's practice page and mock test series", () => {
  assert.deepEqual(hrefs("SSC GD Constable Recruitment 2026 – Apply Online for 39481 Posts"), [
    "/ssc-gd",
    "/test-series/ssc-exams/ssc-gd-constable",
  ]);
  assert.deepEqual(hrefs("RRB NTPC Graduate Level Admit Card 2026 Download"), ["/rrb-ntpc", "/test-series/railways-exams/rrb-ntpc"]);
  assert.deepEqual(hrefs("Bihar STET 2026 Result Out"), ["/bihar-stet", "/test-series/teaching-exams/bihar-stet"]);
});

test("the most specific mock test series wins", () => {
  assert.deepEqual(hrefs("Bihar Police Prohibition Constable Recruitment 2026"), [
    "/bihar-police-constable",
    "/test-series/police/bihar-police-prohibition-constable",
  ]);
});

test("broad words don't link to the wrong exam", () => {
  // "Group D" alone must not send a Haryana post to the RRB Group D page.
  assert.deepEqual(hrefs("HSSC CET Group D Result 2026"), ["/test-series/state-govt-exams/hssc-cet-group-d"]);
  assert.deepEqual(hrefs("RRB Group D Answer Key 2026"), ["/rrb-group-d", "/test-series/railways-exams/rrb-group-d"]);
  // Words must match whole: "UPSC" is not "UP".
  assert.deepEqual(hrefs("UPSC Prelims Result 2026"), []);
});

test("non-government categories are never linked", () => {
  assert.deepEqual(hrefs("Amazon Recruitment 2026"), []);
  assert.deepEqual(hrefs("B.Com Admission 2026"), []);
});

test("unrelated posts get no links", () => {
  assert.deepEqual(hrefs("NEET PG Counselling 2026 Round 1 Schedule"), []);
});

test("website names in a title are ignored", () => {
  const groups = [{ name: "SSC Exams", slug: "ssc-exams", subcategories: [sub("NBE", 3)] }];
  const links = (t: string) => findTestLinks(t, EXAMS, groups).map((l) => l.href);
  assert.deepEqual(links("NEET PG 2025 City Intimation Slip Out at nbe.edu.in"), []);
  assert.deepEqual(links("NBE Recruitment 2026"), ["/test-series/ssc-exams/nbe"]);
});

test("a Sub Inspector post is not sent to the Constable practice page", () => {
  const groups = [{ name: "Police", slug: "police", subcategories: [sub("Bihar Police SI", 9), sub("Bihar Police Constable", 20)] }];
  assert.deepEqual(
    findTestLinks("BPSSC Bihar Police Sub Inspector SI Recruitment 2025", EXAMS, groups).map((l) => l.href),
    ["/test-series/police/bihar-police-si"],
  );
});

test("examTestSeries links an exam to its mapped test-series page only when it has tests", () => {
  const exam = { testSeries: { category: "ssc-exams", sub: "ssc-gd-constable" } };
  assert.deepEqual(examTestSeries(exam, GROUPS), { href: "/test-series/ssc-exams/ssc-gd-constable", name: "SSC GD Constable", count: 40 });
  assert.equal(examTestSeries({}, GROUPS), null);
  assert.equal(examTestSeries({ testSeries: { category: "ssc-exams", sub: "ssc-xyz" } }, GROUPS), null);
  assert.equal(examTestSeries({ testSeries: { category: "nope", sub: "ssc-cgl" } }, GROUPS), null);
  const empty = [{ name: "SSC Exams", slug: "ssc-exams", subcategories: [{ name: "SSC GD Constable", slug: "ssc-gd-constable", count: 0 }] }];
  assert.equal(examTestSeries(exam, empty), null);
});

test("every main exam has a unique, URL-safe test-series mapping", () => {
  const hrefs = EXAMS.map((e) => {
    assert.ok(e.testSeries, e.slug + " has no testSeries mapping");
    assert.match(e.testSeries!.category, /^[a-z0-9-]+$/);
    assert.match(e.testSeries!.sub, /^[a-z0-9-]+$/);
    return e.testSeries!.category + "/" + e.testSeries!.sub;
  });
  assert.equal(new Set(hrefs).size, hrefs.length);
});
