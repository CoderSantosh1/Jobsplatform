// Regression: a regex typo (/s+/ instead of /\s+/) once stripped every "s" from page titles.
import { test } from "node:test";
import assert from "node:assert/strict";
import { detailText } from "../../src/lib/detail-titles.ts";
import { fitTitle } from "../../src/lib/seo.ts";

const SECTIONS = ["jobs", "results", "admit-cards", "answer-keys", "admissions", "news", "quizzes"];

test("titles keep every letter of the original (no lost 's')", () => {
  const title = "SSC GD Constable Mock Tests Series 2026 Basics";
  for (const section of SECTIONS) {
    const out = detailText(section, { title, organization: "SSC" }).title;
    assert.ok(out.startsWith(title), `${section}: "${out}"`);
  }
});

test("whitespace in titles is collapsed, letters untouched", () => {
  assert.equal(detailText("news", { title: "  Bihar   Police  Results  " }).title, "Bihar Police Results");
});

test("job title omits vacancy when the notification gives none", () => {
  for (const totalVacancy of [undefined, "", "N/A", "0"]) {
    const { title, description } = detailText("jobs", { title: "Court Assistant Recruitment 2026", totalVacancy });
    assert.ok(!/posts/i.test(title), `title "${title}" for vacancy ${JSON.stringify(totalVacancy)}`);
    assert.ok(!/posts/i.test(description), `description "${description}"`);
  }
  assert.match(detailText("jobs", { title: "Court Assistant 2026", totalVacancy: "250" }).title, /250 Posts/);
});

test("final <title> for long quiz names stays within 60 chars", () => {
  const { title } = detailText("quizzes", { title: "Python Programming Mock Test 2026 Set 05 Basics and Data Structures" });
  assert.ok(fitTitle(title).length <= 60);
});
