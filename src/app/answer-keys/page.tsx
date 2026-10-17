import SectionList from "@/components/seo/SectionList";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Answer Key 2026 – Download Official PDF",
  description:
    "Download official answer keys 2026 for SSC, Railway, Bank, Police and State exams, check your score and raise objections.",
  path: "/answer-keys",
});

export default function Page() {
  return (
    <SectionList
      section="answer-keys"
      heading="Answer Key 2026 – Official Answer Keys"
      intro="Official provisional and final answer keys for government recruitment exams. Check your expected score and raise objections before the last date."
    />
  );
}
