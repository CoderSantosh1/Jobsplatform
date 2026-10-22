import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import ExamUpdates from "@/components/quiz/ExamUpdates";
import { QuizGrid } from "@/components/quiz/QuizCard";
import PracticeSet from "@/components/exam/PracticeSet";
import { EXAMS, getExam } from "@/lib/exams";
import { getExamContent } from "@/lib/exam-content";
import { getExamPrep, type ExamStage } from "@/lib/exam-prep";
import { pageMetadata } from "@/lib/seo";

// Only the exams in EXAMS get a page; any other top-level path is a normal 404.
export const dynamicParams = false;
export const revalidate = 600;

export function generateStaticParams() {
  return EXAMS.map((e) => ({ exam: e.slug }));
}

type Props = { params: Promise<{ exam: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const exam = getExam((await params).exam);
  if (!exam) return {};
  const prep = getExamPrep(exam.slug);
  const { hasContent } = await getExamContent(exam);
  if (prep) {
    return pageMetadata({
      title: `${exam.name} Mock Test 2026: Free Practice Set, Syllabus & Exam Pattern`,
      description: `Free ${exam.name} practice questions with answers and explanations, instant score, full syllabus and exam pattern, plus free ${exam.name} mock tests, notifications and results.`,
      path: `/${exam.slug}`,
    });
  }
  return pageMetadata({
    title: `${exam.name} 2026: Notification, Admit Card, Result`,
    description: `${exam.name} 2026: latest notification, admit card, answer key, result and free ${exam.name} mock tests in one place. ${exam.about}`,
    path: `/${exam.slug}`,
    // Until the site has posts or tests for this exam the page is boilerplate; keep it out of the index.
    noIndex: !hasContent,
  });
}

function PatternStage({ stage }: { stage: ExamStage }) {
  const total =
    stage.rows && stage.rows.every((r) => typeof r.questions === "number" && typeof r.marks === "number")
      ? {
          questions: stage.rows.reduce((n, r) => n + Number(r.questions), 0),
          marks: stage.rows.reduce((n, r) => n + Number(r.marks), 0),
        }
      : null;
  return (
    <div className="mt-4">
      <h3 className="font-semibold text-gray-900">
        {stage.name}
        {stage.duration && <span className="font-normal text-gray-600"> · {stage.duration}</span>}
      </h3>
      {stage.rows && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-red-700 text-white">
                <th className="border border-red-800 px-3 py-2 text-left">Section</th>
                <th className="border border-red-800 px-3 py-2 text-right">Questions</th>
                <th className="border border-red-800 px-3 py-2 text-right">Marks</th>
              </tr>
            </thead>
            <tbody>
              {stage.rows.map((r) => (
                <tr key={r.section} className="odd:bg-amber-50">
                  <td className="border px-3 py-2">{r.section}</td>
                  <td className="border px-3 py-2 text-right tabular-nums">{r.questions}</td>
                  <td className="border px-3 py-2 text-right tabular-nums">{r.marks}</td>
                </tr>
              ))}
              {total && stage.rows.length > 1 && (
                <tr className="font-semibold">
                  <td className="border px-3 py-2">Total</td>
                  <td className="border px-3 py-2 text-right tabular-nums">{total.questions}</td>
                  <td className="border px-3 py-2 text-right tabular-nums">{total.marks}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {stage.note && <p className="mt-2 text-sm text-gray-700">{stage.note}</p>}
    </div>
  );
}

export default async function ExamPage({ params }: Props) {
  const exam = getExam((await params).exam);
  if (!exam) notFound();

  const prep = getExamPrep(exam.slug);
  const { posts, quizzes } = await getExamContent(exam);

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ name: exam.name, href: `/${exam.slug}` }]} />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {prep
            ? `${exam.name} Mock Test 2026 – Free Practice Set, Syllabus & Exam Pattern`
            : `${exam.name} 2026 – Notification, Admit Card, Result & Mock Test`}
        </h1>

        {prep && (
          <nav aria-label="On this page" className="mt-3 flex flex-wrap gap-2 text-sm">
            {[
              ["#practice", "Free Practice Set"],
              ["#pattern", "Exam Pattern"],
              ["#syllabus", "Syllabus"],
              ...(quizzes.length > 0 ? [["#mock-tests", "Full Mock Tests"]] : []),
              ["#updates", "Latest Updates"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="rounded-full border border-blue-600 px-3 py-1 text-blue-700 hover:bg-blue-50">
                {label}
              </a>
            ))}
          </nav>
        )}

        <section className="mt-3 bg-white rounded border p-4">
          <h2 className="text-lg font-bold text-red-800 mb-1">About {exam.name}</h2>
          <p className="text-gray-800">{exam.about}</p>
          <p className="mt-2 text-sm text-gray-600">
            Conducting body: {exam.body}. Syllabus, exam pattern, cut-off and important dates change every year;
            always confirm them in the latest official notification linked from the posts below.
          </p>
        </section>

        {prep && (
          <>
            <section id="practice" className="mt-8 scroll-mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <h2 className="text-xl font-bold text-amber-900">Free {exam.name} Practice Set with Answers</h2>
              <PracticeSet examName={exam.name} prep={prep} />
            </section>

            <section id="pattern" className="mt-8 scroll-mt-4 bg-white rounded border p-4">
              <h2 className="text-xl font-bold text-red-800">{exam.name} Exam Pattern</h2>
              {prep.stages.map((stage) => (
                <PatternStage key={stage.name} stage={stage} />
              ))}
              <p className="mt-3 text-sm font-medium text-gray-800">Marking: {prep.markingNote}</p>
            </section>

            <section id="syllabus" className="mt-8 scroll-mt-4 bg-white rounded border p-4">
              <h2 className="text-xl font-bold text-red-800">{exam.name} Syllabus</h2>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {prep.syllabus.map((s) => (
                  <div key={s.section}>
                    <h3 className="font-semibold text-gray-900">{s.section}</h3>
                    <ul className="mt-1 list-disc pl-5 text-sm text-gray-800 space-y-0.5">
                      {s.topics.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {quizzes.length > 0 && (
          <section id="mock-tests" className="mt-8 scroll-mt-4">
            <h2 className="text-xl font-bold text-amber-900 mb-3">Free {exam.name} Mock Tests</h2>
            <QuizGrid quizzes={quizzes} />
          </section>
        )}

        <div id="updates" className="scroll-mt-4">
          <ExamUpdates name={exam.name} posts={posts} />
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Other Popular Exams</h2>
          <ul className="flex flex-wrap gap-2">
            {EXAMS.filter((e) => e.slug !== exam.slug).map((e) => (
              <li key={e.slug}>
                <Link href={`/${e.slug}`} className="inline-block rounded-full border px-3 py-1 text-sm text-blue-700 hover:bg-blue-50">
                  {e.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
