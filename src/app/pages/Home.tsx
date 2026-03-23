import type { ReactNode } from "react";
import { unstable_noStore as noStore } from "next/cache";
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

export const dynamic = "force-dynamic";

interface JobItem {
  _id: string;
  title: string;
  organization: string;
  createdAt?: string;
}

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
  noStore();
  await connectToDatabase();

  const [jobs, results, admitCards, news, answerKeys, admissions, categories] =
    await Promise.all([
      Job.find().sort({ createdAt: -1 }).lean(),
      Result.find().sort({ resultDate: -1 }).lean(),
      AdmitCard.find().sort({ applicationDeadline: -1 }).lean(),
      News.find().sort({ postedDate: -1 }).lean(),
      AnswerKey.find().sort({ postedDate: -1 }).lean(),
      Admission.find().sort({ postedDate: -1 }).lean(),
      QuizCategory.find().lean(),
    ]);

  return {
    jobs: toPlain(jobs) as unknown as JobItem[],
    results: toPlain(results) as unknown as ResultItem[],
    admitCards: toPlain(admitCards) as unknown as AdmitCardItem[],
    news: toPlain(news) as unknown as NewsItem[],
    answerKeys: toPlain(answerKeys) as unknown as AnswerKeyItem[],
    admissions: toPlain(admissions) as unknown as AdmissionItem[],
    categories: toPlain(categories) as unknown as Category[],
  };
}

