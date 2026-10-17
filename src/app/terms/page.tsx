import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms & Conditions",
  description:
    "Terms and conditions for using Sarkari Results Now, including mock test accounts, acceptable use, intellectual property and liability.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions">
      <p>
        These terms apply to your use of SarkariResultsNow.com (&quot;the website&quot;). By using the
        website you accept them. If you do not agree, please do not use the website.
      </p>

      <h2>Use of the website</h2>
      <ul>
        <li>The website is provided free of charge for personal, non-commercial use.</li>
        <li>You must not copy, scrape or republish our content in bulk without written permission.</li>
        <li>
          You must not try to disrupt the website, access other users&apos; accounts or the admin area, or
          upload harmful code.
        </li>
      </ul>

      <h2>Accounts</h2>
      <p>
        To take some mock tests you may create an account. Keep your password safe; you are responsible
        for activity under your account. We may suspend accounts that misuse the website.
      </p>

      <h2>Information on the website</h2>
      <p>
        Content is provided for general information only and may change without notice. Always rely on
        the official notification and official website. Read our{" "}
        <Link href="/disclaimer">Disclaimer</Link> for details.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The website design, text written by us and mock test questions belong to Sarkari Results Now.
        Official notifications, logos and documents belong to their respective organisations.
      </p>

      <h2>Advertising and third parties</h2>
      <p>
        The website shows ads and links to third-party websites. We are not responsible for the products,
        services or content of advertisers or linked websites. See our{" "}
        <Link href="/privacy-policy">Privacy Policy</Link> for how ads use cookies.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the extent permitted by law, Sarkari Results Now is not liable for any direct or indirect loss
        arising from use of the website or reliance on its content.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms at any time. Continued use after a change means you accept it.</p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India.</p>

      <h2>Contact</h2>
      <p>
        Questions? Email{" "}
        <a href="mailto:support@sarkariresultsnow.com">support@sarkariresultsnow.com</a>.
      </p>
    </LegalPage>
  );
}
