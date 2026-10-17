import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About Us",
  description:
    "About Sarkari Results Now: an independent portal for government job notifications, exam results, admit cards, answer keys and free mock tests.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <LegalPage title="About Sarkari Results Now">
      <p>
        Sarkari Results Now (SarkariResultsNow.com) is an independent information portal for students
        and job seekers preparing for government exams in India. We publish the latest recruitment
        notifications, exam results, admit cards, answer keys, admission updates and exam news from
        central and state bodies such as SSC, UPSC, IBPS, RRB, State PSCs and police recruitment boards.
      </p>

      <h2>What we do</h2>
      <ul>
        <li>Summarise each official notification: posts, vacancies, eligibility, age limit, fee and important dates.</li>
        <li>Give a direct link to the official website so you can verify every detail at the source.</li>
        <li>Publish results, admit cards and answer keys as soon as they are released.</li>
        <li>Offer free online mock tests and test series in Hindi and English.</li>
      </ul>

      <h2>How we source information</h2>
      <p>
        Every update is prepared from the official notification or the official website of the
        recruiting organisation and written in our own words. Dates and figures can change after
        publication, so always confirm them on the official website before you apply or pay any fee.
      </p>

      <h2>We are not a government website</h2>
      <p>
        Sarkari Results Now is not affiliated with, endorsed by or connected to any government
        department or recruitment body. We never charge candidates for job applications and never
        ask for payment to secure a job. Read our <Link href="/disclaimer">Disclaimer</Link> for details.
      </p>

      <h2>Contact</h2>
      <p>
        Found a mistake or have a suggestion? Email{" "}
        <a href="mailto:support@sarkariresultsnow.com">support@sarkariresultsnow.com</a> or use our{" "}
        <Link href="/contact">Contact page</Link>. We correct verified errors as quickly as possible.
      </p>
    </LegalPage>
  );
}
