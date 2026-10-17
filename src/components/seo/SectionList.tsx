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
import { SITE_URL } from "@/lib/seo";

type ListSection = Exclude<Section, "news">;
type Row = { _id: string; title: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
const QUERIES: Record<ListSection, () => Promise<any[]>> = {
  jobs: () => Job.find({ status: "published" }).sort({ createdAt: -1 }).select("_id title").lean(),
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="text-center text-gray-600 mt-8">No updates available at the moment.</p>}
        </div>
      </main>
      <Footer />
    </>
  );
}
