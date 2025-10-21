// app/page.tsx
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/ui/AnnouncementBar";
import Iconsocialmedia from "@/components/ui/iconsocialmedia";
import Link from "next/link";
import React from "react";
import ChipsScroller from "@/components/ChipsScroller"; // client interactive chips (optional)
import ImgClient from "@/components/ImgClient"; // client image fallback (optional)

/* ---------- Types ---------- */
interface Subcategory {
  _id?: string;
  name: string;
  icon?: string;
}
interface Category {
  _id?: string;
  name: string;
  icon?: string;
  subcategories: Subcategory[];
}

interface Job {
  _id: string;
  title: string;
  organization?: string;
  postedDate?: string;
}
interface Result {
  _id: string;
  title: string;
  organization?: string;
  resultDate?: string;
}
interface AdmitCard {
  _id: string;
  title: string;
  organization?: string;
  applicationDeadline?: string;
}
interface News {
  _id: string;
  title: string;
  organization?: string;
  content?: string;
  postedDate?: string;
}
interface AnswerKey {
  _id: string;
  title: string;
  organization?: string;
  content?: string;
  postedDate?: string;
}
interface Admission {
  _id: string;
  title: string;
  organization?: string;
  content?: string;
  postedDate?: string;
}
interface Quiz {
  _id: string;
  title: string;
  description?: string;
  createdAt?: string;
}

/* ---------- Robust fetch helper (server-side) ---------- */
async function fetchJSON(path: string) {
  // Build absolute base URL from env (priority: NEXT_PUBLIC_SITE_URL -> VERCEL envs -> localhost)
  let base = process.env.NEXT_PUBLIC_SITE_URL || "";
  if (!base) {
    const vercelUrl =
      process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL || "";
    if (vercelUrl)
      base = vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
  }
  if (!base) base = "http://localhost:3000";

  const url = new URL(path, base).toString();
  // DEBUG log (check server logs / deployment logs)
  console.log("[fetchJSON] fetching ->", url);

  try {
    // Adjust revalidate or cache policy as needed
    const res = await fetch(url, { next: { revalidate: 60 } });
    console.log("[fetchJSON] status", res.status, res.statusText);

    const ct = res.headers.get("content-type") || "";
    const text = await res.text();

    // If response is not JSON (HTML error page / redirect), log snippet and return fallback
    if (!ct.includes("application/json")) {
      console.warn("[fetchJSON] response not JSON, content-type:", ct);
      console.warn("[fetchJSON] snippet:", text.slice(0, 400));
      return { data: [] };
    }

    try {
      const json = JSON.parse(text);
      return json;
    } catch (err) {
      console.error("[fetchJSON] JSON parse error:", err);
      console.warn("[fetchJSON] response snippet:", text.slice(0, 400));
      return { data: [] };
    }
  } catch (err) {
    console.error("[fetchJSON] fetch failed:", err);
    return { data: [] };
  }
}

