import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { QuizGrid } from "@/components/quiz/QuizCard";
import { QuizUserBar } from "@/components/quiz/QuizClientBits";
import ExamUpdates from "@/components/quiz/ExamUpdates";
import { findCategory, findQuizzes, sampleQuestions } from "@/lib/quizzes";
import { searchPosts } from "@/lib/content";
import { SITE_URL, clip, pageMetadata } from "@/lib/seo";
import { quizPath } from "@/lib/slug";
import { isTestSeriesNoindex } from "@/lib/test-series-seo";

export const revalidate = 600;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ category: string; sub: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, sub } = await params;
  const found = await findCategory(category, sub);
  if (!found?.sub) return { title: "Mock Test", robots: { index: false } };
  const { category: c, sub: s } = found;
  const path = `/test-series/${c.slug}/${s.slug}`;
  return pageMetadata({
    title: `${s.name} Mock Test 2026 – ${s.count} Free Tests`,
    description: `Attempt ${s.count} free ${s.name} mock tests online. Timed practice sets based on the latest ${s.name} exam pattern with score and answers, part of the ${c.name} test series.`,
    path,
    noIndex: isTestSeriesNoindex(path),
  });
}

export default async function SubcategoryPage({ params }: Props) {
  const { category, sub } = await params;
  const found = await findCategory(category, sub);
  if (!found?.sub) notFound();
  const { category: c, sub: s } = found;
  const path = `/test-series/${c.slug}/${s.slug}`;

  const quizzes = await findQuizzes({ category: c.name, subcategory: s.name });
  const [samples, posts] = await Promise.all([
    quizzes[0] ? sampleQuestions(quizzes[0]._id, 4) : Promise.resolve([]),
    searchPosts(s.name, 4),
  ]);
  const avgQuestions = quizzes.length
    ? Math.round(quizzes.reduce((n, q) => n + q.questionCount, 0) / quizzes.length)
    : 0;
  const avgMinutes = quizzes.length ? Math.round(quizzes.reduce((n, q) => n + (q.timeLimit || 0), 0) / quizzes.length) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Header />
      <QuizUserBar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs
          items={[
            { name: "Test Series", href: "/test-series" },
            { name: c.name, href: `/test-series/${c.slug}` },
            { name: s.name, href: path },
          ]}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `${s.name} Mock Tests`,
            itemListElement: quizzes.slice(0, 50).map((q, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_URL}${quizPath(q)}`,
              name: q.title,
            })),
          }}
        />
        <h1 className="text-2xl md:text-4xl font-bold text-amber-900">{s.name} Mock Test 2026 – Free Online Test Series</h1>
        <p className="mt-2 text-amber-900 max-w-4xl">
          This page lists all {quizzes.length} free {s.name} mock tests on Sarkari Results Now.
          {avgQuestions > 0 && ` A typical test has about ${avgQuestions} questions`}
          {avgMinutes > 0 && ` with a ${avgMinutes}-minute timer`}
          {avgQuestions > 0 && "."} Tests follow the latest {s.name} exam pattern and are free to
          attempt. Attempt them in order, review the answers after each test and track your progress to find weak
          topics before the real exam.
        </p>

        <section className="mt-6">
          <h2 className="text-xl font-bold text-amber-900 mb-3">All {s.name} Mock Tests</h2>
          <QuizGrid quizzes={quizzes} />
        </section>

        {samples.length > 0 && (
          <section className="mt-8 bg-white rounded-xl border border-amber-200 p-4">
            <h2 className="text-xl font-bold text-amber-900 mb-3">Sample {s.name} Questions</h2>
            <ol className="list-decimal pl-6 space-y-3">
              {samples.map((q) => (
                <li key={q._id}>
                  <p className="font-medium">{clip(q.text, 400)}</p>
                  {q.options && q.options.length > 0 && (
                    <ol className="list-[upper-alpha] pl-6 text-sm text-gray-700">
                      {q.options.map((o, i) => (
                        <li key={i}>{clip(o, 200)}</li>
                      ))}
                    </ol>
                  )}
                </li>
              ))}
            </ol>
            <p className="mt-3 text-sm text-gray-600">Attempt the full test above to see the correct answers.</p>
          </section>
        )}

        <ExamUpdates name={s.name} posts={posts} />
      </main>
      <Footer />
    </div>
  );
}
