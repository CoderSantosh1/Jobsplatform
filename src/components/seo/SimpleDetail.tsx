import { notFound, permanentRedirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "./Breadcrumbs";
import JsonLd from "./JsonLd";
import PostFooter from "./PostFooter";
import { SECTION_LABEL, getDetail, getLatest, getRelated, type Doc } from "@/lib/content";
import { detailSegment, type Section } from "@/lib/slug";
import { SITE_NAME, SITE_URL, clip, displayDate, isBlank } from "@/lib/seo";

type SimpleSection = Exclude<Section, "jobs" | "results">;

type Config = {
  /** Main link for the reader, e.g. the admit card download URL. */
  link: (d: Doc) => string | undefined;
  linkLabel: string;
  linkText: (d: Doc) => string;
  dateLabel: string;
  date: (d: Doc) => string | Date | undefined;
  body: (d: Doc) => string | undefined;
  steps?: { title: (d: Doc) => string; items: (d: Doc) => string[] };
};

const CONFIG: Record<SimpleSection, Config> = {
  "admit-cards": {
    link: (d) => d.downloadAdmitcardLink,
    linkLabel: "Download Admit Card",
    linkText: (d) => `Download ${clip(d.title, 60)}`,
    dateLabel: "Exam / Last Date",
    date: (d) => d.applicationDeadline,
    body: (d) => d.description,
    steps: {
      title: (d) => `How to Download ${clip(d.title, 70)}`,
      items: (d) => [
        `Open the admit card link below or the ${d.organization} official website.`,
        "Click on the admit card / call letter link for this exam.",
        "Log in with your registration number and date of birth or password.",
        "Check your name, photo, exam date, reporting time and centre address carefully.",
        "Download and print the admit card, and carry it with a valid photo ID to the exam centre.",
      ],
    },
  },
  "answer-keys": {
    link: (d) => d.downloadLink,
    linkLabel: "Download Answer Key",
    linkText: (d) => `${clip(d.title, 60)} PDF`,
    dateLabel: "Released On",
    date: (d) => d.postedDate ?? d.createdAt,
    body: (d) => d.content,
    steps: {
      title: (d) => `How to Check ${clip(d.title, 70)}`,
      items: (d) => [
        `Open the answer key link below or the ${d.organization} official website.`,
        "Log in or open the answer key PDF for your exam and shift.",
        "Match your responses with the official answers to estimate your score.",
        "If you find a wrong answer, raise an objection online with proof before the last date.",
        "The final answer key and result are released after objections are reviewed.",
      ],
    },
  },
  admissions: {
    link: (d) => d.applicationLink,
    linkLabel: "Apply Online",
    linkText: (d) => `Apply for ${clip(d.title, 50)}`,
    dateLabel: "Last Date",
    date: (d) => d.applicationDeadline,
    body: (d) => d.content,
  },
  news: {
    link: () => undefined,
    linkLabel: "",
    linkText: () => "",
    dateLabel: "Posted On",
    date: (d) => d.postedDate ?? d.createdAt,
    body: (d) => d.content,
  },
};

export default async function SimpleDetail({ section, param }: { section: SimpleSection; param: string }) {
  const doc = await getDetail(section, param);
  if (!doc) notFound();
  const segment = detailSegment(doc);
  if (decodeURIComponent(param) !== segment) permanentRedirect(`/${section}/${segment}`);

  const cfg = CONFIG[section];
  const [related, latest] = await Promise.all([getRelated(section, doc), getLatest(section, doc._id)]);
  const link = cfg.link(doc);
  const hasLink = !isBlank(link);
  const body = cfg.body(doc);
  const date = displayDate(cfg.date(doc));
  const requirements: string[] = (doc.requirements ?? []).filter((r: unknown) => !isBlank(r));
  const path = `/${section}/${segment}`;

  const article = {
    "@context": "https://schema.org",
    "@type": section === "news" ? "NewsArticle" : "Article",
    headline: clip(doc.title, 110),
    description: clip(body || doc.title, 200),
    datePublished: new Date(doc.createdAt ?? doc.postedDate ?? Date.now()).toISOString(),
    dateModified: new Date(doc.updatedAt ?? doc.postedDate ?? doc.createdAt ?? Date.now()).toISOString(),
    author: { "@type": "Organization", name: `${SITE_NAME} Team`, url: `${SITE_URL}/about` },
    publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` } },
    mainEntityOfPage: `${SITE_URL}${path}`,
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6">
        <article className="max-w-5xl mx-auto bg-white shadow-lg p-4 md:p-6">
          <Breadcrumbs items={[{ name: SECTION_LABEL[section], href: `/${section}` }, { name: doc.title, href: path }]} />
          <JsonLd data={article} />

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{doc.title}</h1>
          <p className="mt-1 text-gray-700">
            {doc.organization}
            {!isBlank(doc.location) && ` · ${doc.location}`}
            {date && (
              <>
                {" · "}
                {cfg.dateLabel}: <span className="text-red-600 font-semibold">{date}</span>
              </>
            )}
          </p>

          {doc.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- inline data URL from the database
            <img src={doc.imageUrl} alt={doc.title} loading="lazy" className="mt-4 mx-auto max-h-[480px] w-auto h-auto rounded border" />
          )}

          {!isBlank(body) && <div className="mt-4 text-gray-800 whitespace-pre-line">{body}</div>}

          {requirements.length > 0 && (
            <section className="mt-5">
              <h2 className="text-lg font-bold text-red-800 mb-2">Eligibility / Requirements</h2>
              <ul className="list-disc pl-6 space-y-1">
                {requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </section>
          )}

          {cfg.steps && (
            <section className="mt-5">
              <h2 className="text-lg font-bold text-red-800 mb-2">{cfg.steps.title(doc)}</h2>
              <ol className="list-decimal pl-6 space-y-1 text-gray-800">
                {cfg.steps.items(doc).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </section>
          )}

          {hasLink && (
            <section className="mt-5 border border-gray-300 rounded">
              <h2 className="text-center text-xl font-bold text-green-700 py-3 border-b">Important Links</h2>
              <div className="flex justify-between gap-4 px-4 py-3">
                <span className="font-semibold text-fuchsia-700">{cfg.linkLabel}</span>
                <a href={link} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-700 font-semibold hover:underline text-right">
                  {cfg.linkText(doc)}
                </a>
              </div>
            </section>
          )}

          <PostFooter
            updatedAt={doc.updatedAt ?? doc.postedDate ?? doc.createdAt}
            officialUrl={hasLink ? link : undefined}
            related={related}
            latest={latest}
            latestTitle={`More ${SECTION_LABEL[section]}`}
          />
        </article>
      </main>
      <Footer />
    </>
  );
}
