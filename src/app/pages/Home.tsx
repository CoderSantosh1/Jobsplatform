"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AnnouncementBar from "@/components/ui/AnnouncementBar";
import Quiz from "@/lib/models/Quiz";

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
        ]);

        const dataPromises = responses.map((res) =>
          res.ok ? res.json() : Promise.resolve({ data: [] })
        );
        const allData = await Promise.all(dataPromises);

        const [
          jobsData,
          resultsData,
          admitCardsData,
          newsData,
          answerKeysData,
          admissionsData,
          quizzesData,
        ] = allData;

        setJobs(
          jobsData.data?.sort(
            (a: Job, b: Job) =>
              new Date(b.postedDate).getTime() -
              new Date(a.postedDate).getTime()
          ) || []
        );
        setResults(
          resultsData.data?.sort(
            (a: Result, b: Result) =>
              new Date(b.resultDate).getTime() -
              new Date(a.resultDate).getTime()
          ) || []
        );
        setAdmitCards(
          admitCardsData.data?.sort(
            (a: AdmitCard, b: AdmitCard) =>
              new Date(b.applicationDeadline).getTime() -
              new Date(a.applicationDeadline).getTime()
          ) || []
        );
        setNews(
          newsData.data?.sort(
            (a: News, b: News) =>
              new Date(b.postedDate).getTime() -
              new Date(a.postedDate).getTime()
          ) || []
        );
        setAnswerKeys(
          answerKeysData.data?.sort(
            (a: AnswerKey, b: AnswerKey) =>
              new Date(b.postedDate).getTime() -
              new Date(a.postedDate).getTime()
          ) || []
        );
        setAdmissions(
          admissionsData.data?.sort(
            (a: Admission, b: Admission) =>
              new Date(b.postedDate).getTime() -
              new Date(a.postedDate).getTime()
          ) || []
        );
        setQuizzes(
          quizzesData.data?.sort((a: Quiz, b: Quiz) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          }) || []
        );
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    console.log("Current quizzes state:", quizzes);
  }, [quizzes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen ">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 bg-[#1a124d]"></div>
      </div>
    );
  }

  console.log("Rendering with quizzes:", quizzes);

  return (
    <>
      <Header />
      <div className="bg-[#FFF] w-full flex items-center justify-center gap-3 mb-4 mt-4">
        {/* WhatsApp — Ripple Glow */}
        <a
          href="https://chat.whatsapp.com/YOUR_WHATSAPP_GROUP_LINK"
          target="_blank"
          rel="noopener noreferrer"
          className="relative overflow-hidden px-5 py-2 bg-green-500 text-white font-semibold rounded-full
               shadow-md flex items-center gap-2 transition duration-300
               hover:scale-110 hover:bg-green-600 hover:shadow-xl focus:outline-none
               focus-visible:ring-2 focus-visible:ring-green-300 animate-glow"
        >
          {/* ripple rings */}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="absolute w-40 h-40 rounded-full bg-white/25 blur-sm animate-ripple" />
            <span className="absolute w-40 h-40 rounded-full bg-white/20 blur-sm animate-ripple-delay" />
          </span>

          {/* icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            className="w-5 h-5 relative"
          >
            <path d="M12 0C5.371 0 0 5.373 0 12c0 2.115.55 4.105 1.516 5.83L0 24l6.387-1.672A11.95 11.95 0 0 0 12 24c6.629 0 12-5.373 12-12S18.629 0 12 0zm0 21.818c-1.835 0-3.587-.481-5.143-1.394l-.368-.213-3.789 1.003 1.011-3.692-.239-.379A9.78 9.78 0 0 1 2.182 12C2.182 6.486 6.486 2.182 12 2.182S21.818 6.486 21.818 12 17.514 21.818 12 21.818zm5.207-7.297c-.284-.141-1.681-.829-1.942-.922-.26-.093-.45-.141-.639.142-.189.284-.732.922-.897 1.11-.165.189-.332.213-.616.071-.284-.142-1.197-.441-2.282-1.404-.843-.752-1.41-1.68-1.574-1.964-.165-.284-.018-.438.124-.579.127-.126.284-.332.426-.496.142-.165.189-.284.284-.474.094-.189.047-.355-.024-.497-.071-.142-.639-1.541-.875-2.111-.23-.553-.465-.479-.639-.487l-.544-.009c-.189 0-.497.071-.758.355-.26.284-.997.975-.997 2.379s1.022 2.759 1.164 2.948c.142.189 2.009 3.071 4.873 4.306.681.293 1.213.467 1.628.598.684.218 1.305.187 1.796.113.548-.081 1.681-.686 1.918-1.348.236-.662.236-1.229.165-1.348-.071-.118-.26-.189-.544-.33z" />
          </svg>
          <span className="relative">Join WhatsApp</span>
        </a>

        {/* Telegram — Comet Shimmer */}
        <a
          href="https://t.me/sarkariresultsnow"
          target="_blank"
          rel="noopener noreferrer"
          className="relative overflow-hidden px-5 py-2 bg-blue-500 text-white font-semibold rounded-full
               shadow-md flex items-center gap-2 transition duration-300
               hover:scale-110 hover:bg-blue-600 hover:shadow-xl focus:outline-none
               focus-visible:ring-2 focus-visible:ring-blue-300 animate-glow"
        >
          {/* comet sweep */}
          <span
            className="pointer-events-none absolute top-0 left-0 h-full w-[55%] bg-white/25 blur-[2px]
                     -skew-x-12 -translate-x-full animate-comet"
          />
          {/* subtle inner shine */}
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent" />

          {/* icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            className="w-5 h-5 relative"
          >
            <path d="M12 0C5.373 0 0 5.373 0 12c0 5.29 3.438 9.747 8.205 11.385.6.111.82-.26.82-.577v-2.23c-3.338.726-4.033-1.416-4.033-1.416-.546-1.389-1.334-1.759-1.334-1.759-1.091-.745.083-.729.083-.729 1.205.084 1.838 1.237 1.838 1.237 1.07 1.836 2.809 1.306 3.495.999.108-.774.419-1.305.762-1.605-2.665-.303-5.466-1.332-5.466-5.931 0-1.312.469-2.381 1.237-3.221-.124-.304-.536-1.524.116-3.176 0 0 1.008-.322 3.301 1.23A11.52 11.52 0 0 1 12 6.844c1.02.004 2.046.138 3.003.404 2.291-1.552 3.298-1.23 3.298-1.23.653 1.652.241 2.872.118 3.176.77.84 1.236 1.909 1.236 3.221 0 4.61-2.805 5.625-5.478 5.922.43.37.823 1.102.823 2.222v3.293c0 .32.217.694.826.576C20.565 21.744 24 17.288 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
          <span className="relative">Join Telegram</span>
        </a>
      </div>

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
                  const hoverClass = hoverColors[idx % hoverColors.length];

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
                      <span key={`sep-${idx}`} className="mx-1 text-gray-400">
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
                        5,
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
                    {(results.length > 5 ||
                      jobs.length > 5 ||
                      news.length > 5) && (
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
                          {jobs.length > 5 && (
                            <a
                              href="/jobs"
                              className="text-blue-600 font-semibold hover:underline"
                            >
                              See More
                            </a>
                          )}
                        </td>
                        <td className="text-center ">
                          {news.length > 5 && (
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
                        5,
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
                    {(admitCards.length > 5 ||
                      answerKeys.length > 5 ||
                      admissions.length > 5) && (
                      <tr className="hover:bg-[#FFF8CC]">
                        <td className="text-center ">
                          {admitCards.length > 5 && (
                            <a
                              href="/admit-cards"
                              className="text-blue-600 font-semibold hover:underline"
                            >
                              See More
                            </a>
                          )}
                        </td>
                        <td className="p-2 border-x text-center align-top break-words whitespace-pre-wrap">
                          {answerKeys.length > 5 && (
                            <a
                              href="/answer-keys"
                              className="text-blue-600 font-semibold hover:underline"
                            >
                              See More
                            </a>
                          )}
                        </td>
                        <td className="p-2 text-center align-top break-words whitespace-pre-wrap">
                          {admissions.length > 5 && (
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
            <div className="mt-8 px-4 sm:px-6 w-full max-w-screen bg-[#ffff] overflow-x-hidden">
              <div className="text-center bg-[#ffff] ">
                <h2 className="text-blue-500 font-bold text-base sm:text-lg md:text-xl animate-marquee">
                  <a
                    href="/quizzes"
                    className="hover:text-blue-600 hover:underline block w-full text-sm"
                  >
                    Free Mock Tests for All Government Exams {""}{" "}
                    {quizzes.map((quiz) => quiz.title).join(" | ")}
                  </a>
                </h2>
              </div>

              {!quizzes || quizzes.length === 0 ? (
                <div className="text-center py-6 bg-white rounded-lg shadow mt-4">
                  <p className="text-gray-500">
                    No quizzes available at the moment.
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Check back later for new quizzes!
                  </p>
                </div>
              ) : (
                <div className="w-full mt-6 bg-[#ffff]">
                  <div className="bg-[#ffff]  border border-orange-500 rounded-md overflow-hidden shadow-sm w-full">
                    <div className="bg-red-600 text-[#f5f7f2] font-bold text-sm sm:text-base py-2 px-4 text-center w-full">
                      Free Test Series for All Government Exams
                    </div>

                    {/* 3 columns on ALL viewports */}
                    <div className="grid grid-cols-3 divide-x divide-orange-300">
                      {[0, 1, 2].map((colIndex) => (
                        <ul
                          key={colIndex}
                          className="divide-y divide-orange-300"
                        >
                          {quizzes
                            .slice(colIndex * 5, colIndex * 5 + 5)
                            .map((quiz) => (
                              <li
                                key={quiz._id}
                                className="py-3 px-2 sm:px-4 bg-[#ffff] text-center break-words w-full"
                              >
                                <a
                                  href="/quizzes"
                                  className="text-[#014F59] hover:text-blue-900 font-medium text-xs sm:text-sm md:text-base hover:underline block w-full"
                                >
                                  {quiz.title}
                                </a>
                              </li>
                            ))}
                        </ul>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end mt-2 pr-2">
                    <a
                      href="/quizzes"
                      className="text-[#014F59] hover:text-[#014F59]/80 font-medium text-sm underline"
                    >
                      View All Test →
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Announcement Bars */}
      <div className="bg-[#FFF] mb-4">
        <div className="flex flex-col items-center  justify-center bg-[#f5f7f2]  w-5/14 max-w-7xl mx-auto px-4 ">
          <AnnouncementBar title="Sarkari Results 5+2 Latest Job">
            Most Recent Sarkari Work, Sarkari Test Result, Most Recent On The
            Web And Disconnected Structure, Concede Card, Prospectus,
            Affirmation, Ansawer Key, Grant, Notice Etc.If You Need To Get
            Refreshes Connected With Sarkari Occupations On Sarkari
            Result.Com.Cm Like Concede Warning Like Govt. Test, Sarkari Result,
            Most Recent Bord Result, Bihar Result Tenth And So On You Could
            Sarkari Result 5+2 Most Recent Occupation At Any Point Website Page
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
          <AnnouncementBar title="SarkariResultsNow.in">
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
