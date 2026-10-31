// A test attempt saved in the browser, for tests that let visitors log in only after submitting.
// It survives a refresh and the login step, and is removed only after the server has accepted the attempt.
// Scores are never stored here: the server works them out from the answers.
// Pure functions (storage is passed in), so unit tests can load this file directly.
import { slugify } from "./slug.ts";

/** Subcategories whose tests can be taken logged out. Other exams keep asking for login before the test. */
const LOGIN_AFTER_SUBMIT_SUBCATEGORIES = ["bihar-stet"];

export function isLoginAfterSubmitQuiz(quiz: { subcategory?: unknown } | null | undefined): boolean {
  return typeof quiz?.subcategory === "string" && LOGIN_AFTER_SUBMIT_SUBCATEGORIES.includes(slugify(quiz.subcategory));
}

export type SavedAttempt = {
  clientAttemptId: string;
  quizId: string;
  questionIds: string[];
  startedAt: number;
  durationSeconds: number;
  answers: number[];
  statuses: string[];
  currentQuestion: number;
  /** When the visitor confirmed submission or time ran out. After this the answers can no longer change. */
  submittedAt: number | null;
};

type KeyValueStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const storageKey = (quizId: string) => `quiz-attempt-${quizId}`;

export function createAttempt(
  quiz: { _id: string; timeLimit: number; questions: { _id: string }[] },
  clientAttemptId: string,
  now: number,
  initialStatus: string,
): SavedAttempt {
  return {
    clientAttemptId,
    quizId: quiz._id,
    questionIds: quiz.questions.map((q) => q._id),
    startedAt: now,
    durationSeconds: quiz.timeLimit * 60,
    answers: quiz.questions.map(() => -1),
    statuses: quiz.questions.map(() => initialStatus),
    currentQuestion: 0,
    submittedAt: null,
  };
}

/** A unique id for one attempt. Falls back for older browsers that do not have crypto.randomUUID. */
export function newClientAttemptId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

/** Seconds left on the timer, worked out from the start time so a refresh cannot reset it. */
export function remainingSeconds(attempt: Pick<SavedAttempt, "startedAt" | "durationSeconds">, now: number): number {
  return Math.max(0, attempt.durationSeconds - Math.floor((now - attempt.startedAt) / 1000));
}

/**
 * A test left unfinished whose time has run out: nothing was answered, or it ended over a day ago.
 * The visitor gets a new attempt instead of a result for a test they walked away from.
 */
export function isAbandoned(attempt: SavedAttempt, now: number): boolean {
  if (attempt.submittedAt !== null || remainingSeconds(attempt, now) > 0) return false;
  const endedAt = attempt.startedAt + attempt.durationSeconds * 1000;
  return attempt.answers.every((a) => a === -1) || now - endedAt > 24 * 60 * 60 * 1000;
}

/** Locks the attempt. The first submission time is kept if it was already locked. */
export function markSubmitted(attempt: SavedAttempt, now: number): SavedAttempt {
  return attempt.submittedAt === null ? { ...attempt, submittedAt: now } : attempt;
}

/** Saved attempt for this quiz, or null if there is none, it is damaged, or the quiz's questions have changed. */
export function loadAttempt(store: KeyValueStore, quizId: string, questionIds: string[]): SavedAttempt | null {
  try {
    const raw = store.getItem(storageKey(quizId));
    if (!raw) return null;
    const a = JSON.parse(raw) as SavedAttempt;
    const valid =
      a.quizId === quizId &&
      typeof a.clientAttemptId === "string" &&
      Number.isFinite(a.startedAt) &&
      Number.isFinite(a.durationSeconds) &&
      Array.isArray(a.answers) &&
      a.answers.length === questionIds.length &&
      a.answers.every((x) => Number.isInteger(x)) &&
      Array.isArray(a.statuses) &&
      a.statuses.length === questionIds.length &&
      Array.isArray(a.questionIds) &&
      a.questionIds.length === questionIds.length &&
      a.questionIds.every((id, i) => id === questionIds[i]) &&
      (a.submittedAt === null || Number.isFinite(a.submittedAt));
    if (valid) return a;
    store.removeItem(storageKey(quizId));
    return null;
  } catch {
    return null;
  }
}

export function saveAttempt(store: KeyValueStore, attempt: SavedAttempt): void {
  try {
    store.setItem(storageKey(attempt.quizId), JSON.stringify(attempt));
  } catch {
    // Storage full or blocked: the test still works, but will not survive a refresh.
  }
}

export function clearAttempt(store: KeyValueStore, quizId: string): void {
  try {
    store.removeItem(storageKey(quizId));
  } catch {
    // Nothing to clean up if storage is blocked.
  }
}