/* ---------- Page (server component) ---------- */
export default async function Home() {
  // Parallel server-side fetches
  const [
    jobsData,
    resultsData,
    admitCardsData,
    newsData,
    answerKeysData,
    admissionsData,
    quizzesData,
    categoriesData,
  ] = await Promise.all([
    fetchJSON("/api/jobs"),
    fetchJSON("/api/results"),
    fetchJSON("/api/admit-cards"),
    fetchJSON("/api/news"),
    fetchJSON("/api/answer-keys"),
    fetchJSON("/api/admissions"),
    fetchJSON("/api/quizzes"),
    fetchJSON("/api/quiz-categories"),
  ]);

  // Normalize results (handle { data: [...] } or direct array)
  const jobs: Job[] = Array.isArray(jobsData?.data)
    ? jobsData.data
    : Array.isArray(jobsData)
    ? jobsData
    : [];
  const results: Result[] = Array.isArray(resultsData?.data)
    ? resultsData.data
    : Array.isArray(resultsData)
    ? resultsData
    : [];
  const admitCards: AdmitCard[] = Array.isArray(admitCardsData?.data)
    ? admitCardsData.data
    : Array.isArray(admitCardsData)
    ? admitCardsData
    : [];
  const news: News[] = Array.isArray(newsData?.data)
    ? newsData.data
    : Array.isArray(newsData)
    ? newsData
    : [];
  const answerKeys: AnswerKey[] = Array.isArray(answerKeysData?.data)
    ? answerKeysData.data
    : Array.isArray(answerKeysData)
    ? answerKeysData
    : [];
  const admissions: Admission[] = Array.isArray(admissionsData?.data)
    ? admissionsData.data
    : Array.isArray(admissionsData)
    ? admissionsData
    : [];
  const quizzes: Quiz[] = Array.isArray(quizzesData?.data)
    ? quizzesData.data
    : Array.isArray(quizzesData)
    ? quizzesData
    : [];
  const categories: Category[] = Array.isArray(categoriesData?.data)
    ? categoriesData.data
    : Array.isArray(categoriesData)
    ? categoriesData
    : [];

  // Fallback small demo data if APIs failed (so page doesn't render empty)
  const demoJob: Job = {
    _id: "demo-job",
    title: "Demo Job - Example",
    organization: "SarkariResultsNow",
    postedDate: new Date().toISOString(),
  };
  const demoResult: Result = {
    _id: "demo-result",
    title: "Demo Result - Example",
    organization: "SarkariResultsNow",
    resultDate: new Date().toISOString(),
  };
  const safeJobs = jobs.length ? jobs : [demoJob];
  const safeResults = results.length ? results : [demoResult];

  // Build small FAQ schema (server-side)
  const faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How to check Sarkari results?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Visit the Results section and click the relevant exam link to download the PDF.",
        },
      },
      {
        "@type": "Question",
        name: "How to download admit card?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Go to Admit Cards section, find your exam and click the Download button.",
        },
      },
    ],
  };

  // Top items for marquee
  const topItems = ([] as any[]).concat(
    safeResults.slice(0, 5),
    safeJobs.slice(0, 5),
    admitCards.slice(0, 5)
  );

  return (
    <>
      <Header />
      <Iconsocialmedia />

      <div className="bg-white min-h-screen">
        <main className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-2 sm:px-4">
          <div className="w-full space-y-6 py-4">
            <div className="bg-white min-h-screen">
              <div className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-2 sm:px-4">
                <div className="w-full space-y-6 py-4">
                  {/* MARQUEE / TOP LINKS (server-rendered) */}
                  <div className="w-full overflow-hidden">
                    <div className="inline-block whitespace-nowrap text-sm sm:text-base">
                      {topItems.map((item, idx) => {
                        const linkText =
                          item?.organization || item?.title || "Update";
                        const linkPath = item?.resultDate
                          ? `/results/${item._id}`
                          : item?.postedDate
                          ? `/jobs/${item._id}`
                          : item?.applicationDeadline
                          ? `/admit-cards/${item._id}`
                          : "#";
                        return (
                          <span key={idx} className="mr-3">
                            <a
                              href={linkPath}
                              className="font-medium inline-block transition-colors duration-200 text-blue-600 hover:underline"
                            >
                              {linkText}
                            </a>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* MAIN TABLE: Results / Jobs / News */}
                  <div className="w-full">
                    <div className="w-full overflow-x-auto hide-scrollbar">
                      <table className="w-full table-fixed border-collapse border border-orange-500 text-xs sm:text-sm md:text-base">
                        <thead>
                          <tr className="bg-red-600 text-[#FCFCD8] font-bold">
                            <th className="p-2 text-center break-words whitespace-normal w-1/3">
                              Result
                            </th>
                            <th className="p-2 text-center break-words whitespace-normal w-1/3">
                              Latest Jobs
                            </th>
                            <th className="p-2 text-center break-words whitespace-normal w-1/3">
                              Latest News
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({
                            length: Math.min(
                              10,
                              Math.max(
                                safeResults.length,
                                safeJobs.length,
                                news.length
                              )
                            ),
                          }).map((_, index) => (
                            <tr
                              key={index}
                              className="border-t-2 border-red-500 hover:bg-[#fdfefe]"
                            >
                              <td className="p-2 border-x text-left align-top break-words whitespace-pre-wrap">
                                {safeResults[index] ? (
                                  <a
                                    href={`/results/${safeResults[index]._id}`}
                                    className="text-[#014F59] hover:underline"
                                  >
                                    {safeResults[index].title}
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2 border-x text-left align-top break-words whitespace-pre-wrap">
                                {safeJobs[index] ? (
                                  <a
                                    href={`/jobs/${safeJobs[index]._id}`}
                                    className="text-[#014F59] hover:underline"
                                  >
                                    {safeJobs[index].title}
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2 text-left align-top break-words whitespace-pre-wrap">
                                {news[index] ? (
                                  <a
                                    href={`/news/${news[index]._id}`}
                                    className="text-[#014F59] hover:underline"
                                  >
                                    {news[index].title}
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </tr>
                          ))}
                          {(safeResults.length > 10 ||
                            safeJobs.length > 10 ||
                            news.length > 10) && (
                            <tr className="hover:bg-[#FFF8CC]">
                              <td className="text-center">
                                {safeResults.length > 5 && (
                                  <a
                                    href="/results"
                                    className="text-blue-600 font-semibold hover:underline"
                                  >
                                    See More
                                  </a>
                                )}
                              </td>
                              <td className="p-2 border-x text-center">
                                {safeJobs.length > 10 && (
                                  <a
                                    href="/jobs"
                                    className="text-blue-600 font-semibold hover:underline"
                                  >
                                    See More
                                  </a>
                                )}
                              </td>
                              <td className="text-center">
                                {news.length > 10 && (
                                  <a
                                    href="/news"
                                    className="text-blue-600 font-semibold hover:underline"
                                  >
                                    See More
                                  </a>
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Admit / AnswerKey / Admission */}
                  <div className="w-full mt-6">
                    <div className="w-full overflow-x-auto hide-scrollbar">
                      <table className="w-full table-fixed border-collapse border border-orange-500 text-xs sm:text-sm md:text-base">
                        <thead>
                          <tr className="bg-red-600 text-[#FCFCD8] font-bold">
                            <th className="p-2 text-center">Admit Card</th>
                            <th className="p-2 text-center">Answer Key</th>
                            <th className="p-2 text-center">Admission</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({
                            length: Math.min(
                              10,
                              Math.max(
                                admitCards.length,
                                answerKeys.length,
                                admissions.length
                              )
                            ),
                          }).map((_, index) => (
                            <tr
                              key={index}
                              className="border-t-2 border-red-500 hover:bg-[#f5f7f2]"
                            >
                              <td className="p-2 border-x text-left align-top break-words whitespace-pre-wrap">
                                {admitCards[index] ? (
                                  <a
                                    href={`/admit-cards/${admitCards[index]._id}`}
                                    className="text-[#014F59] hover:underline"
                                  >
                                    {admitCards[index].title}
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2 border-x text-left align-top break-words whitespace-pre-wrap">
                                {answerKeys[index] ? (
                                  <a
                                    href={`/answer-keys/${answerKeys[index]._id}`}
                                    className="text-[#014F59] hover:underline"
                                  >
                                    {answerKeys[index].title}
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2 text-left align-top break-words whitespace-pre-wrap">
                                {admissions[index] ? (
                                  <a
                                    href={`/admissions/${admissions[index]._id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#014F59] hover:underline"
                                  >
                                    {admissions[index].title}
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </tr>
                          ))}
                          {(admitCards.length > 10 ||
                            answerKeys.length > 10 ||
                            admissions.length > 10) && (
                            <tr className="hover:bg-[#FFF8CC]">
                              <td className="text-center">
                                {admitCards.length > 10 && (
                                  <a
                                    href="/admit-cards"
                                    className="text-blue-600 font-semibold hover:underline"
                                  >
                                    See More
                                  </a>
                                )}
                              </td>
                              <td className="p-2 border-x text-center">
                                {answerKeys.length > 10 && (
                                  <a
                                    href="/answer-keys"
                                    className="text-blue-600 font-semibold hover:underline"
                                  >
                                    See More
                                  </a>
                                )}
                              </td>
                              <td className="text-center">
                                {admissions.length > 10 && (
                                  <a
                                    href="/admissions"
                                    className="text-blue-600 font-semibold hover:underline"
                                  >
                                    See More
                                  </a>
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Exams section */}
          <section className="relative px-4 w-full max-w-screen overflow-x-hidden ">
            <h2 className="text-2xl font-bold mb-2 text-[#1a124d]">
              Popular Exams
            </h2>
            <p className="text-[#1a124d] text-sm sm:text-base mb-4">
              Get exam-ready with concepts, questions and study notes as per the
              latest pattern
            </p>

            {categories.length > 0 ? (
              <ChipsScroller categories={categories} defaultIndex={0} />
            ) : (
              <div className="flex gap-3">
                <a
                  href="/quizzes"
                  className="shrink-0 rounded-full border px-4 py-2 text-sm"
                >
                  Explore all exams
                </a>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(categories?.[0]?.subcategories || []).map((exam: any) => (
                <Link
                  key={exam._id || exam.name}
                  href={`/quizzes?category=${encodeURIComponent(
                    categories?.[0]?.name || ""
                  )}&subcategory=${encodeURIComponent(exam.name)}`}
                  className="group flex items-center justify-between rounded-xl border bg-white px-4 py-4 shadow-sm hover:shadow transition"
                >
                  <div className="flex items-center gap-3">
                    <ImgClient
                      src={exam.icon}
                      alt={exam.name}
                      className="w-9 h-9 rounded object-contain bg-white"
                    />
                    <span className="font-semibold text-gray-900">
                      {exam.name}
                    </span>
                  </div>
                </Link>
              ))}

              <Link
                href="/quizzes"
                className="flex items-center justify-center rounded-xl border bg-white px-4 py-4 shadow-sm hover:shadow transition text-cyan-700 font-semibold"
              >
                Explore all exams
              </Link>
            </div>
          </section>
        </main>
      </div>

      {/* Announcement Bars */}
      <div className="bg-[#FFF] mb-4">
        <div className="flex flex-col items-center justify-center bg-[#f5f7f2] w-full max-w-7xl mx-auto px-4">
          <AnnouncementBar title="Sarkari Results Now Latest Job">
            Latest job notifications, admit cards and result updates curated
            daily for aspirants.
          </AnnouncementBar>

          <AnnouncementBar title="Sarkari Results">
            SarkariResultsNow provides verified government job notifications,
            admit cards, and exam results. Bookmark for regular updates.
          </AnnouncementBar>
        </div>
      </div>

      <Footer />

      {/* JSON-LD for FAQ (server side) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }}
      />
    </>
  );
}
