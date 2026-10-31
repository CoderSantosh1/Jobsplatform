// Tests that ask for login only after submitting: the attempt saved in the browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clearAttempt,
  createAttempt,
  isAbandoned,
  isLoginAfterSubmitQuiz,
  loadAttempt,
  markSubmitted,
  newClientAttemptId,
  remainingSeconds,
  saveAttempt,
} from "../../src/lib/quiz-attempt-store.ts";
import { isClientAttemptId, isValidAnswerList } from "../../src/lib/upload-rules.ts";

function memoryStore() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

const QUIZ = { _id: "q1", timeLimit: 20, questions: [{ _id: "a" }, { _id: "b" }, { _id: "c" }] };
const IDS = ["a", "b", "c"];
const T0 = 1_800_000_000_000;
const fresh = () => createAttempt(QUIZ, "attempt-id-0000000001", T0, "not-viewed");

test("only Bihar STET tests ask for login after submitting", () => {
  assert.equal(isLoginAfterSubmitQuiz({ subcategory: "Bihar STET" }), true);
  assert.equal(isLoginAfterSubmitQuiz({ subcategory: " bihar  stet " }), true);
  for (const subcategory of ["SSC CGL", "STET", "CTET", "Bihar Police Constable", undefined, 5]) {
    assert.equal(isLoginAfterSubmitQuiz({ subcategory }), false);
  }
  assert.equal(isLoginAfterSubmitQuiz(null), false);
});

test("a new attempt starts empty with the quiz's duration and question ids", () => {
  const a = fresh();
  assert.deepEqual(a.answers, [-1, -1, -1]);
  assert.deepEqual(a.questionIds, IDS);
  assert.equal(a.durationSeconds, 1200);
  assert.equal(a.submittedAt, null);
});

test("a refresh cannot reset the timer: it runs from the saved start time", () => {
  const a = fresh();
  assert.equal(remainingSeconds(a, T0), 1200);
  assert.equal(remainingSeconds(a, T0 + 300_000), 900);
  assert.equal(remainingSeconds(a, T0 + 5_000_000), 0);
});

test("answers survive a save and load; clearing removes them", () => {
  const store = memoryStore();
  saveAttempt(store, { ...fresh(), answers: [2, -1, 0], currentQuestion: 2 });
  const loaded = loadAttempt(store, "q1", IDS);
  assert.deepEqual(loaded?.answers, [2, -1, 0]);
  assert.equal(loaded?.currentQuestion, 2);
  assert.equal(loaded?.clientAttemptId, "attempt-id-0000000001");
  clearAttempt(store, "q1");
  assert.equal(loadAttempt(store, "q1", IDS), null);
});

test("damaged data or changed questions are not restored", () => {
  const store = memoryStore();
  store.setItem("quiz-attempt-q1", "{not json");
  assert.equal(loadAttempt(store, "q1", IDS), null);
  saveAttempt(store, fresh());
  assert.equal(loadAttempt(store, "q1", ["a", "b", "x"]), null);
  saveAttempt(store, { ...fresh(), answers: [1] });
  assert.equal(loadAttempt(store, "q1", IDS), null);
});

test("the first submission time is kept when submitted again", () => {
  const once = markSubmitted(fresh(), T0 + 1000);
  assert.equal(once.submittedAt, T0 + 1000);
  assert.equal(markSubmitted(once, T0 + 9000).submittedAt, T0 + 1000);
});

test("an expired test is abandoned only if unanswered or over a day old", () => {
  const end = T0 + 1_200_000;
  const answered = { ...fresh(), answers: [1, -1, -1] };
  assert.equal(isAbandoned(answered, T0 + 1000), false);
  assert.equal(isAbandoned(fresh(), T0 + 1000), false);
  assert.equal(isAbandoned(fresh(), end + 1000), true);
  assert.equal(isAbandoned(answered, end + 1000), false);
  assert.equal(isAbandoned(answered, end + 25 * 60 * 60 * 1000), true);
  // Submitted attempts waiting for login are never thrown away.
  assert.equal(isAbandoned(markSubmitted(answered, end), end + 90 * 24 * 60 * 60 * 1000), false);
});

test("attempt ids are unique and accepted by the server's check", () => {
  const a = newClientAttemptId();
  assert.notEqual(a, newClientAttemptId());
  assert.equal(isClientAttemptId(a), true);
  assert.equal(isClientAttemptId("short"), false);
  assert.equal(isClientAttemptId({ $ne: null }), false);
  assert.equal(isClientAttemptId("bad id with spaces in it"), false);
  // Saved answers pass the server's answer check, including unanswered (-1).
  assert.equal(isValidAnswerList(fresh().answers, 3), true);
});
