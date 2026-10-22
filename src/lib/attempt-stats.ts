// Test history maths for the profile page and quiz cards. Pure functions, so unit tests can load this file directly.

export type AttemptQuiz = {
  _id: string;
  title: string;
  category?: string;
  subcategory?: string;
  timeLimit?: number;
  totalMarks?: number;
};

export type AttemptRow = {
  _id: string;
  quizId: string;
  /** Correct answers. */
  score: number;
  /** Questions in the test. */
  total: number;
  completedAt: string;
  quiz: AttemptQuiz | null;
};

export function percentOf(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

export function summarizeAttempts(rows: AttemptRow[]) {
  const percents = rows.map((r) => percentOf(r.score, r.total));
  return {
    testsTaken: rows.length,
    uniqueTests: new Set(rows.map((r) => r.quizId)).size,
    averagePercent: percents.length ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : 0,
    bestPercent: percents.length ? Math.max(...percents) : 0,
    totalCorrect: rows.reduce((n, r) => n + r.score, 0),
    totalQuestions: rows.reduce((n, r) => n + r.total, 0),
  };
}

export type QuizProgress = { attempts: number; bestScore: number; total: number; lastAt: string };

/** Per-test summary (how many times taken, best score) used by the quiz cards. */
export function progressByQuiz(rows: AttemptRow[]): Record<string, QuizProgress> {
  const out: Record<string, QuizProgress> = {};
  for (const r of rows) {
    const p = out[r.quizId];
    if (!p) {
      out[r.quizId] = { attempts: 1, bestScore: r.score, total: r.total, lastAt: r.completedAt };
      continue;
    }
    p.attempts += 1;
    if (percentOf(r.score, r.total) > percentOf(p.bestScore, p.total)) {
      p.bestScore = r.score;
      p.total = r.total;
    }
    if (r.completedAt > p.lastAt) p.lastAt = r.completedAt;
  }
  return out;
}

/** "Attempt 1, 2, …" for each row, counted per test in time order. */
export function attemptNumbers(rows: AttemptRow[]): Record<string, number> {
  const seen: Record<string, number> = {};
  const out: Record<string, number> = {};
  for (const r of [...rows].sort((a, b) => a.completedAt.localeCompare(b.completedAt))) {
    seen[r.quizId] = (seen[r.quizId] ?? 0) + 1;
    out[r._id] = seen[r.quizId];
  }
  return out;
}

/** Leaderboard position by total correct answers across all tests (ties share a position). */
export function rankFromTotals(totals: { userId: string; total: number }[], userId: string) {
  const mine = totals.find((t) => t.userId === userId);
  if (!mine) return null;
  return { position: totals.filter((t) => t.total > mine.total).length + 1, totalUsers: totals.length };
}

export function grade(percent: number): { grade: string; label: string } {
  if (percent >= 90) return { grade: "A+", label: "Excellent" };
  if (percent >= 80) return { grade: "A", label: "Very good" };
  if (percent >= 70) return { grade: "B", label: "Good" };
  if (percent >= 60) return { grade: "C", label: "Average" };
  return { grade: "D", label: "Needs practice" };
}
