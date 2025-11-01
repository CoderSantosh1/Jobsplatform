"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/ui/AnnouncementBar";
import Iconsocialmedia from "@/components/ui/iconsocialmedia";
import { toast } from "sonner";
import Script from "next/script";


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
    // using regular img keeps it simple for client-only rendering
    <img
      src={err ? DEFAULT_ICON : url}
      alt={alt}
      className={className}
      onError={() => setErr(true)}
      loading="lazy"
      decoding="async"
    />
  );
}

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

// Lightweight types used on page (only fields we need)
interface ItemShort {
  _id: string;
  title: string;
  organization?: string;
  postedDate?: string;
  resultDate?: string;
  applicationDeadline?: string;
  content?: string;
}

export default function HomeClient() {
  // lists
  const [jobs, setJobs] = useState<ItemShort[]>([]);
  const [results, setResults] = useState<ItemShort[]>([]);
  const [admitCards, setAdmitCards] = useState<ItemShort[]>([]);
  const [news, setNews] = useState<ItemShort[]>([]);
  const [answerKeys, setAnswerKeys] = useState<ItemShort[]>([]);
  const [admissions, setAdmissions] = useState<ItemShort[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]); // keep generic for now
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // chips scroller
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // utility: update scroll button visibility
  const updateScrollButtons = () => {
    const el = scrollerRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };
