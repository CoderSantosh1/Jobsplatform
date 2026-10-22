import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import PostFooter from "@/components/seo/PostFooter";
import { getDetail, getLatest, getRelated } from "@/lib/content";
import { getTestLinks } from "@/lib/quizzes";
import { detailMetadata } from "@/lib/seo-server";
import { detailSegment } from "@/lib/slug";
import { SITE_NAME, SITE_URL, clip, displayDate, isBlank } from "@/lib/seo";

export const revalidate = 300;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return detailMetadata("results", (await params).id);
}

const isUrl = (value: string) => /^https?:\/\//i.test(value);

export default async function ResultDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getDetail("results", id);
  if (!result) notFound();
  const segment = detailSegment(result);
  if (decodeURIComponent(id) !== segment) permanentRedirect(`/results/${segment}`);

  const [related, latest, testLinks] = await Promise.all([
    getRelated("results", result),
    getLatest("results", result._id),
    getTestLinks(result.title),
  ]);

  const downloadLinks = [result.downloadLink, result.downloadLink1, result.downloadLink2, result.downloadLink3]
    .filter((l): l is string => typeof l === "string" && !isBlank(l))
    .filter((l, i, all) => all.indexOf(l) === i);
  const notification = (result.downloadnotificationresultlis ?? []).find((l: string) => !isBlank(l));
  const official = (result.officalwebsites ?? []).find((l: string) => !isBlank(l));
  const shortTitle = clip(result.title, 60);

  const rows = [
    ...downloadLinks.map((link, i) => ({
      label: downloadLinks.length > 1 ? `Download Result (Link ${i + 1})` : "Download Result",
      link,
      text: `Download ${shortTitle}${downloadLinks.length > 1 ? ` – Link ${i + 1}` : ""}`,
    })),
    notification && { label: "Result Notification", link: notification, text: `${shortTitle} notice PDF` },
    result.youtubeLink && !isBlank(result.youtubeLink) && {
      label: "How to Check (Video)",
      link: result.youtubeLink,
      text: `How to check ${shortTitle}`,
    },
    official && { label: "Official Website", link: official, text: `${result.organization} official website` },
  ].filter(Boolean) as { label: string; link: string; text: string }[];

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: clip(result.title, 110),
    description: clip(result.description, 200),
    datePublished: new Date(result.createdAt ?? result.resultDate ?? Date.now()).toISOString(),
    dateModified: new Date(result.updatedAt ?? result.createdAt ?? Date.now()).toISOString(),
    author: { "@type": "Organization", name: `${SITE_NAME} Team`, url: `${SITE_URL}/about` },
    publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` } },
    mainEntityOfPage: `${SITE_URL}/results/${segment}`,
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-6">
        <article className="max-w-5xl mx-auto bg-white shadow-lg p-4 md:p-6">
          <Breadcrumbs items={[{ name: "Results", href: "/results" }, { name: result.title, href: `/results/${segment}` }]} />
          <JsonLd data={article} />

          <h1 className="text-red-600 font-semibold text-xl lg:text-2xl">{result.title}</h1>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-red-500 font-semibold">Organisation</dt>
              <dd>{result.organization}</dd>
            </div>
            {result.resultDate && (
              <div>
                <dt className="text-red-500 font-semibold">Result Date</dt>
                <dd>{displayDate(result.resultDate)}</dd>
              </div>
            )}
          </dl>

          {!isBlank(result.description) && (
            <p className="mt-4 text-gray-800 whitespace-pre-line">{result.description}</p>
          )}

          <section className="mt-5">
            <h2 className="text-lg font-bold text-red-800 mb-2">How to Check {shortTitle}</h2>
            <ol className="list-decimal pl-6 space-y-1 text-gray-800">
              <li>Open the result link below or go to the {result.organization} official website.</li>
              <li>Click on the result link for this exam on the home page.</li>
              <li>Enter your roll number / registration number and date of birth, as asked.</li>
              <li>Your result or the merit list PDF will open. Search for your roll number in the PDF.</li>
              <li>Download the result and keep a printout for document verification.</li>
            </ol>
          </section>

          <section className="mt-5">
            <h2 className="text-lg font-bold text-red-800 mb-2">What Next?</h2>
            <p className="text-gray-800">
              Candidates who qualify move to the next stage of selection mentioned in the official notification, such
              as the next exam stage, physical test, skill test, document verification or medical examination. Keep
              checking the related updates below and the official website for the schedule of the next stage.
            </p>
          </section>

          {rows.length > 0 && (
            <section className="mt-5 border border-gray-300 rounded">
              <h2 className="text-center text-xl font-bold text-green-700 py-3 border-b">Important Links</h2>
              {rows.map((r) => (
                <div key={r.label} className="flex justify-between gap-4 px-4 py-3 border-b last:border-b-0">
                  <span className="font-semibold text-fuchsia-700">{r.label}</span>
                  {isUrl(r.link) ? (
                    <a href={r.link} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-700 font-semibold hover:underline text-right">
                      {r.text}
                    </a>
                  ) : (
                    <span className="text-blue-700 text-right">{r.link}</span>
                  )}
                </div>
              ))}
            </section>
          )}

          <PostFooter
            updatedAt={result.updatedAt ?? result.createdAt}
            officialUrl={official}
            related={related}
            testLinks={testLinks}
            latest={latest}
            latestTitle="More Latest Results"
          />
        </article>
      </main>
      <Footer />
    </>
  );
}
