// Regression tests for "Duplicate without user-selected canonical": one canonical copy per post title.
import { test } from "node:test";
import assert from "node:assert/strict";
import { canonicalOf, titleKey, titleRegexSource, uniqueByTitle } from "../../src/lib/dedupe.ts";

const OLD = "6500000000000000000000aa";
const MID = "6600000000000000000000bb";
const NEW = "6700000000000000000000cc";

test("titleKey ignores case, spacing and punctuation", () => {
  assert.equal(titleKey("RBI Grade B  Recruitment 2026"), titleKey("rbi grade b recruitment 2026!"));
  assert.notEqual(titleKey("RBI Grade B 2026"), titleKey("RBI Grade A 2026"));
  assert.equal(titleKey("हिंदी शीर्षक"), "");
});

test("canonicalOf picks the oldest copy", () => {
  assert.equal(canonicalOf([{ _id: NEW }, { _id: OLD }, { _id: MID }])?._id, OLD);
});

test("uniqueByTitle keeps one row per title, the oldest, in input order", () => {
  const rows = [
    { _id: NEW, title: "UP Police Constable Result 2026" },
    { _id: MID, title: "SSC GD Admit Card 2026" },
    { _id: OLD, title: "UP Police Constable Result 2026 " },
  ];
  assert.deepEqual(uniqueByTitle(rows).map((r) => r._id), [MID, OLD]);
});

test("uniqueByTitle never merges titles without Latin characters", () => {
  const rows = [
    { _id: OLD, title: "परिणाम" },
    { _id: NEW, title: "सूचना" },
  ];
  assert.equal(uniqueByTitle(rows).length, 2);
});

test("titleRegexSource matches spacing/punctuation variants of the same title", () => {
  const re = new RegExp(titleRegexSource(titleKey("SSC GD Result 2026")), "i");
  assert.ok(re.test("SSC GD Result 2026"));
  assert.ok(re.test("  SSC-GD  Result, 2026 "));
  assert.ok(!re.test("SSC GD Result 2026 Final"));
});
