// Quiz card titles: no repeated exam name or question count.
import { test } from "node:test";
import assert from "node:assert/strict";
import { shortQuizTitle } from "../../src/lib/quiz-format.ts";

test("drops the exam name shown as the card tag and the question count", () => {
  assert.equal(shortQuizTitle("Bihar Police Constable Mock Test 4 (20 Questions)", "Bihar Police Constable"), "Mock Test 4");
  assert.equal(shortQuizTitle("SSC CGL – Practice Set 2", "SSC CGL"), "Practice Set 2");
  assert.equal(shortQuizTitle("RRB NTPC Mock Test 1 (100 questions)", "RRB NTPC"), "Mock Test 1");
});

test("keeps the title when it doesn't start with the exam name", () => {
  assert.equal(shortQuizTitle("SSC GD Mock Test 1 (80 Questions)", "SSC GD Constable"), "SSC GD Mock Test 1");
  assert.equal(shortQuizTitle("General Science Quiz", undefined), "General Science Quiz");
});

test("never returns an empty or too-short title", () => {
  assert.equal(shortQuizTitle("Bihar STET", "Bihar STET"), "Bihar STET");
  assert.equal(shortQuizTitle("CTET 1", "CTET"), "CTET 1");
});
