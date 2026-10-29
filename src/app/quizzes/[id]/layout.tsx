import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import { detailMetadata, getQuizMeta, quizExists } from "@/lib/seo-server";
import { SITE_NAME, SITE_URL, clip } from "@/lib/seo";
import { idFromParam, quizPath, testSeriesPath } from "@/lib/slug";

// Quiz shells are the same for everyone: cache them at the CDN and rebuild every 10 minutes.
export const revalidate = 600;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return detailMetadata("quizzes", id);
}

export default async function Layout({ children, params }: Props & { children: React.ReactNode }) {
  const { id } = await params;
  const quizId = idFromParam(id);
  // A deleted or mistyped quiz must answer 404, not a 200 "noindex" page (which Google reports as a soft 404).
  // If the database is unreachable, quizExists is null and the page renders as before.
  if ((await quizExists(quizId)) === false) notFound();
  const quiz = await getQuizMeta(quizId);
  return (
    <>
      {quiz && (
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Quiz",
              name: quiz.title,
              description: clip(quiz.description, 200),
              url: `${SITE_URL}${quizPath(quiz as { _id: string; title: string })}`,
              educationalLevel: "Competitive exam",
              about: quiz.subcategory || quiz.category,
              inLanguage: ["en", "hi"],
              timeRequired: quiz.timeLimit ? `PT${quiz.timeLimit}M` : undefined,
              isAccessibleForFree: true,
              provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                { "@type": "ListItem", position: 2, name: "Test Series", item: `${SITE_URL}/test-series` },
                ...(quiz.category
                  ? [{ "@type": "ListItem", position: 3, name: quiz.category, item: `${SITE_URL}${testSeriesPath(quiz.category)}` }]
                  : []),
                ...(quiz.category && quiz.subcategory
                  ? [{ "@type": "ListItem", position: 4, name: quiz.subcategory, item: `${SITE_URL}${testSeriesPath(quiz.category, quiz.subcategory)}` }]
                  : []),
              ],
            },
          ]}
        />
      )}
      {children}
    </>
  );
}
