import SectionList from "@/components/seo/SectionList";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Latest Govt Jobs 2026 – Sarkari Naukri Notifications",
  description:
    "Latest government job notifications 2026 for SSC, Railway, Bank, Police, Defence and State PSC recruitment with vacancy, eligibility, last date and apply link.",
  path: "/jobs",
});

export default function Page() {
  return (
    <SectionList
      section="jobs"
      heading="Latest Govt Jobs 2026 – Sarkari Naukri"
      intro="All the latest government job notifications for SSC, Railway, Bank, Police, Defence, Teaching and State PSC recruitment. Open any job to see vacancy details, eligibility, age limit, application fee, important dates and the official apply link."
    />
  );
}