useEffect(() => {
  if (window.location.hash === "#google_vignette") {
    history.replaceState(null, "", window.location.pathname);
  }
}, []);

  useEffect(() => {
    // attach listener
    const el = scrollerRef.current;
    updateScrollButtons();
    if (el) {
      el.addEventListener("scroll", updateScrollButtons, { passive: true });
    }
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      if (el) el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [scrollerRef.current]);

  const scrollChips = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    // try to compute a sensible chip width; fallback to 120
    const chip = el.querySelector("button");
    const chipWidth = chip ? chip.getBoundingClientRect().width + 12 : 120;
    const amount = dir === "right" ? chipWidth * 3 : -chipWidth * 3; // page-like scroll
    el.scrollBy({ left: amount, behavior: "smooth" });
    // buttons will update via scroll listener
  };

  // active category's subcategories
  const activeCategory = useMemo(
    () => categories[activeIndex] || null,
    [categories, activeIndex]
  );
  const exams = useMemo<Subcategory[]>(
    () =>
      (activeCategory?.subcategories || []).filter(
        (s) => s && typeof s.name === "string"
      ),
    [activeCategory]
  );

  // fetch all page data on client
  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        // keep endpoints as before; all client fetches
        const endpoints = [
          "/api/jobs",
          "/api/results",
          "/api/admit-cards",
          "/api/news",
          "/api/answer-keys",
          "/api/admissions",
          "/api/quizzes",
          "/api/quiz-categories",
        ];

        const res = await Promise.all(
          endpoints.map((ep) =>
            fetch(ep).catch((err) => {
              console.error("fetch error", ep, err);
              return null;
            })
          )
        );

        const jsons = await Promise.all(
          res.map(async (r) => {
            if (!r) return { data: [] };
            try {
              if (r.ok) return await r.json();
              // if not ok, try to parse text to help debugging
              const txt = await r.text();
              console.warn("non-ok response", r.status, txt);
              return { data: [] };
            } catch (err) {
              console.error("json parse failed", err);
              return { data: [] };
            }
          })
        );

        if (!mounted) return;

        const [
          jobsData,
          resultsData,
          admitCardsData,
          newsData,
          answerKeysData,
          admissionsData,
          quizzesData,
          categoriesData,
        ] = jsons;

        const safeArr = (v: any) =>
          Array.isArray(v?.data) ? v.data : Array.isArray(v) ? v : [];

        // helper to sort safely by date
        const sortByDateDesc = (arr: any[], key: string) =>
          arr.slice().sort((a, b) => {
            const da = a?.[key] ? +new Date(a[key]) : 0;
            const db = b?.[key] ? +new Date(b[key]) : 0;
            return db - da;
          });

        setJobs(sortByDateDesc(safeArr(jobsData), "postedDate"));
        setResults(sortByDateDesc(safeArr(resultsData), "resultDate"));
        setAdmitCards(
          sortByDateDesc(safeArr(admitCardsData), "applicationDeadline")
        );
        setNews(sortByDateDesc(safeArr(newsData), "postedDate"));
        setAnswerKeys(sortByDateDesc(safeArr(answerKeysData), "postedDate"));
        setAdmissions(sortByDateDesc(safeArr(admissionsData), "postedDate"));
        setQuizzes(sortByDateDesc(safeArr(quizzesData), "createdAt"));

        const catList: Category[] = Array.isArray(categoriesData?.data)
          ? categoriesData.data
          : Array.isArray(categoriesData)
          ? categoriesData
          : [];
        setCategories(catList);
        setActiveIndex(0);
      } catch (err) {
        console.error("fetchAll error", err);
        toast.error("Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  // compute a marquee list for top row (results, jobs, admitCards)
  const marqueeItems = [
    ...results.slice(0, 5),
    ...jobs.slice(0, 5),
    ...admitCards.slice(0, 5),
  ] as ItemShort[];

  return (
    <>
      {/* ✅ First AdSense block */}
      <div className="my-6 flex justify-center">
        <ins
          className="adsbygoogle"
          style={{ display: "block", maxWidth: "100%" }}
          data-ad-client="ca-pub-6447497690677792"
          data-ad-slot="3013342039"
          data-ad-format="auto"
          data-full-width-responsive="true"
          data-adtest="on" // <-- keep ON for local testing
        ></ins>
        <script
          dangerouslySetInnerHTML={{
            __html: "(adsbygoogle = window.adsbygoogle || []).push({});",
          }}
        />
      </div>

      {/* ✅ Normal page continues */}

      <Header />
      <Iconsocialmedia />
      <div className="bg-white min-h-screen">
        <main className="w-full max-w-7xl mx-auto px-4 py-6">
          {/* Top marquee */}
          <div className="mb-6 overflow-hidden">
            <div className="inline-block whitespace-nowrap animate-marquee text-sm sm:text-base">
              {marqueeItems.length === 0 ? (
                <span className="text-gray-500">No recent updates</span>
              ) : (
                marqueeItems.map((it, idx) => {
                  const colorClasses = [
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
                  const color = colorClasses[idx % colorClasses.length];
                  // choose path based on available dates
                  const href = it.resultDate
                    ? `/results/${it._id}`
                    : it.postedDate
                    ? `/jobs/${it._id}`
                    : it.applicationDeadline
                    ? `/admit-cards/${it._id}`
                    : "#";
                  const label = it.organization || it.title || "Update";
                  return (
                    <span
                      key={it._id + idx}
                      className="inline-flex items-center mr-3"
                    >
                      <a
                        className={`font-medium inline-block ${color} hover:underline`}
                        href={href}
                      >
                        {label}
                      </a>
                      <span className="mx-2 text-gray-300">|</span>
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* Three-column latest table */}
          <section className="mb-6">
            <div className="overflow-x-auto hide-scrollbar">
              <table className="w-full table-fixed border-collapse border border-orange-500 text-xs sm:text-sm md:text-base">
                <thead>
                  <tr className="bg-red-600 text-[#FCFCD8] font-bold">
                    <th className="p-2 text-center w-1/3">Result</th>
                    <th className="p-2 text-center w-1/3">Latest Jobs</th>
                    <th className="p-2 text-center w-1/3">Latest News</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({
                    length: Math.min(
                      10,
                      Math.max(results.length, jobs.length, news.length)
                    ),
                  }).map((_, i) => (
                    <tr
                      key={i}
                      className="border-t-2 border-red-500 hover:bg-[#fdfefe]"
                    >
                      <td className="p-2 border-x align-top break-words whitespace-pre-wrap">
                        {results[i] ? (
                          <Link
                            href={`/results/${results[i]._id}`}
                            className="text-[#014F59] hover:underline hover:text-blue-800"
                          >
                            {results[i].title}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-2 border-x align-top break-words whitespace-pre-wrap">
                        {jobs[i] ? (
                          <Link
                            href={`/jobs/${jobs[i]._id}`}
                            className="text-[#014F59] hover:underline hover:text-blue-800"
                          >
                            {jobs[i].title}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-2 align-top break-words whitespace-pre-wrap">
                        {news[i] ? (
                          <Link
                            href={`/news/${news[i]._id}`}
                            className="text-[#014F59] hover:underline hover:text-blue-800"
                          >
                            {news[i].title}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                  {(results.length > 10 ||
                    jobs.length > 10 ||
                    news.length > 10) && (
                    <tr>
                      <td className="text-center">
                        {results.length > 5 && (
                          <Link
                            href="/results"
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            See More
                          </Link>
                        )}
                      </td>
                      <td className="text-center">
                        {jobs.length > 10 && (
                          <Link
                            href="/jobs"
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            See More
                          </Link>
                        )}
                      </td>
                      <td className="text-center">
                        {news.length > 10 && (
                          <Link
                            href="/news"
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            See More
                          </Link>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Admit / Answer Key / Admission */}
          <section className="mb-6">
            <div className="overflow-x-auto hide-scrollbar">
              <table className="w-full table-fixed border-collapse border border-orange-500 text-xs sm:text-sm md:text-base">
                <thead>
                  <tr className="bg-red-600 text-[#FCFCD8] font-bold">
                    <th className="p-2 text-center w-1/3">Admit Card</th>
                    <th className="p-2 text-center w-1/3">Answer Key</th>
                    <th className="p-2 text-center w-1/3">Admission</th>
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
                  }).map((_, i) => (
                    <tr
                      key={i}
                      className="border-t-2 border-red-500 hover:bg-[#f5f7f2]"
                    >
                      <td className="p-2 border-x align-top break-words whitespace-pre-wrap">
                        {admitCards[i] ? (
                          <Link
                            href={`/admit-cards/${admitCards[i]._id}`}
                            className="text-[#014F59] hover:underline hover:text-blue-800"
                          >
                            {admitCards[i].title}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-2 border-x align-top break-words whitespace-pre-wrap">
                        {answerKeys[i] ? (
                          <Link
                            href={`/answer-keys/${answerKeys[i]._id}`}
                            className="text-[#014F59] hover:underline hover:text-blue-800"
                          >
                            {answerKeys[i].title}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-2 align-top break-words whitespace-pre-wrap">
                        {admissions[i] ? (
                          <a
                            href={`/admissions/${admissions[i]._id}`}
                            className="text-[#014F59] hover:underline hover:text-blue-800"
                          >
                            {admissions[i].title}
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
                    <tr>
                      <td className="text-center">
                        {admitCards.length > 10 && (
                          <Link
                            href="/admit-cards"
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            See More
                          </Link>
                        )}
                      </td>
                      <td className="text-center">
                        {answerKeys.length > 10 && (
                          <Link
                            href="/answer-keys"
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            See More
                          </Link>
                        )}
                      </td>
                      <td className="text-center">
                        {admissions.length > 10 && (
                          <Link
                            href="/admissions"
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            See More
                          </Link>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Popular Exams (Categories) */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-2 text-[#1a124d]">
              Popular Exams
            </h2>
            <p className="text-[#1a124d] text-sm sm:text-base mb-4">
              Get exam-ready with concepts, questions and study notes as per the
              latest pattern
            </p>

            <div className="relative">
              {/* left scroll */}
              {canScrollLeft && (
                <button
                  aria-label="Scroll left"
                  onClick={() => scrollChips("left")}
                  className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white border rounded-full shadow p-2"
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

              <div
                ref={scrollerRef}
                className="flex gap-3 hide-scrollbar px-12 overflow-x-auto whitespace-nowrap"
                role="list"
              >
                {categories.length === 0 ? (
                  <div className="py-2 text-gray-500">No categories</div>
                ) : (
                  categories.map((c, i) => (
                    <button
                      role="listitem"
                      key={c._id || c.name}
                      onClick={() => setActiveIndex(i)}
                      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                        i === activeIndex
                          ? "bg-blue-50 text-blue-700 border-blue-300"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))
                )}
              </div>

              {/* right scroll */}
              {canScrollRight && (
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
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {exams.length === 0 ? (
                <div className="col-span-full text-gray-500">
                  No exams found for this category.
                </div>
              ) : (
                exams.map((exam) => (
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
                ))
              )}

              {/* Explore all exams */}
              <Link
                href="/quizzes"
                className="flex items-center justify-center rounded-xl border bg-white px-4 py-4 shadow-sm hover:shadow transition text-cyan-700 font-semibold"
              >
                Explore all exams
              </Link>
            </div>
          </section>

          {/* Announcements area */}
          <div className="bg-[#FFF] mb-6">
            <div className="flex flex-col items-center justify-center bg-[#f5f7f2] max-w-7xl mx-auto px-4 py-4 space-y-2">
              <AnnouncementBar title="Sarkari Results Now Latest Job">
                Most Recent Sarkari Work, Sarkari Test Result, Most Recent On
                The Web And Disconnected Structure, Concede Card, Prospectus,
                Affirmation, Ansawer Key, Grant, Notice Etc.
              </AnnouncementBar>

              <AnnouncementBar title="Sarkari Results">
                <b>Sarkari Results:</b> Sarkari Results Is A Famous Site In
                India That Gives Data About Sarkari Work Tests, Sarkari Result
                2025, And Other Related Refreshes.
              </AnnouncementBar>

              <AnnouncementBar title="Sarkari Result Bihar">
                Each Data Connected With Sarkari Test Result In Bihar Can Be
                Seen As Here Like: OFSS Bihar, Bihar Board Tenth Outcome, Bihar
                Police 2025, And More.
              </AnnouncementBar>

              <AnnouncementBar title="Sarkari Result Hindi">
                Uttar Pradesh (Sarkariresult.Com.Cm UP Board) Is A State Where
                Lakhs Of Young People Give Sarkari Test Consistently To Land
                Government Positions...
              </AnnouncementBar>

              <AnnouncementBar title="SarkariResultsNow">
                SarkariResultsNow.in is an independent portal dedicated to
                helping job seekers, students, and aspirants stay updated. We do
                not represent any government body.
                <br />
                <br />
                If you have questions, use the{" "}
                <Link href="/contact" className="underline">
                  Contact
                </Link>{" "}
                page.
              </AnnouncementBar>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
