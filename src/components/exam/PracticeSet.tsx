"use client";

import { useState } from "react";
import { scorePractice, type ExamPrep } from "@/lib/exam-prep";

const LETTERS = ["A", "B", "C", "D"];

/** Free practice set on an exam page: answer, submit, then see the score (exam's own marking) and explanations. */
export default function PracticeSet({ examName, prep }: { examName: string; prep: ExamPrep }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => prep.practice.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const result = submitted ? scorePractice(prep, answers) : null;

  const choose = (qi: number, oi: number) => {
    if (submitted) return;
    setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)));
  };

  const reset = () => {
    setAnswers(prep.practice.map(() => null));
    setSubmitted(false);
  };

  const answered = answers.filter((a) => a !== null).length;

  return (
    <div>
      <p className="text-sm text-gray-600">
        {prep.practice.length} questions · {prep.markingNote}
      </p>

      <ol className="mt-4 space-y-5">
        {prep.practice.map((q, qi) => {
          const picked = answers[qi];
          return (
            <li key={qi} className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">{q.section}</p>
              <p className="mt-1 font-medium text-gray-900">
                Q{qi + 1}. {q.q}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, oi) => {
                  const isPicked = picked === oi;
                  const isAnswer = q.answer === oi;
                  let cls = "border-gray-300 hover:bg-gray-50";
                  if (submitted && isAnswer) cls = "border-green-600 bg-green-50 text-green-900";
                  else if (submitted && isPicked) cls = "border-red-500 bg-red-50 text-red-900";
                  else if (isPicked) cls = "border-blue-600 bg-blue-50";
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => choose(qi, oi)}
                      disabled={submitted}
                      aria-pressed={isPicked}
                      className={`flex items-start gap-2 rounded border px-3 py-2 text-left text-sm ${cls}`}
                    >
                      <span className="font-semibold">{LETTERS[oi]}.</span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <p className="mt-3 rounded bg-gray-50 p-2 text-sm text-gray-800">
                  <span className={picked === q.answer ? "font-semibold text-green-700" : picked === null ? "font-semibold text-gray-600" : "font-semibold text-red-700"}>
                    {picked === q.answer ? "Correct." : picked === null ? "Not attempted." : `Wrong. Correct answer: ${LETTERS[q.answer]}.`}
                  </span>{" "}
                  {q.explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!submitted ? (
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            className="rounded-md bg-blue-700 px-5 py-2 font-semibold text-white hover:bg-blue-800"
          >
            Submit & see score ({answered}/{prep.practice.length} answered)
          </button>
        ) : (
          <button type="button" onClick={reset} className="rounded-md border border-blue-700 px-5 py-2 font-semibold text-blue-700 hover:bg-blue-50">
            Try again
          </button>
        )}
      </div>

      {result && (
        <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-4" role="status">
          <p className="text-lg font-bold text-green-900">
            Your score: {result.score} / {result.maxScore}
          </p>
          <p className="text-sm text-green-900">
            Correct: {result.correct} · Wrong: {result.wrong} · Not attempted: {result.skipped}
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Scored with the {examName} marking scheme. Review the explanations above, then take a full mock test below.
          </p>
        </div>
      )}
    </div>
  );
}
