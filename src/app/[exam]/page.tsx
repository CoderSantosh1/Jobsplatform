import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import ExamUpdates from "@/components/quiz/ExamUpdates";
import { QuizGrid } from "@/components/quiz/QuizCard";
import { EXAMS, getExam } from "@/lib/exams";
import { searchPosts } from "@/lib/content";
import { findQuizzes } from "@/lib/quizzes";
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
  return pageMetadata({
    title: `${exam.name} 2026: Notification, Admit Card, Result`,
    description: `${exam.name} 2026: latest notification, admit card, answer key, result and free ${exam.name} mock tests in one place. ${exam.about}`,
    path: `/${exam.slug}`,
  });
}

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function ExamPage({ params }: Props) {
  const exam = getExam((await params).exam);
  if (!exam) notFound();

  const pattern = exam.search.split(/\s+/).map(escapeRegex).join(".*");
  const [posts, quizzes] = await Promise.all([
    searchPosts(exam.search, 6),
    findQuizzes(
      { $or: [{ subcategory: { $regex: pattern, $options: "i" } }, { title: { $regex: pattern, $options: "i" } }] },
      8,
    ),
  ]);

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ name: exam.name, href: `/${exam.slug}` }]} />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {exam.name} 2026 – Notification, Admit Card, Result &amp; Mock Test
        </h1>
        <section className="mt-3 bg-white rounded border p-4">
          <h2 className="text-lg font-bold text-red-800 mb-1">About {exam.name}</h2>
          <p className="text-gray-800">{exam.about}</p>
          <p className="mt-2 text-sm text-gray-600">
            Conducting body: {exam.body}. Syllabus, exam pattern, cut-off and important dates change every year;
            always confirm them in the latest official notification linked from the posts below.
          </p>
        </section>

        <ExamUpdates name={exam.name} posts={posts} />

        {quizzes.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-amber-900 mb-3">Free {exam.name} Mock Tests</h2>
            <QuizGrid quizzes={quizzes} />
          </section>
        )}

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
