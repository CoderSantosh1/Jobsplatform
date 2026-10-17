import SectionList from "@/components/seo/SectionList";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Sarkari Result 2026 – Latest Exam Results",
  description:
    "Latest Sarkari Result 2026 for SSC, UPSC, Railway, Bank, Police and State exams with direct download links, cut-off and next stage details.",
  path: "/results",
});

export default function Page() {
  return (
    <SectionList
      section="results"
      heading="Sarkari Result 2026 – Latest Exam Results"
      intro="Latest results, merit lists and cut-offs from central and state recruitment exams. Each result page has the direct download link, steps to check your result and what comes next in the selection process."
    />
  );
}
