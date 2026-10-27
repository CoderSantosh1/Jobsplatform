// Security checks: upload validation, id formats, answer lists and hiding correct answers from test-takers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isMobileNumber, isObjectIdString, isValidAnswerList, sniffImageType } from "../../src/lib/upload-rules.ts";
import { withoutAnswers } from "../../src/lib/quiz-public.ts";

const bytes = (...b: number[]) => new Uint8Array(b);
const text = (s: string) => new TextEncoder().encode(s);

test("sniffImageType recognises real JPG, PNG and WebP files by their bytes", () => {
  assert.equal(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0)), "jpg");
  assert.equal(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0)), "png");
  assert.equal(sniffImageType(text("RIFF\u0000\u0000\u0000\u0000WEBPVP8 ")), "webp");
});

test("sniffImageType rejects HTML, SVG and other files even if named .png", () => {
  assert.equal(sniffImageType(text("<html><script>alert(1)</script>")), null);
  assert.equal(sniffImageType(text('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>')), null);
  assert.equal(sniffImageType(text("GIF89a")), null);
  assert.equal(sniffImageType(bytes()), null);
});

test("ids: only real ObjectIds and Indian mobile numbers pass", () => {
  assert.equal(isObjectIdString("6ad9f7cbb45627dc75229802"), true);
  for (const bad of ["../../etc/passwd", "6ad9f7cbb45627dc7522980", "x".repeat(24), { $ne: null }, null]) {
    assert.equal(isObjectIdString(bad), false, String(bad));
  }
  assert.equal(isMobileNumber("9876543210"), true);
  for (const bad of ["1234567890", "98765", "98765432100", { $gt: "" }, 9876543210]) {
    assert.equal(isMobileNumber(bad), false, String(bad));
  }
});

test("answer lists: integers per question, -1 for unanswered, no more than the questions", () => {
  assert.equal(isValidAnswerList([0, 3, -1, 2], 4), true);
  assert.equal(isValidAnswerList([], 4), true);
  assert.equal(isValidAnswerList([0, 1, 2, 3, 0], 4), false);
  assert.equal(isValidAnswerList(["1", 2], 4), false);
  assert.equal(isValidAnswerList([1.5], 4), false);
  assert.equal(isValidAnswerList([-2], 4), false);
  assert.equal(isValidAnswerList({ 0: 1 }, 4), false);
});

test("withoutAnswers removes every correct answer and keeps the rest", () => {
  const quiz = {
    _id: "q1",
    title: "Mock Test 1",
    questions: [
      { _id: "a", text: "2+2?", options: ["3", "4"], correctAnswer: "1" },
      { _id: "b", text: "Capital?", options: ["X", "Y"], correctAnswer: "0" },
    ],
  };
  const pub = withoutAnswers(quiz);
  assert.equal(JSON.stringify(pub).includes("correctAnswer"), false);
  assert.deepEqual(pub.questions, [
    { _id: "a", text: "2+2?", options: ["3", "4"] },
    { _id: "b", text: "Capital?", options: ["X", "Y"] },
  ]);
  assert.equal(pub.title, "Mock Test 1");
  // The original object is not modified.
  assert.equal(quiz.questions[0].correctAnswer, "1");
});
