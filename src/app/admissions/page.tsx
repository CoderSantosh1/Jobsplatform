import SectionList from "@/components/seo/SectionList";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Admission 2026 – University & College Forms",
  description:
    "Latest university and college admission 2026 notifications with eligibility, application dates and official form links.",
  path: "/admissions",
});

export default function Page() {
  return (
    <SectionList
      section="admissions"
      heading="Admission 2026 – University & College Admission Forms"
      intro="Latest admission notifications from universities, colleges and entrance exams, with eligibility, last date and the official application link."
    />
  );
}
