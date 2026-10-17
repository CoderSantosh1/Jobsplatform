import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { QuizGrid } from "@/components/quiz/QuizCard";
import { QuizUserBar } from "@/components/quiz/QuizClientBits";
import { findQuizzes, getCategoryGroups } from "@/lib/quizzes";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 600;

export const metadata = pageMetadata({
  title: "Free Mock Test & Test Series 2026 – Hindi & English",
  description:
    "Attempt free online mock tests and test series for SSC GD, CGL, Railway, Bank, Police and State exams in Hindi and English.",
  path: "/quizzes",
});

/** Hub page: categories with counts plus the newest tests. Full lists live on /test-series/... pages. */
export default async function QuizzesPage() {
  const [groups, latest] = await Promise.all([getCategoryGroups(), findQuizzes({}, 24)]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Header />
      <QuizUserBar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ name: "Free Mock Tests", href: "/quizzes" }]} />
        <h1 className="text-2xl md:text-4xl font-bold text-amber-900">Free Mock Tests &amp; Test Series</h1>
        <p className="mt-2 text-amber-900 max-w-4xl">
          Practise with free online mock tests for SSC, Railway, Bank, Police, Defence and State exams. Every test
          follows the real exam pattern, has a timer and shows your score with answers at the end. Pick your exam
          below to see all its tests.
        </p>

        <section className="mt-6">
          <h2 className="text-xl font-bold text-amber-900 mb-3">Choose Your Exam</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <div key={g.slug} className="bg-white rounded-xl border border-amber-200 p-4">
                <h3 className="font-bold text-amber-900">
                  <Link href={`/test-series/${g.slug}`} className="hover:underline">
                    {g.name} Test Series
                  </Link>{" "}
                  <span className="text-sm font-normal text-gray-500">({g.count} tests)</span>
                </h3>
                {g.subcategories.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                    {g.subcategories.slice(0, 8).map((s) => (
                      <li key={s.slug}>
                        <Link
                          href={`/test-series/${g.slug}/${s.slug}`}
                          className="inline-block rounded-full bg-amber-100 text-amber-900 px-3 py-1 hover:bg-amber-200"
                        >
                          {s.name} ({s.count})
                        </Link>
                      </li>
                    ))}
                    {g.subcategories.length > 8 && (
                      <li>
                        <Link href={`/test-series/${g.slug}`} className="inline-block px-3 py-1 text-blue-700 hover:underline">
                          +{g.subcategories.length - 8} more
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-amber-900 mb-3">Latest Mock Tests</h2>
          <QuizGrid quizzes={latest} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
