import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { QuizGrid } from "@/components/quiz/QuizCard";
import { QuizUserBar } from "@/components/quiz/QuizClientBits";
import { categoryHref, findQuizzes, getCategoryGroups } from "@/lib/quizzes";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 600;

export const metadata = pageMetadata({
  title: "Latest Free Mock Tests 2026 for Govt Exams",
  description:
    "Attempt free online mock tests and test series for SSC GD, CGL, Railway, Bank, Police and State exams, with a timer, score and answers.",
  path: "/quizzes",
});

/** Newest mock tests plus quick links to each test series. The full directory is /test-series. */
export default async function QuizzesPage() {
  const [groups, latest] = await Promise.all([getCategoryGroups(), findQuizzes({}, 24)]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Header />
      <QuizUserBar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ name: "Mock Tests", href: "/quizzes" }]} />
        <h1 className="text-2xl md:text-4xl font-bold text-amber-900">Latest Free Mock Tests</h1>
        <p className="mt-2 text-amber-900 max-w-4xl">
          Practise with free online mock tests for SSC, Railway, Bank, Police, Defence and State exams. Every test
          follows the real exam pattern, has a timer and shows your score with answers at the end. The newest tests are below;
          browse every exam in the <Link href="/test-series" className="text-blue-700 underline">full test series list</Link>.
        </p>

        <section className="mt-6">
          <h2 className="text-xl font-bold text-amber-900 mb-3">Test Series by Exam</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {groups.map((g) => (
              <li key={g.slug}>
                <Link
                  href={categoryHref(g)}
                  className="inline-block rounded-full bg-white border border-amber-200 text-amber-900 px-3 py-1 hover:bg-amber-100"
                >
                  {g.name} ({g.count})
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            <Link href="/test-series" className="font-semibold text-blue-700 hover:underline">
              See all test series and exams →
            </Link>
          </p>
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
