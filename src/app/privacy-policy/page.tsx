import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How Sarkari Results Now collects, uses and protects your information, including cookies, Google AdSense advertising and Google Analytics.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This Privacy Policy explains what information Sarkari Results Now
        (&quot;we&quot;, &quot;us&quot;, SarkariResultsNow.com) collects when you use this website and how
        we use it. By using the website you agree to this policy.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account information:</strong> if you register to take mock tests, we store your name,
          email address and an encrypted password, along with your test attempts and scores.
        </li>
        <li>
          <strong>Messages:</strong> information you send us by email or through the contact form.
        </li>
        <li>
          <strong>Usage data:</strong> pages visited, device and browser type, approximate location and
          referring site, collected automatically through cookies and analytics tools.
        </li>
      </ul>

      <h2>How we use information</h2>
      <ul>
        <li>To provide mock tests, save your progress and show your results.</li>
        <li>To reply to your questions and fix reported errors.</li>
        <li>To understand how the website is used and improve its content and speed.</li>
        <li>To show advertising that keeps the website free.</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>Cookies</h2>
      <p>
        We use cookies to keep you signed in, remember preferences and measure traffic. You can block
        or delete cookies in your browser settings; some features, such as signing in, may then stop
        working.
      </p>

      <h2>Advertising (Google AdSense)</h2>
      <p>
        We use Google AdSense to show ads. Google and its partners use cookies, including the DoubleClick
        cookie, to serve ads based on your visits to this and other websites. You can opt out of
        personalised advertising at{" "}
        <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
          Google Ads Settings
        </a>{" "}
        or at{" "}
        <a href="https://www.aboutads.info/choices" target="_blank" rel="noopener noreferrer">
          aboutads.info
        </a>
        . Learn more in{" "}
        <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
          how Google uses data from sites that use its services
        </a>
        .
      </p>

      <h2>Analytics</h2>
      <p>
        We use Google Analytics and Vercel Analytics to measure visits and page performance. These tools
        collect anonymous usage data. You can opt out of Google Analytics with the{" "}
        <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
          Google Analytics opt-out add-on
        </a>
        .
      </p>

      <h2>Third-party links</h2>
      <p>
        Our posts link to official government and recruitment websites. Their privacy practices are
        their own, and we are not responsible for them.
      </p>

      <h2>Data security and retention</h2>
      <p>
        We use reasonable technical measures to protect your information and keep it only as long as
        needed for the purposes above. You can ask us to access, correct or delete your account data
        by emailing us.
      </p>

      <h2>Children</h2>
      <p>
        This website is meant for exam aspirants and is not directed at children under 13. We do not
        knowingly collect personal information from children under 13.
      </p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy from time to time. The date at the top shows the latest version.</p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Email{" "}
        <a href="mailto:support@sarkariresultsnow.com">support@sarkariresultsnow.com</a> or visit our{" "}
        <Link href="/contact">Contact page</Link>.
      </p>
    </LegalPage>
  );
}
