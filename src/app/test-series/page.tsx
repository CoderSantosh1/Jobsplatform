import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { QuizUserBar } from "@/components/quiz/QuizClientBits";
import { categoryHref, getCategoryGroups } from "@/lib/quizzes";
import { SITE_URL, pageMetadata } from "@/lib/seo";

export const revalidate = 600;

export const metadata = pageMetadata({
  title: "All Test Series 2026 – Free Mock Tests by Exam",
  description:
    "Complete A–Z list of free online test series on Sarkari Results Now: SSC, Railway, Bank, Police, Teaching, State exams and more, with the number of mock tests for each exam.",
  path: "/test-series",
});

/** Directory of every test series (category → exams). /quizzes shows the newest tests instead. */
export default async function TestSeriesIndexPage() {
  const groups = [...(await getCategoryGroups())].sort((a, b) => a.name.localeCompare(b.name, "en"));
  const totalTests = groups.reduce((n, g) => n + g.count, 0);
  const totalExams = groups.reduce((n, g) => n + Math.max(g.subcategories.length, 1), 0);
  const letters = [...new Set(groups.map((g) => g.name.charAt(0).toUpperCase()).filter((c) => /[A-Z]/.test(c)))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Header />
      <QuizUserBar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ name: "Test Series", href: "/test-series" }]} />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "All Test Series",
            numberOfItems: groups.length,
            itemListElement: groups.map((g, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: `${g.name} Test Series`,
              url: `${SITE_URL}${categoryHref(g)}`,
            })),
          }}
        />
        <h1 className="text-2xl md:text-4xl font-bold text-amber-900">All Test Series 2026 – Free Mock Tests by Exam</h1>
        <p className="mt-2 text-amber-900 max-w-4xl">
          Sarkari Results Now has {totalTests} free mock tests across {totalExams} exams in {groups.length} test series.
          Each test has a timer, follows the exam pattern and shows your score with the correct answers when you submit.
          Pick a test series below to see every test for that exam, or see the{" "}
          <Link href="/quizzes" className="text-blue-700 underline">
            newest mock tests
          </Link>
          .
        </p>

        {letters.length > 1 && (
          <nav aria-label="Jump to letter" className="mt-4 flex flex-wrap gap-2 text-sm">
            {letters.map((l) => (
              <a key={l} href={`#letter-${l}`} className="rounded border border-amber-300 bg-white px-2 py-1 text-amber-900 hover:bg-amber-100">
                {l}
              </a>
            ))}
          </nav>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g, i) => {
            const letter = g.name.charAt(0).toUpperCase();
            const firstOfLetter = i === 0 || groups[i - 1].name.charAt(0).toUpperCase() !== letter;
            return (
              <section
                key={g.slug}
                id={firstOfLetter && /[A-Z]/.test(letter) ? `letter-${letter}` : undefined}
                className="bg-white rounded-xl border border-amber-200 p-4 scroll-mt-4"
              >
                <h2 className="text-lg font-bold text-amber-900">
                  <Link href={categoryHref(g)} className="hover:underline">
                    {g.name} Test Series
                  </Link>{" "}
                  <span className="text-sm font-normal text-gray-500">({g.count} tests)</span>
                </h2>
                {g.subcategories.length > 1 && (
                  <ul className="mt-2 space-y-1 text-sm">
                    {g.subcategories.map((s) => (
                      <li key={s.slug} className="flex justify-between gap-2">
                        <Link href={`/test-series/${g.slug}/${s.slug}`} className="text-blue-700 hover:underline">
                          {s.name} Mock Test
                        </Link>
                        <span className="text-gray-500">{s.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
        {groups.length === 0 && <p className="text-center text-amber-800 py-10">New test series are coming soon.</p>}
      </main>
      <Footer />
    </div>
  );
}
