import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { detailMetadata, getQuizMeta } from "@/lib/seo-server";
import { SITE_NAME, SITE_URL, clip } from "@/lib/seo";
import { testSeriesPath } from "@/lib/slug";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return detailMetadata("quizzes", id);
}

export default async function Layout({ children, params }: Props & { children: React.ReactNode }) {
  const { id } = await params;
  const quiz = await getQuizMeta(id);
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
              url: `${SITE_URL}/quizzes/${quiz._id}/instructions`,
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
                { "@type": "ListItem", position: 2, name: "Free Mock Tests", item: `${SITE_URL}/quizzes` },
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