export default async function Home() {
  const { jobs, results, admitCards, news, answerKeys, admissions, categories } =
    await getHomeData();

  const marqueeItems = [
    ...results.slice(0, 5).map((item) => ({
      id: item._id,
      text: item.organization,
      href: `/results/${item._id}`,
    })),
    ...jobs.slice(0, 5).map((item) => ({
      id: item._id,
      text: item.organization,
      href: `/jobs/${item._id}`,
    })),
    ...admitCards.slice(0, 5).map((item) => ({
      id: item._id,
      text: item.organization,
      href: `/admit-cards/${item._id}`,
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
                                  <Link href={`/results/${results[index]._id}`} className="text-[#014F59] hover:underline hover:text-blue-800">
                                    {results[index].title}
                                  </Link>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2 border-x text-left align-top break-words whitespace-pre-wrap">
                                {jobs[index] ? (
                                  <Link href={`/jobs/${jobs[index]._id}`} className="text-[#014F59] hover:underline hover:text-blue-800">
                                    {jobs[index].title}
                                  </Link>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2 text-left align-top break-words whitespace-pre-wrap">
                                {news[index] ? (
                                  <Link href={`/news/${news[index]._id}`} className="text-[#014F59] hover:underline hover:text-blue-800">
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
                                    See More
                                  </Link>
                                )}
                              </td>
                              <td className="p-2 border-x text-center align-top break-words whitespace-pre-wrap">
                                {jobs.length > 10 && (
                                  <Link href="/jobs" className="text-blue-600 font-semibold hover:underline">
                                    See More
                                  </Link>
                                )}
                              </td>
                              <td className="text-center">
                                {news.length > 10 && (
                                  <Link href="/news" className="text-blue-600 font-semibold hover:underline">
                                    See More
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
                                  <Link href={`/admit-cards/${admitCards[index]._id}`} className="text-[#014F59] hover:underline hover:text-blue-800">
                                    {admitCards[index].title}
                                  </Link>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2 border-x text-left align-top break-words whitespace-pre-wrap">
                                {answerKeys[index] ? (
                                  <Link href={`/answer-keys/${answerKeys[index]._id}`} className="text-[#014F59] hover:underline hover:text-blue-800">
                                    {answerKeys[index].title}
                                  </Link>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2 text-left align-top break-words whitespace-pre-wrap">
                                {admissions[index] ? (
                                  <Link href={`/admissions/${admissions[index]._id}`} className="text-[#014F59] hover:underline hover:text-blue-800">
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
                                    See More
                                  </Link>
                                )}
                              </td>
                              <td className="p-2 border-x text-center align-top break-words whitespace-pre-wrap">
                                {answerKeys.length > 10 && (
                                  <Link href="/answer-keys" className="text-blue-600 font-semibold hover:underline">
                                    See More
                                  </Link>
                                )}
                              </td>
                              <td className="p-2 text-center align-top break-words whitespace-pre-wrap">
                                {admissions.length > 10 && (
                                  <Link href="/admissions" className="text-blue-600 font-semibold hover:underline">
                                    See More
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
          <AnnouncementBar title="SarkariResultsNow Latest Job">
            Most Recent Sarkari Work, Sarkari Test Result, Most Recent On The Web And Disconnected Structure, Concede Card, Prospectus, Affirmation, Ansawer Key, Grant, Notice Etc.If You Need To Get Refreshes Connected With Sarkari Occupations On Sarkari Result.Com.Cm Like Concede Warning Like Govt. Test, Sarkari Result, Most Recent Bord Result, Bihar Result Tenth And So On You Could Sarkari Result Most Recent Occupation At Any Point Website Page Consistently.
          </AnnouncementBar>

          <AnnouncementBar title="Sarkari Results">
            <b>Sarkari Results:</b> Sarkari Results Is A Famous Site In India That Gives Data About Sarkari Work Tests, Sarkari Result 2025, And Other Related Refreshes. It Is One Of The Notable Entries That Many Work Searchers Use To Secure Data About Government Position Opening, Concede Cards, Test Dates, And Results.
          </AnnouncementBar>
          <AnnouncementBar title="Sarkari Result Bihar">
            Each Data Connected With Sarkari Test Result In Bihar Can Be Seen As Here Like: OFSS Bihar, Bihar Board Tenth Outcome, Sarkari Result Bihar Board 2025, Bihar Board Matric 2025, Bihar Police 2025, Bihar Board Tenth, Bihar Ssc, Bihar Je, Bihar Common Court, Sarkari Result Bihar Board Result, Bihar Work, Bihar Result, Bihar 5+2 Most Recent Work, Bihar Sarkari Result , Bihar Sarkari Test, Bihar Govt Work, Concede Card, Bihar Sarkari Result, Eleventh Affirmation And So Forth.
          </AnnouncementBar>
          <AnnouncementBar title="Sarkari Result Hindi">
            Uttar Pradesh (Sarkariresult.Com.Cm UP Board) Is A State Where Lakhs Of Young People Give Sarkari Test Consistently To Land Government Positions, So Here UP Board Plays A Significant Part, So Here You Will Get Sarkari Result Up Board 2024, Up Barricade Result , Board 2025,Up Board Test Result, Sarkari Result Up Board Class Tenth, Up Board Result Date, Sarkari Result Up Board 2024 In Hindi And So On. Will Continue To Get Refreshes.
          </AnnouncementBar>
          <AnnouncementBar title="Sarkariresult">
            Sarkariresult: Data Presents To You All The Most Recent News Like Outcome, Online Structure, Naukri, Test Result 2025, Work Result, Information Hindi Test, Government Work Data, And Updates, Notice And Output Gives.
          </AnnouncementBar>
          <AnnouncementBar title="SarkariResultsNow">
            SarkariResultsNow.in is an independent portal dedicated to helping job seekers, students, and aspirants stay updated with the latest government job notifications, exam results, admit cards, answer keys, and current affairs.
            <br />
            <br />
            Our mission is to make public information more accessible by presenting updates from official government portals in a clean and organized format. We do not represent any government body, and all data shared here is sourced from publicly available and verified official announcements.
            <br />
            <br />
            If you have questions or concerns, feel free to contact us via the{' '}
            <Link href="/contact" style={{ textDecoration: "underline", color: "#1a124d" }}>
              Contact
            </Link>{' '}
            page.
          </AnnouncementBar>
        </div>
      </div>
      <Footer />
    </>
  );
}
