import Link from "next/link";
import { Award, Clock, ListChecks } from "lucide-react";
import { QuizCardAction } from "./QuizClientBits";
import type { QuizSummary } from "@/lib/quizzes";
import { shortQuizTitle } from "@/lib/quiz-format";
import { quizPath } from "@/lib/slug";

function Stat({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </span>
  );
}

/** Compact quiz card: exam tag, short title, three key numbers and one clear action. */
export default function QuizCard({ quiz }: { quiz: QuizSummary }) {
  const href = quizPath(quiz);
  const tag = quiz.subcategory || quiz.category;
  return (
    <li className="group relative flex flex-col rounded-xl border border-amber-200 bg-white p-4 shadow-sm transition hover:border-amber-400 hover:shadow-md">
      {tag && (
        <span className="self-start rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">{tag}</span>
      )}
      <h3 className="mt-2 text-lg font-bold leading-snug text-gray-900">
        {/* The link covers the whole card; the full title stays available to screen readers and on hover. */}
        <Link href={href} title={quiz.title} className="after:absolute after:inset-0 after:rounded-xl focus:outline-none">
          <span className="sr-only">{quiz.title}</span>
          <span aria-hidden="true">{shortQuizTitle(quiz.title, quiz.subcategory)}</span>
        </Link>
      </h3>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Stat icon={ListChecks}>{quiz.questionCount} Qs</Stat>
        {quiz.totalMarks > 0 && <Stat icon={Award}>{quiz.totalMarks} Marks</Stat>}
        {quiz.timeLimit > 0 && <Stat icon={Clock}>{quiz.timeLimit} Min</Stat>}
      </div>
      {/* "Already taken · Best 14/20" and Start / Start again, for the signed-in visitor. */}
      <QuizCardAction quizId={quiz._id} />
    </li>
  );
}

export function QuizGrid({ quizzes }: { quizzes: QuizSummary[] }) {
  if (!quizzes.length) return <p className="text-center text-amber-800 py-10">New mock tests are coming soon.</p>;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {quizzes.map((q) => (
        <QuizCard key={q._id} quiz={q} />
      ))}
    </ul>
  );
}
