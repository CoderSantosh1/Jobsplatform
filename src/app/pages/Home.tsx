import type { ReactNode } from "react";

import Link from "next/link";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/ui/AnnouncementBar";
import Iconsocialmedia from "@/components/ui/iconsocialmedia";
import PopularExamsClient, {
  type Category,
} from "./PopularExamsClient";
import { connectToDatabase } from "@/lib/db";
import Job from "@/lib/models/Job";
import Result from "@/lib/models/Result";
import AdmitCard from "@/lib/models/AdmitCard";
import News from "@/lib/models/News";
import AnswerKey from "@/lib/models/AnswerKey";
import Admission from "@/lib/models/Admission";
import QuizCategory from "@/lib/models/QuizCategory";
import { detailPath } from "@/lib/slug";
import { PUBLIC_FILTER } from "@/lib/content";
import { pickHomeCategories } from "@/lib/home-categories";
import { isPastDeadline, parseDate } from "@/lib/seo";


interface JobItem {
  _id: string;
  title: string;
  organization: string;
  createdAt?: string;
  lastDateApplyOnline?: string;
  applicationDeadline?: string;
}

const QUICK_LINKS = [
  { href: "/jobs", label: "Latest Jobs", hint: "Govt job notifications", cls: "bg-red-600 hover:bg-red-700" },
  { href: "/results", label: "Results", hint: "Exam results & merit lists", cls: "bg-green-700 hover:bg-green-800" },
  { href: "/admit-cards", label: "Admit Cards", hint: "Download hall tickets", cls: "bg-blue-700 hover:bg-blue-800" },
  { href: "/answer-keys", label: "Answer Keys", hint: "Check your answers", cls: "bg-purple-700 hover:bg-purple-800" },
  { href: "/quizzes", label: "Free Mock Tests", hint: "Practice with timed tests", cls: "bg-amber-600 hover:bg-amber-700" },
];

interface ResultItem {
  _id: string;
  title: string;
  organization: string;
  resultDate: string;
  officalwebsites: string[];
}

interface AdmitCardItem {
  _id: string;
  title: string;
  organization: string;
  applicationDeadline: string;
}

interface NewsItem {
  _id: string;
  title: string;
  organization: string;
  content: string;
  postedDate: string;
}

interface AnswerKeyItem {
  _id: string;
  title: string;
  organization: string;
  content: string;
  postedDate: string;
}

interface AdmissionItem {
  _id: string;
  title: string;
  organization: string;
  content: string;
  postedDate: string;
}

function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

async function getHomeData() {

  await connectToDatabase();

  const [jobs, results, admitCards, news, answerKeys, admissions, categories] =
    await Promise.all([
      Job.find(PUBLIC_FILTER.jobs).sort({ createdAt: -1 }).select("_id title organization lastDateApplyOnline applicationDeadline").limit(11).lean(),
      Result.find(PUBLIC_FILTER.results).sort({ resultDate: -1 }).select("_id title organization").limit(11).lean(),
      AdmitCard.find(PUBLIC_FILTER["admit-cards"]).sort({ applicationDeadline: -1 }).select("_id title organization").limit(11).lean(),
      News.find(PUBLIC_FILTER.news).sort({ postedDate: -1 }).select("_id title organization").limit(11).lean(),
      AnswerKey.find(PUBLIC_FILTER["answer-keys"]).sort({ postedDate: -1 }).select("_id title organization").limit(11).lean(),
      Admission.find(PUBLIC_FILTER.admissions).sort({ postedDate: -1 }).select("_id title organization").limit(11).lean(),
      QuizCategory.find().lean(),
    ]);

  return {
    jobs: toPlain(jobs) as unknown as JobItem[],
    results: toPlain(results) as unknown as ResultItem[],
    admitCards: toPlain(admitCards) as unknown as AdmitCardItem[],
    news: toPlain(news) as unknown as NewsItem[],
    answerKeys: toPlain(answerKeys) as unknown as AnswerKeyItem[],
    admissions: toPlain(admissions) as unknown as AdmissionItem[],
    categories: pickHomeCategories(toPlain(categories) as unknown as Category[]),
  };
}

