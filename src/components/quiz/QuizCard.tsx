import Link from "next/link";
import { HideIfStarted } from "./QuizClientBits";
import type { QuizSummary } from "@/lib/quizzes";
import { clip } from "@/lib/seo";
import { quizPath } from "@/lib/slug";

/** Compact quiz card: one title, a short description and the key numbers. */
export default function QuizCard({ quiz }: { quiz: QuizSummary }) {
  return (
    <HideIfStarted quizId={quiz._id}>
      <li className="bg-white border-2 border-amber-200 hover:border-amber-400 rounded-xl shadow p-4 flex flex-col">
        <h3 className="text-lg font-bold text-amber-900 leading-snug">
          <Link href={quizPath(quiz)} className="hover:underline">
            {quiz.title}
          </Link>
        </h3>
        {quiz.description && <p className="mt-1 text-sm text-amber-800">{clip(quiz.description, 140)}</p>}
        <p className="mt-3 text-sm text-gray-700">
          {quiz.questionCount} Questions · {quiz.totalMarks} Marks · {quiz.timeLimit} Minutes
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {quiz.category}
          {quiz.subcategory && ` › ${quiz.subcategory}`}
        </p>
        <Link
          href={quizPath(quiz)}
          className="mt-auto pt-3"
          aria-label={`Start ${quiz.title}`}
        >
          <span className="block w-full text-center bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-2 rounded-lg">
            Start Test
          </span>
        </Link>
      </li>
    </HideIfStarted>
  );
}

export function QuizGrid({ quizzes }: { quizzes: QuizSummary[] }) {
  if (!quizzes.length) return <p className="text-center text-amber-800 py-10">New mock tests are coming soon.</p>;
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {quizzes.map((q) => (
        <QuizCard key={q._id} quiz={q} />
      ))}
    </ul>
  );
}
