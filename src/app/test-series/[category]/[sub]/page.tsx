import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { QuizGrid } from "@/components/quiz/QuizCard";
import { QuizUserBar } from "@/components/quiz/QuizClientBits";
import ExamUpdates from "@/components/quiz/ExamUpdates";
import { findCategory, findSeriesQuizzes, sampleQuestions } from "@/lib/quizzes";
import { searchPosts } from "@/lib/content";
import { EXAMS } from "@/lib/exams";
import { getExamPrep } from "@/lib/exam-prep";
import { faqJsonLd } from "@/lib/faq";
import { SITE_URL, clip, formatDate, pageMetadata } from "@/lib/seo";
import { quizPath } from "@/lib/slug";
import { isTestSeriesExcludedFromSitemap, isTestSeriesNoindex } from "@/lib/test-series-seo";
import {
  num,
  rangeText,
  seriesDescription,
  seriesFaqs,
  seriesIntro,
  seriesStats,
  seriesTitle,
  stageTotals,
} from "@/lib/test-series-content";

export const revalidate = 600;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ category: string; sub: string }> };

/** The exam landing page (/<slug>) mapped to this test-series page, if any. */
function examFor(categorySlug: string, subSlug: string) {
  return EXAMS.find((e) => e.testSeries?.category === categorySlug && e.testSeries?.sub === subSlug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, sub } = await params;
  const found = await findCategory(category, sub);
  if (!found?.sub) return { title: "Mock Test", robots: { index: false } };
  const { category: c, sub: s } = found;
  const path = `/test-series/${c.slug}/${s.slug}`;
  const stats = seriesStats(await findSeriesQuizzes(c.name, s.name));
  return pageMetadata({
    title: seriesTitle(s.name, stats.tests || s.count),
    description: seriesDescription(s.name, c.name, stats),
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

  const quizzes = await findSeriesQuizzes(c.name, s.name);
  const [samples, posts] = await Promise.all([
    quizzes[0] ? sampleQuestions(quizzes[0]._id, 4) : Promise.resolve([]),
    searchPosts(s.name, 4),
  ]);

  const stats = seriesStats(quizzes);
  const latestLabel = stats.latest ? formatDate(stats.latest) : undefined;
  const exam = examFor(c.slug, s.slug);
  const prep = exam ? getExamPrep(exam.slug) : undefined;
  const stage = prep?.stages.find((st) => st.rows?.length);
  const totals = stage ? stageTotals(stage) : null;
  const postTitles = Object.values(posts)
    .flat()
    .map((p) => p.title);
  const faqs = seriesFaqs({ name: s.name, stats, latestLabel, prep, postTitles });
  const faqData = faqJsonLd(faqs);

  // Other exams in this category, so readers (and crawlers) reach them from here. Hidden or merged pages are skipped.
  const others = c.subcategories
    .filter((x) => x.slug !== s.slug && x.count > 0 && !isTestSeriesExcludedFromSitemap(`/test-series/${c.slug}/${x.slug}`))
    .slice(0, 12);

  const glance: [string, string][] = [
    ["Free mock tests", num(stats.tests)],
    ["Total questions", stats.totalQuestions ? num(stats.totalQuestions) : ""],
    ["Questions per test", rangeText(stats.questions)],
    ["Time per test", rangeText(stats.minutes) ? `${rangeText(stats.minutes)} minutes` : ""],
    ["Marks per test", rangeText(stats.marks)],
    ["Newest test added", latestLabel ?? ""],
  ].filter((row): row is [string, string] => !!row[1]);

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
        {faqData && <JsonLd data={faqData} />}
        <h1 className="text-2xl md:text-4xl font-bold text-amber-900">{s.name} Mock Test 2026 – Free Online Test Series</h1>
        <p className="mt-2 text-amber-900 max-w-4xl">{seriesIntro(s.name, stats, latestLabel)}</p>

        {glance.length > 0 && (
          <section className="mt-5 max-w-2xl" aria-labelledby="glance">
            <h2 id="glance" className="sr-only">
              {s.name} test series at a glance
            </h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {glance.map(([label, value]) => (
                <div key={label} className="bg-white rounded-lg border border-amber-200 px-3 py-2">
                  <dt className="text-xs text-amber-800">{label}</dt>
                  <dd className="text-lg font-bold text-amber-950">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="mt-6">
          <h2 className="text-xl font-bold text-amber-900 mb-3">All {s.name} Mock Tests</h2>
          <QuizGrid quizzes={quizzes} />
        </section>

        {exam && (
          <section className="mt-8 bg-white rounded-xl border border-amber-200 p-4">
            <h2 className="text-xl font-bold text-amber-900 mb-2">About the {exam.name} Exam</h2>
            <p className="text-gray-800">{exam.about}</p>
            <p className="mt-1 text-sm text-gray-600">Conducting body: {exam.body}</p>
            {stage && stage.rows && (
              <>
                <h3 className="mt-4 font-bold text-amber-900">
                  {exam.name} Exam Pattern – {stage.name}
                </h3>
                <div className="mt-2 overflow-x-auto">
                  <table className="min-w-[420px] text-sm border border-amber-200">
                    <thead className="bg-amber-100 text-amber-950">
                      <tr>
                        <th className="px-3 py-2 text-left">Section</th>
                        <th className="px-3 py-2 text-left">Questions</th>
                        <th className="px-3 py-2 text-left">Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stage.rows.map((r) => (
                        <tr key={r.section} className="border-t border-amber-100">
                          <td className="px-3 py-2">{r.section}</td>
                          <td className="px-3 py-2">{r.questions}</td>
                          <td className="px-3 py-2">{r.marks}</td>
                        </tr>
                      ))}
                      {totals && (
                        <tr className="border-t border-amber-200 font-semibold">
                          <td className="px-3 py-2">Total{stage.duration ? ` (${stage.duration})` : ""}</td>
                          <td className="px-3 py-2">{totals.questions}</td>
                          <td className="px-3 py-2">{totals.marks}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-sm text-gray-600">{prep!.markingNote} Confirm the pattern in the latest official notification.</p>
              </>
            )}
            <p className="mt-3">
              <Link href={`/${exam.slug}`} className="font-semibold text-blue-700 hover:underline">
                {exam.name} syllabus, exam pattern and free practice set →
              </Link>
            </p>
          </section>
        )}

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

        {faqs.length > 0 && (
          <section className="mt-8 bg-white rounded-xl border border-amber-200 p-4">
            <h2 className="text-xl font-bold text-amber-900 mb-3">{s.name} Mock Test – FAQs</h2>
            <div className="space-y-4">
              {faqs.map((f) => (
                <div key={f.q}>
                  <h3 className="font-semibold text-gray-900">{f.q}</h3>
                  <p className="text-gray-700">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {others.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-amber-900 mb-3">Other {c.name} Mock Tests</h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((x) => (
                <li key={x.slug}>
                  <Link
                    href={`/test-series/${c.slug}/${x.slug}`}
                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3 py-2 text-blue-800 hover:bg-amber-50"
                  >
                    <span>{x.name} Mock Test</span>
                    <span className="text-xs text-gray-500">{x.count} tests</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              <Link href={`/test-series/${c.slug}`} className="text-sm font-semibold text-blue-700 hover:underline">
                All {c.name} test series →
              </Link>
            </p>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
