import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "./Breadcrumbs";
import JsonLd from "./JsonLd";
import { connectToDatabase } from "@/lib/db";
import { SECTION_LABEL } from "@/lib/content";
import Job from "@/lib/models/Job";
import Result from "@/lib/models/Result";
import AdmitCard from "@/lib/models/AdmitCard";
import AnswerKey from "@/lib/models/AnswerKey";
import Admission from "@/lib/models/Admission";
import { detailPath, type Section } from "@/lib/slug";
import { SITE_URL, isPastDeadline, parseDate } from "@/lib/seo";
import { EXAMS } from "@/lib/exams";
import { SECTION_GUIDES } from "@/lib/section-guides";

type ListSection = Exclude<Section, "news">;

const OTHER_LINKS = [
  { href: "/jobs", label: "Latest Jobs" },
  { href: "/results", label: "Results" },
  { href: "/admit-cards", label: "Admit Cards" },
  { href: "/answer-keys", label: "Answer Keys" },
  { href: "/admissions", label: "Admissions" },
  { href: "/news", label: "Exam News" },
  { href: "/test-series", label: "Free Test Series" },
];
type Row = { _id: string; title: string; lastDateApplyOnline?: string; applicationDeadline?: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
const QUERIES: Record<ListSection, () => Promise<any[]>> = {
  jobs: () =>
    Job.find({ status: "published" }).sort({ createdAt: -1 }).select("_id title lastDateApplyOnline applicationDeadline").lean(),
  results: () => Result.find().sort({ resultDate: -1 }).select("_id title").lean(),
  "admit-cards": () => AdmitCard.find().sort({ createdAt: -1 }).select("_id title").lean(),
  "answer-keys": () => AnswerKey.find().sort({ postedDate: -1 }).select("_id title").lean(),
  admissions: () => Admission.find().sort({ postedDate: -1 }).select("_id title").lean(),
};

/** Server-rendered list of every post in a section, so crawlers see all links in the HTML. */
export default async function SectionList({
  section,
  heading,
  intro,
}: {
  section: ListSection;
  heading: string;
  intro: string;
}) {
  await connectToDatabase();
  const rows: Row[] = JSON.parse(JSON.stringify(await QUERIES[section]()));
  const guide = SECTION_GUIDES[section];

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-6 w-full">
        <Breadcrumbs items={[{ name: SECTION_LABEL[section], href: `/${section}` }]} />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: heading,
            itemListElement: rows.slice(0, 50).map((r, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_URL}${detailPath(section, r)}`,
              name: r.title,
            })),
          }}
        />
        <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">{heading}</h1>
        <p className="mb-6 text-gray-700 max-w-4xl">{intro}</p>
        <div className="w-full overflow-x-auto">
          <table className="w-full table-fixed border-collapse border border-orange-500 text-sm md:text-base">
            <thead>
              <tr className="bg-red-600 text-[#FCFCD8] font-bold text-xl">
                <th className="p-2 text-center">{SECTION_LABEL[section]}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-t-2 border-red-500 bg-[#FFF8CC]">
                  <td className="p-2 text-center break-words">
                    <Link href={detailPath(section, r)} className="text-[#014F59] hover:underline hover:text-blue-800">
                      {r.title}
                    </Link>
                    {section === "jobs" && isPastDeadline(parseDate(r.lastDateApplyOnline) ?? parseDate(r.applicationDeadline)) && (
                      <span className="ml-2 text-xs font-semibold text-gray-500">(Closed)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="text-center text-gray-600 mt-8">No updates available at the moment.</p>}
        </div>

        <section className="mt-8 max-w-4xl">
          <h2 className="text-xl font-bold text-red-800 mb-2">{guide.heading}</h2>
          <ol className="list-decimal pl-6 space-y-1 text-gray-800">
            {guide.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>

        <section className="mt-6 max-w-4xl">
          <h2 className="text-xl font-bold text-red-800 mb-2">Frequently Asked Questions</h2>
          <dl className="space-y-3">
            {guide.faqs.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold">{f.q}</dt>
                <dd className="text-gray-800">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <nav aria-label="Popular exams" className="mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Popular Exams</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {EXAMS.map((e) => (
              <li key={e.slug}>
                <Link href={`/${e.slug}`} className="inline-block rounded-full border px-3 py-1 text-blue-700 hover:bg-blue-50">
                  {e.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Other sections" className="mt-6 mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Browse More</h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-blue-700">
            {OTHER_LINKS.filter((l) => l.href !== `/${section}`).map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
      <Footer />
    </>
  );
}
