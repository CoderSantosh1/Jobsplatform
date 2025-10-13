"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import AnnouncementBar from "@/components/ui/AnnouncementBar";
import Iconsocialmedia from "@/components/ui/iconsocialmedia";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// ---------- Types ----------
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

const DEFAULT_ICON = "/file.svg";
const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" className="text-gray-400">
    <path
      d="M9 6l6 6-6 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// Image with fallback
function Img({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [err, setErr] = useState(false);
  const url = !src
    ? DEFAULT_ICON
    : src.startsWith("http") || src.startsWith("/")
    ? src
    : `/${src}`;
  return (
    <img
      src={err ? DEFAULT_ICON : url}
      alt={alt}
      className={className}
      onError={() => setErr(true)}
      loading="lazy"
    />
  );
}

// ---------- Other page data types ----------
interface Job {
  _id: string;
  title: string;
  organization: string;
  postedDate: string;
}
interface Result {
  _id: string;
  title: string;
  organization: string;
  resultDate: string;
}
interface AdmitCard {
  _id: string;
  title: string;
  organization: string;
  applicationDeadline: string;
}
interface News {
  _id: string;
  title: string;
  organization: string;
  content: string;
  postedDate: string;
}
interface AnswerKey {
  _id: string;
  title: string;
  organization: string;
  content: string;
  postedDate: string;
}
interface Admission {
  _id: string;
  title: string;
  organization: string;
  content: string;
  postedDate: string;
}
interface Quiz {
  _id: string;
  title: string;
  description: string;
  totalMarks: number;
  timeLimit: number;
  questions: Array<{
    _id: string;
    text: string;
    options: string[];
    correctAnswer: number;
  }>;
  attempts?: Array<{
    _id: string;
    userId: string;
    score: number;
    completedAt: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [admitCards, setAdmitCards] = useState<AdmitCard[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [answerKeys, setAnswerKeys] = useState<AnswerKey[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // ---------- NEW: Popular Exams (categories) state ----------
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const [showRightBtn, setShowRightBtn] = useState(true);
  // Left button visible only after first right click
  const [showLeftBtn, setShowLeftBtn] = useState(false);

  const scrollChips = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;

    // Get the width of one chip (including gap)
    const chip = el.querySelector("button");
    const scrollAmount = chip ? chip.getBoundingClientRect().width + 16 : 120;

    // Scroll smoothly
    if (dir === "right") {
      el.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setShowLeftBtn(true); // show left btn only after clicking right
    } else {
      el.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }

    // Update button states after scroll
    setTimeout(() => {
      if (!el) return;
      const { scrollLeft, scrollWidth, clientWidth } = el;

      setShowLeftBtn(scrollLeft > 0); // show left only if actually scrolled
      setShowRightBtn(scrollLeft + clientWidth < scrollWidth - 5); // hide right when at end
    }, 300); // delay to wait for smooth scroll
  };

  const updateScrollButtons = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setShowLeftBtn(el.scrollLeft > 0); // keep left visible only when scrolled
  };

  // attach scroll listener
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, []);
  const activeCategory = useMemo(
    () => categories[activeIndex],
    [categories, activeIndex]
  );
  const exams = useMemo<Subcategory[]>(
    () =>
      (activeCategory?.subcategories || []).filter(
        (s) => s && typeof s.name === "string"
      ),
    [activeCategory]
  );

  // Fetch page datasets + quiz categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const responses = await Promise.all([
          fetch("/api/jobs"),
          fetch("/api/results"),
          fetch("/api/admit-cards"),
          fetch("/api/news"),
          fetch("/api/answer-keys"),
          fetch("/api/admissions"),
          fetch("/api/quizzes"),
          fetch("/api/quiz-categories"),
        ]);
        const data = await Promise.all(
          responses.map((r) => (r.ok ? r.json() : { data: [] }))
        );

        const [
          jobsData,
          resultsData,
          admitCardsData,
          newsData,
          answerKeysData,
          admissionsData,
          quizzesData,
          categoriesData,
        ] = data;

        setJobs(
          jobsData.data?.sort(
            (a: Job, b: Job) =>
              +new Date(b.postedDate) - +new Date(a.postedDate)
          ) || []
        );
        setResults(
          resultsData.data?.sort(
            (a: Result, b: Result) =>
              +new Date(b.resultDate) - +new Date(a.resultDate)
          ) || []
        );
        setAdmitCards(
          admitCardsData.data?.sort(
            (a: AdmitCard, b: AdmitCard) =>
              +new Date(b.applicationDeadline) -
              +new Date(a.applicationDeadline)
          ) || []
        );
        setNews(
          newsData.data?.sort(
            (a: News, b: News) =>
              +new Date(b.postedDate) - +new Date(a.postedDate)
          ) || []
        );
        setAnswerKeys(
          answerKeysData.data?.sort(
            (a: AnswerKey, b: AnswerKey) =>
              +new Date(b.postedDate) - +new Date(a.postedDate)
          ) || []
        );
        setAdmissions(
          admissionsData.data?.sort(
            (a: Admission, b: Admission) =>
              +new Date(b.postedDate) - +new Date(a.postedDate)
          ) || []
        );
        setQuizzes(
          quizzesData.data?.sort(
            (a: Quiz, b: Quiz) =>
              +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0)
          ) || []
        );

        const catList: Category[] = Array.isArray(categoriesData?.data)
          ? categoriesData.data
          : Array.isArray(categoriesData)
          ? categoriesData
          : [];
        setCategories(catList);
        setActiveIndex(0);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <Iconsocialmedia />
      <div className="bg-[#fff] min-h-screen">
        <main className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-2 sm:px-4">
          <div className="w-full space-y-6 py-4">
            <div className="bg-[#fFfFff] min-h-screen">
              <main className="flex flex-col items-center justify-center bg-[#fFfFf] w-full max-w-7xl mx-auto px-2 sm:px-4">
                <div className="w-full space-y-6 py-4">
                  <div className="w-full  overflow-hidden">
                    <div className="inline-block whitespace-nowrap animate-marquee text-sm sm:text-base">
                      {(
                        [
                          ...results.slice(0, 5),
                          ...jobs.slice(0, 5),
                          ...admitCards.slice(0, 5),
                        ] as (Result | Job | AdmitCard)[]
                      ).reduce<React.ReactNode[]>((acc, item, idx) => {
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

                        const colorClass = baseColors[idx % baseColors.length];
                        const hoverClass =
                          hoverColors[idx % hoverColors.length];

                        const linkText =
                          "organization" in item ? item.organization : "";

                        const linkPath =
                          "resultDate" in item
                            ? `/results/${item._id}`
                            : "postedDate" in item
                            ? `/jobs/${item._id}`
                            : "applicationDeadline" in item
                            ? `/admit-cards/${item._id}`
                            : "#";

                        if (idx !== 0) {
                          acc.push(
                            <span
                              key={`sep-${idx}`}
                              className="mx-1 text-gray-400"
                            >
                              |
                            </span>
                          );
                        }

                        acc.push(
                          <a
                            key={`item-${item._id}`}
                            href={linkPath}
                            className={`font-medium inline-block transition-colors duration-200 ${colorClass} ${hoverClass}`}
                          >
                            {linkText}
                          </a>
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
                              Math.max(results.length, jobs.length, news.length)
                            ),
                          }).map((_, index) => (
                            <tr
                              key={index}
                              className="border-t-2 border-red-500 hover:bg-[#fdfefe]"
                            >
                              <td className="p-2 border-x text-left align-top break-words whitespace-pre-wrap">
                                {results[index] ? (
                                  <a
                                    href={`/results/${results[index]._id}`}
                                    className="text-[#014F59] hover:underline hover:text-blue-800"
                                  >
                                    {results[index].title}
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2 border-x text-left align-top break-words whitespace-pre-wrap">
                                {jobs[index] ? (
                                  <a
                                    href={`/jobs/${jobs[index]._id}`}
                                    className="text-[#014F59] hover:underline hover:text-blue-800"
                                  >
                                    {jobs[index].title}
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2 text-left align-top break-words whitespace-pre-wrap">
                                {news[index] ? (
                                  <a
                                    href={`/news/${news[index]._id}`}
                                    className="text-[#014F59] hover:underline hover:text-blue-800"
                                  >
                                    {news[index].title}
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </tr>
                          ))}
                          {(results.length > 10 ||
                            jobs.length > 10 ||
                            news.length > 10) && (
                            <tr className=" hover:bg-[#FFF8CC]">
                              <td className=" text-center ">
                                {results.length > 5 && (
                                  <a
                                    href="/results"
                                    className="text-blue-600 font-semibold hover:underline"
                                  >
                                    See More
                                  </a>
                                )}
                              </td>
                              <td className="p-2 border-x text-center align-top break-words whitespace-pre-wrap">
                                {jobs.length > 10 && (
                                  <a
                                    href="/jobs"
                                    className="text-blue-600 font-semibold hover:underline"
                                  >
                                    See More
                                  </a>
                                )}
                              </td>
                              <td className="text-center ">
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

                  {/* Section 2: Admit Card / Answer Key / Admission */}
                  <div className="w-full">
                    <div className="w-full overflow-x-auto hide-scrollbar">
                      <table className="w-full table-fixed border-collapse border border-orange-500 text-xs sm:text-sm md:text-base">
                        <thead>
                          <tr className="bg-red-600 text-[#FCFCD8] font-bold">
                            <th className="p-2 text-center break-words whitespace-normal w-1/3">
                              Admit Card
                            </th>
                            <th className="p-2 text-center break-words whitespace-normal w-1/3">
                              Answer Key
                            </th>
                            <th className="p-2 text-center break-words whitespace-normal w-1/3">
                              Admission
                            </th>
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
                                    className="text-[#014F59] hover:underline hover:text-blue-800"
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
                                    className="text-[#014F59] hover:underline hover:text-blue-800"
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
                                    className="text-[#014F59] hover:underline hover:text-blue-800"
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
                              <td className="text-center ">
                                {admitCards.length > 10 && (
                                  <a
                                    href="/admit-cards"
                                    className="text-blue-600 font-semibold hover:underline"
                                  >
                                    See More
                                  </a>
                                )}
                              </td>
                              <td className="p-2 border-x text-center align-top break-words whitespace-pre-wrap">
                                {answerKeys.length > 10 && (
                                  <a
                                    href="/answer-keys"
                                    className="text-blue-600 font-semibold hover:underline"
                                  >
                                    See More
                                  </a>
                                )}
                              </td>
                              <td className="p-2 text-center align-top break-words whitespace-pre-wrap">
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

                  {/* Quiz Section */}
                </div>
              </main>
            </div>
          </div>
          <section className="relative px-4 w-full max-w-screen overflow-x-hidden ">
            <h2 className="text-2xl font-bold mb-2 text-[#1a124d]">
              Popular Exams
            </h2>
            <p className="text-[#1a124d] text-sm sm:text-base mb-4">
              Get exam-ready with concepts, questions and study notes as per the
              latest pattern
            </p>

            {/* Category chips row */}
            <div className="relative flex items-center ">
              {/* Left button - only show after at least one scroll right */}
              {showLeftBtn && (
                <button
                  aria-label="Scroll left"
                  onClick={() => scrollChips("left")}
                  className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white border rounded-full shadow p-2 .hide-scrollbar"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      d="M15 18l-6-6 6-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}

              {/* Chips scroller */}
              <div
                ref={scrollerRef}
                onScroll={updateScrollButtons}
                className="flex gap-3 hide-scrollbar px-10 whitespace-nowrap overflow-x-auto"
              >
                {categories.map((c, i) => (
                  <button
                    key={c._id || c.name}
                    onClick={() => setActiveIndex(i)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition
            ${
              i === activeIndex
                ? "bg-blue-50 text-blue-700 border-blue-300"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Right button - always visible */}
              <button
                aria-label="Scroll right"
                onClick={() => scrollChips("right")}
                className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white border rounded-full shadow p-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    d="M9 6l6 6-6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Exams grid */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {exams.map((exam) => (
                <Link
                  key={exam._id || exam.name}
                  href={`/quizzes?category=${encodeURIComponent(
                    activeCategory?.name || ""
                  )}&subcategory=${encodeURIComponent(exam.name)}`}
                  className="group flex items-center justify-between rounded-xl border bg-white px-4 py-4 shadow-sm hover:shadow transition"
                >
                  <div className="flex items-center gap-3">
                    <Img
                      src={exam.icon}
                      alt={exam.name}
                      className="w-9 h-9 rounded object-contain bg-white"
                    />
                    <span className="font-semibold text-gray-900">
                      {exam.name}
                    </span>
                  </div>
                  <ChevronRight />
                </Link>
              ))}

              {/* Explore all exams */}
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
        <div className="flex flex-col items-center  justify-center bg-[#f5f7f2]  w-5/14 max-w-7xl mx-auto px-4 ">
          <AnnouncementBar title="Sarkari Results Now Latest Job">
            Most Recent Sarkari Work, Sarkari Test Result, Most Recent On The
            Web And Disconnected Structure, Concede Card, Prospectus,
            Affirmation, Ansawer Key, Grant, Notice Etc.If You Need To Get
            Refreshes Connected With Sarkari Occupations On Sarkari
            Result.Com.Cm Like Concede Warning Like Govt. Test, Sarkari Result,
            Most Recent Bord Result, Bihar Result Tenth And So On You Could
            Sarkari Result Most Recent Occupation At Any Point Website Page
            Consistently.
          </AnnouncementBar>
          <AnnouncementBar title="Sarkari Results">
            <b>Sarkari Results:</b> Sarkari Results Is A Famous Site In India
            That Gives Data About Sarkari Work Tests, Sarkari Result 2025, And
            Other Related Refreshes. It Is One Of The Notable Entries That Many
            Work Searchers Use To Secure Data About Government Position Opening,
            Concede Cards, Test Dates, And Results.
          </AnnouncementBar>
          <AnnouncementBar title="Sarkari Result Bihar">
            Each Data Connected With Sarkari Test Result In Bihar Can Be Seen As
            Here Like: OFSS Bihar, Bihar Board Tenth Outcome, Sarkari Result
            Bihar Board 2025, Bihar Board Matric 2025, Bihar Police 2025, Bihar
            Board Tenth, Bihar Ssc, Bihar Je, Bihar Common Court, Sarkari Result
            Bihar Board Result, Bihar Work, Bihar Result, Bihar 5+2 Most Recent
            Work, Bihar Sarkari Result , Bihar Sarkari Test, Bihar Govt Work,
            Concede Card, Bihar Sarkari Result, Eleventh Affirmation And So
            Forth.
          </AnnouncementBar>
          <AnnouncementBar title="Sarkari Result Hindi">
            Uttar Pradesh (Sarkariresult.Com.Cm UP Board) Is A State Where Lakhs
            Of Young People Give Sarkari Test Consistently To Land Government
            Positions, So Here UP Board Plays A Significant Part, So Here You
            Will Get Sarkari Result Up Board 2024, Up Barricade Result , Board
            2025,Up Board Test Result, Sarkari Result Up Board Class Tenth, Up
            Board Result Date, Sarkari Result Up Board 2024 In Hindi And So On.
            Will Continue To Get Refreshes.
          </AnnouncementBar>
          <AnnouncementBar title="Sarkariresult">
            Sarkariresult: Data Presents To You All The Most Recent News Like
            Outcome, Online Structure, Naukri, Test Result 2025, Work Result,
            Information Hindi Test, Government Work Data, And Updates, Notice
            And Output Gives.
          </AnnouncementBar>
          <AnnouncementBar title="SarkariResultsNow">
            SarkariResultsNow.in is an independent portal dedicated to helping
            job seekers, students, and aspirants stay updated with the latest
            government job notifications, exam results, admit cards, answer
            keys, and current affairs.
            <br />
            <br />
            Our mission is to make public information more accessible by
            presenting updates from official government portals in a clean and
            organized format. We do not represent any government body, and all
            data shared here is sourced from publicly available and verified
            official announcements.
            <br />
            <br />
            If you have questions or concerns, feel free to contact us via the{" "}
            <a
              href="/contact"
              style={{ textDecoration: "underline", color: "#1a124d" }}
            >
              Contact
            </a>{" "}
            page.
          </AnnouncementBar>
        </div>
      </div>
      <Footer />
    </>
  );
}