export default async function Home() {
  const { jobs, results, admitCards, news, answerKeys, admissions, categories } =
    await getHomeData();

  const marqueeItems = [
    ...results.slice(0, 5).map((item) => ({
      id: item._id,
      text: item.organization,
      href: detailPath("results", item),
    })),
    ...jobs.slice(0, 5).map((item) => ({
      id: item._id,
      text: item.organization,
      href: detailPath("jobs", item),
    })),
    ...admitCards.slice(0, 5).map((item) => ({
      id: item._id,
      text: item.organization,
      href: detailPath("admit-cards", item),
    })),
  ];

  const baseColors = [
    "text-red-500",
    "text-green-500",
    "text-blue-500",
    "text-yellow-500",
    "text-purple-500",
    "text-pink-500",
    "text-orange-500",
    "text-teal-500",
    "text-indigo-500",
    "text-rose-500",
  ];

  const hoverColors = [
    "hover:text-blue-500",
    "hover:text-pink-500",
    "hover:text-orange-500",
    "hover:text-purple-500",
    "hover:text-green-500",
    "hover:text-red-500",
    "hover:text-yellow-500",
    "hover:text-rose-500",
    "hover:text-teal-500",
    "hover:text-indigo-500",
  ];

  return (
    <>
      <Header />
      <Script
        id="adsbygoogle-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: "(adsbygoogle = window.adsbygoogle || []).push({});",
        }}
      />
      <div className="my-6 flex justify-center">
        <ins
          className="adsbygoogle"
          style={{ display: "block", maxWidth: "100%" }}
          data-ad-client="ca-pub-6447497690677792"
          data-ad-slot="3013342039"
          data-ad-format="auto"
          data-full-width-responsive="true"
          data-adtest="on"
        ></ins>
      </div>

      <Iconsocialmedia />
      <div className="bg-[#fff] min-h-screen">
        <main className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-2 sm:px-4">
          <div className="w-full space-y-6 py-4">
            <h1 className="text-xl md:text-2xl font-bold text-center text-gray-900">
              Sarkari Result 2026 – Latest Govt Jobs, Results, Admit Cards &amp; Free Mock Tests
            </h1>
            <nav aria-label="Main sections" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {QUICK_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-3 text-center text-white shadow transition ${l.cls} last:col-span-2 sm:last:col-span-1`}
                >
                  <span className="block text-base font-bold sm:text-lg">{l.label}</span>
                  <span className="block text-xs opacity-90">{l.hint}</span>
                </Link>
              ))}
            </nav>
            <div className="bg-[#fFfFff] min-h-screen">
              <main className="flex flex-col items-center justify-center bg-[#fFfFf] w-full max-w-7xl mx-auto px-2 sm:px-4">
                <div className="w-full space-y-6 py-4">
                  <div className="w-full overflow-hidden">
                    <div className="inline-block whitespace-nowrap animate-marquee text-sm sm:text-base">
                      {marqueeItems.reduce<ReactNode[]>((acc, item, idx) => {
                        if (idx !== 0) {
                          acc.push(
                            <span key={`sep-${idx}`} className="mx-1 text-gray-400">
                              |
                            </span>
                          );
                        }

                        acc.push(
                          <Link
                            key={`item-${item.id}`}
                            href={item.href}
                            className={`font-medium inline-block transition-colors duration-200 ${baseColors[idx % baseColors.length]} ${hoverColors[idx % hoverColors.length]}`}
                          >
                            {item.text}
                          </Link>
                        );

                        return acc;
                      }, [])}
                    </div>
                  </div>

                  <div className="w-full">
                    <div className="w-full overflow-x-auto hide-scrollbar">
                      <table className="w-full table-fixed border-collapse border border-orange-500 text-xs sm:text-sm md:text-base">
                        <thead>
                          <tr className="bg-red-600 text-[#FCFCD8] font-bold">
                            <th className="p-2 text-center break-words whitespace-normal w-1/3">Result</th>
                            <th className="p-2 text-center break-words whitespace-normal w-1/3">Latest Jobs</th>
                            <th className="p-2 text-center break-words whitespace-normal w-1/3">Latest News</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({
                            length: Math.min(10, Math.max(results.length, jobs.length, news.length)),
                          }).map((_, index) => (
                            <tr key={index} className="border-t-2 border-red-500 hover:bg-[#fdfefe]">
                              <td className="p-2 border-x text-left align-top break-words whitespace-pre-wrap">
                                {results[index] ? (
                                  <Link href={detailPath('results', results[index])} className="text-[#014F59] hover:underline hover:text-blue-800">
                                    {results[index].title}
                                  </Link>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2 border-x text-left align-top break-words whitespace-pre-wrap">
                                {jobs[index] ? (
                                  <>
                                    <Link href={detailPath('jobs', jobs[index])} className="text-[#014F59] hover:underline hover:text-blue-800">
                                      {jobs[index].title}
                                    </Link>
                                    {isPastDeadline(parseDate(jobs[index].lastDateApplyOnline) ?? parseDate(jobs[index].applicationDeadline)) && (
                                      <span className="ml-1 inline-block rounded bg-red-600 px-1.5 text-[11px] font-bold uppercase text-white">Expired</span>
                                    )}
                                  </>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2 text-left align-top break-words whitespace-pre-wrap">
                                {news[index] ? (
                                  <Link href={detailPath('news', news[index])} className="text-[#014F59] hover:underline hover:text-blue-800">
                                    {news[index].title}
                                  </Link>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </tr>
                          ))}
                          {(results.length > 10 || jobs.length > 10 || news.length > 10) && (
                            <tr className="hover:bg-[#FFF8CC]">
                              <td className="text-center">
                                {results.length > 10 && (
                                  <Link href="/results" className="text-blue-600 font-semibold hover:underline">
                                    View All Exam Results
                                  </Link>
                                )}
                              </td>
                              <td className="p-2 border-x text-center align-top break-words whitespace-pre-wrap">
                                {jobs.length > 10 && (
                                  <Link href="/jobs" className="text-blue-600 font-semibold hover:underline">
                                    View All Government Jobs
                                  </Link>
                                )}
                              </td>
                              <td className="text-center">
                                {news.length > 10 && (
                                  <Link href="/news" className="text-blue-600 font-semibold hover:underline">
                                    View Latest Exam News
                                  </Link>
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="w-full">
                    <div className="w-full overflow-x-auto hide-scrollbar">
                      <table className="w-full table-fixed border-collapse border border-orange-500 text-xs sm:text-sm md:text-base">
                        <thead>
                          <tr className="bg-red-600 text-[#FCFCD8] font-bold">
                            <th className="p-2 text-center break-words whitespace-normal w-1/3">Admit Card</th>
                            <th className="p-2 text-center break-words whitespace-normal w-1/3">Answer Key</th>
                            <th className="p-2 text-center break-words whitespace-normal w-1/3">Admission</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({
                            length: Math.min(10, Math.max(admitCards.length, answerKeys.length, admissions.length)),
                          }).map((_, index) => (
                            <tr key={index} className="border-t-2 border-red-500 hover:bg-[#f5f7f2]">
                              <td className="p-2 border-x text-left align-top break-words whitespace-pre-wrap">
                                {admitCards[index] ? (
                                  <Link href={detailPath('admit-cards', admitCards[index])} className="text-[#014F59] hover:underline hover:text-blue-800">
                                    {admitCards[index].title}
                                  </Link>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2 border-x text-left align-top break-words whitespace-pre-wrap">
                                {answerKeys[index] ? (
                                  <Link href={detailPath('answer-keys', answerKeys[index])} className="text-[#014F59] hover:underline hover:text-blue-800">
                                    {answerKeys[index].title}
                                  </Link>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2 text-left align-top break-words whitespace-pre-wrap">
                                {admissions[index] ? (
                                  <Link href={detailPath('admissions', admissions[index])} className="text-[#014F59] hover:underline hover:text-blue-800">
                                    {admissions[index].title}
                                  </Link>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </tr>
                          ))}
                          {(admitCards.length > 10 || answerKeys.length > 10 || admissions.length > 10) && (
                            <tr className="hover:bg-[#FFF8CC]">
                              <td className="text-center">
                                {admitCards.length > 10 && (
                                  <Link href="/admit-cards" className="text-blue-600 font-semibold hover:underline">
                                    View All Admit Cards
                                  </Link>
                                )}
                              </td>
                              <td className="p-2 border-x text-center align-top break-words whitespace-pre-wrap">
                                {answerKeys.length > 10 && (
                                  <Link href="/answer-keys" className="text-blue-600 font-semibold hover:underline">
                                    View All Answer Keys
                                  </Link>
                                )}
                              </td>
                              <td className="p-2 text-center align-top break-words whitespace-pre-wrap">
                                {admissions.length > 10 && (
                                  <Link href="/admissions" className="text-blue-600 font-semibold hover:underline">
                                    View All Admission Updates
                                  </Link>
                                )}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>

          <PopularExamsClient categories={categories} />
        </main>
      </div>

      <div className="bg-[#FFF] mb-4 mt-4">
        <div className="flex flex-col items-center justify-center bg-[#f5f7f2] w-5/14 max-w-7xl mx-auto px-4">
          <AnnouncementBar title="About Sarkari Results Now">
            <p>
              Sarkari Results Now brings together the latest government job notifications, exam results,
              admit cards, answer keys and admission updates from central and state recruitment bodies such
              as SSC, UPSC, IBPS, Railways, State PSCs and police boards. Every post lists the important
              dates, vacancy details, eligibility, application fee and a direct link to the official
              website, so you can check the facts at the source before you apply.
            </p>
            <p className="mt-3">
              Alongside job updates, we offer free timed mock tests and test series for popular exams to help
              you practise at your own pace. We are an independent portal and are not
              affiliated with any government body. Read more{' '}
              <Link href="/about" style={{ textDecoration: "underline", color: "#1a124d" }}>
                about us
              </Link>{' '}
              or{' '}
              <Link href="/contact" style={{ textDecoration: "underline", color: "#1a124d" }}>
                contact us
              </Link>
              .
            </p>
          </AnnouncementBar>
        </div>
      </div>
      <Footer />
    </>
  );
}
