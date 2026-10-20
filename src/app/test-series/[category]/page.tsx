import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { QuizGrid } from "@/components/quiz/QuizCard";
import { QuizUserBar } from "@/components/quiz/QuizClientBits";
import ExamUpdates from "@/components/quiz/ExamUpdates";
import { findCategory, findQuizzes } from "@/lib/quizzes";
import { searchPosts } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 600;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const found = await findCategory(category);
  if (!found) return { title: "Test Series", robots: { index: false } };
  const { category: c } = found;
  return pageMetadata({
    title: `${c.name} Test Series 2026 – ${c.count} Free Mock Tests`,
    description: `Free ${c.name} mock tests online: ${c.subcategories
      .slice(0, 5)
      .map((s) => s.name)
      .join(", ")} and more. Timed tests with score and answers.`,
    path: `/test-series/${c.slug}`,
  });
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const found = await findCategory(category);
  if (!found) notFound();
  const c = found.category;
  // A category with a single exam would duplicate that exam's page; send visitors and Google there.
  if (c.subcategories.length === 1) permanentRedirect(`/test-series/${c.slug}/${c.subcategories[0].slug}`);
  const [quizzes, posts] = await Promise.all([findQuizzes({ category: c.name }, 24), searchPosts(c.name, 4)]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Header />
      <QuizUserBar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ name: "Free Mock Tests", href: "/quizzes" }, { name: c.name, href: `/test-series/${c.slug}` }]} />
        <h1 className="text-2xl md:text-4xl font-bold text-amber-900">{c.name} Test Series 2026 – Free Mock Tests</h1>
        <p className="mt-2 text-amber-900 max-w-4xl">
          {c.count} free {c.name} mock tests are available, grouped by exam below. Each test has a timer, follows the
          latest exam pattern and shows your score with the correct answers when you submit. Choose an exam to see
          all of its tests and sample questions.
        </p>

        {c.subcategories.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xl font-bold text-amber-900 mb-3">{c.name} Exams</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {c.subcategories.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/test-series/${c.slug}/${s.slug}`}
                    className="flex justify-between bg-white rounded-lg border border-amber-200 px-4 py-3 hover:border-amber-400"
                  >
                    <span className="font-semibold text-amber-900">{s.name} Mock Test</span>
                    <span className="text-sm text-gray-500">{s.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-xl font-bold text-amber-900 mb-3">Latest {c.name} Mock Tests</h2>
          <QuizGrid quizzes={quizzes} />
        </section>

        <ExamUpdates name={c.name} posts={posts} />
      </main>
      <Footer />
    </div>
  );
}
