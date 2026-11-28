import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Disclaimer",
  description:
    "Sarkari Results Now is an independent portal, not a government website. Always verify job, result and admit card details on the official website.",
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer">
      <h2>Not a government website</h2>
      <p>
        Sarkari Results Now (SarkariResultsNow.com) is a private, independent information portal. It is
        not owned, operated or endorsed by any government, ministry, recruitment board, university or
        public sector organisation.
      </p>

      <h2>Accuracy of information</h2>
      <p>
        We prepare job notifications, results, admit cards and answer keys from official sources
        and try to keep them accurate and up to date. Errors can still happen, and organisations often
        change dates, vacancies or rules after publication. The official notification and official
        website are always the final authority. Please verify every detail there before applying, paying
        a fee or making any decision.
      </p>

      <h2>No guarantee of jobs</h2>
      <p>
        We do not recruit for any post, do not guarantee selection, and never ask candidates for money
        to get a job. If anyone asks you for payment in our name, do not pay and report it to us.
      </p>

      <h2>Mock tests</h2>
      <p>
        Our free mock tests are for practice only. Questions and answers are prepared in good faith but
        may contain mistakes and do not represent the actual exam paper.
      </p>

      <h2>External links</h2>
      <p>
        We link to official and third-party websites for your convenience. We are not responsible for
        their content, availability or privacy practices.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        Sarkari Results Now is not liable for any loss or damage arising from the use of information on
        this website. See our <Link href="/terms">Terms &amp; Conditions</Link> for more.
      </p>

      <h2>Report an error</h2>
      <p>
        If you spot incorrect information, email{" "}
        <a href="mailto:support@sarkariresultsnow.com">support@sarkariresultsnow.com</a> with the page
        link, and we will check and correct it.
      </p>
    </LegalPage>
  );
}
