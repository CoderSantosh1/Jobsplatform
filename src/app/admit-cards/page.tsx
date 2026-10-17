import SectionList from "@/components/seo/SectionList";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Admit Card 2026 – Download Hall Ticket",
  description:
    "Download admit cards and hall tickets 2026 for SSC, Railway, Bank, Police and State recruitment exams with exam date and official link.",
  path: "/admit-cards",
});

export default function Page() {
  return (
    <SectionList
      section="admit-cards"
      heading="Admit Card 2026 – Download Hall Ticket"
      intro="Download admit cards, hall tickets and exam city slips for upcoming government exams. Each page has the official download link and step-by-step instructions."
    />
  );
}
