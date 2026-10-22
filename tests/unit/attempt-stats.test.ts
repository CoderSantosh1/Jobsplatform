// Profile test history: stats, per-test progress, attempt numbers and rank.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  attemptNumbers,
  grade,
  percentOf,
  progressByQuiz,
  rankFromTotals,
  summarizeAttempts,
  type AttemptRow,
} from "../../src/lib/attempt-stats.ts";

const row = (id: string, quizId: string, score: number, total: number, day: number): AttemptRow => ({
  _id: id,
  quizId,
  score,
  total,
  completedAt: new Date(Date.UTC(2026, 9, day)).toISOString(),
  quiz: null,
});

// q1 taken twice (10/20 then 16/20), q2 once (45/100); newest first, as the API returns them.
const ROWS = [row("a2", "q1", 16, 20, 3), row("a3", "q2", 45, 100, 2), row("a1", "q1", 10, 20, 1)];

test("percentOf uses correct answers out of questions", () => {
  assert.equal(percentOf(14, 20), 70);
  assert.equal(percentOf(0, 0), 0);
});

test("summarizeAttempts counts tests and averages percentages", () => {
  assert.deepEqual(summarizeAttempts(ROWS), {
    testsTaken: 3,
    uniqueTests: 2,
    averagePercent: 58, // (80 + 45 + 50) / 3
    bestPercent: 80,
    totalCorrect: 71,
    totalQuestions: 140,
  });
  assert.deepEqual(summarizeAttempts([]), {
    testsTaken: 0,
    uniqueTests: 0,
    averagePercent: 0,
    bestPercent: 0,
    totalCorrect: 0,
    totalQuestions: 0,
  });
});

test("progressByQuiz keeps the best score and attempt count per test", () => {
  const p = progressByQuiz(ROWS);
  assert.deepEqual(p.q1, { attempts: 2, bestScore: 16, total: 20, lastAt: ROWS[0].completedAt });
  assert.deepEqual(p.q2, { attempts: 1, bestScore: 45, total: 100, lastAt: ROWS[1].completedAt });
});

test("attemptNumbers counts attempts per test in time order", () => {
  assert.deepEqual(attemptNumbers(ROWS), { a1: 1, a2: 2, a3: 1 });
});

test("rankFromTotals ranks by total correct answers, ties share a place", () => {
  const totals = [
    { userId: "u1", total: 90 },
    { userId: "u2", total: 120 },
    { userId: "u3", total: 90 },
    { userId: "u4", total: 10 },
  ];
  assert.deepEqual(rankFromTotals(totals, "u2"), { position: 1, totalUsers: 4 });
  assert.deepEqual(rankFromTotals(totals, "u1"), { position: 2, totalUsers: 4 });
  assert.deepEqual(rankFromTotals(totals, "u3"), { position: 2, totalUsers: 4 });
  assert.deepEqual(rankFromTotals(totals, "u4"), { position: 4, totalUsers: 4 });
  assert.equal(rankFromTotals(totals, "nobody"), null);
});

test("grade bands", () => {
  assert.equal(grade(95).grade, "A+");
  assert.equal(grade(70).grade, "B");
  assert.equal(grade(10).grade, "D");
});
