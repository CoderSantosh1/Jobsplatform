import React from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "@/components/Footer";

const EMAIL = "support@sarkariresultsnow.com";

const TOPICS = [
  {
    title: "Report a wrong date, link or detail",
    text: "If a last date, vacancy count, fee or download link on one of our posts does not match the official notification, tell us which post it is and where the official information is published, and we will check and correct it.",
  },
  {
    title: "Problems with a mock test",
    text: "Tell us the test name and the question number if a question, option or answer key in a free mock test looks wrong, or if a test does not load or submit.",
  },
  {
    title: "Account and sign-in help",
    text: "If you cannot sign in with Google or email, or your saved test results are missing, write to us from the email address you use on the site.",
  },
  {
    title: "Feedback and suggestions",
    text: "Suggestions for exams, test series or features you would like to see are always welcome.",
  },
];

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto p-6 bg-[#FFF] rounded shadow mt-10 mb-10">
        <h1 className="text-2xl font-bold mb-4 text-[#1a124d]">Contact Us</h1>
        <p className="mb-6">
          Have questions, feedback, or concerns? Email us at{" "}
          <a href={`mailto:${EMAIL}`} className="text-blue-600 underline">
            {EMAIL}
          </a>{" "}
          or use the form below, which opens a new email in your mail app.
        </p>

        <section aria-labelledby="topics" className="mb-8">
          <h2 id="topics" className="text-xl font-semibold mb-3 text-[#1a124d]">
            What can we help with?
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {TOPICS.map((t) => (
              <div key={t.title} className="rounded border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900">{t.title}</h3>
                <p className="mt-1 text-sm text-gray-700">{t.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="include" className="mb-8">
          <h2 id="include" className="text-xl font-semibold mb-3 text-[#1a124d]">
            Please include
          </h2>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>The link to the page on our site you are writing about.</li>
            <li>What is wrong or what you need, in a few lines.</li>
            <li>For corrections, the link to the official notification or website.</li>
          </ul>
        </section>

        <section aria-labelledby="note" className="mb-8 rounded border border-amber-200 bg-amber-50 p-4">
          <h2 id="note" className="font-semibold text-amber-900">
            Please note
          </h2>
          <p className="mt-1 text-sm text-amber-900">
            Sarkari Results Now is an independent portal, not a government website. We cannot accept job applications, change
            exam results, issue admit cards or answer questions about your application status. For those, contact the
            recruiting body through its official website. See our{" "}
            <Link href="/disclaimer" className="underline">
              disclaimer
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="form" className="mb-8">
          <h2 id="form" className="text-xl font-semibold mb-3 text-[#1a124d]">
            Send us a message
          </h2>
          {/* Opens the visitor's mail app (POST + text/plain), so nothing typed here ends up in the page URL. */}
          <form action={`mailto:${EMAIL}`} method="post" encType="text/plain" className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Your name
              <input type="text" name="name" autoComplete="name" className="border rounded px-3 py-2" required />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Your email
              <input type="email" name="email" autoComplete="email" className="border rounded px-3 py-2" required />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Your message
              <textarea name="message" className="border rounded px-3 py-2" rows={5} required />
            </label>
            <button type="submit" className="self-start bg-[#1a124d] text-white px-4 py-2 rounded hover:bg-[#2d1e6b]">
              Send Message
            </button>
          </form>
        </section>

        <section aria-labelledby="quick" className="text-sm text-gray-700">
          <h2 id="quick" className="text-xl font-semibold mb-3 text-[#1a124d]">
            Looking for something else?
          </h2>
          <p>
            Browse the <Link href="/jobs" className="text-blue-600 underline">latest government jobs</Link>,{" "}
            <Link href="/results" className="text-blue-600 underline">exam results</Link>,{" "}
            <Link href="/admit-cards" className="text-blue-600 underline">admit cards</Link>,{" "}
            <Link href="/answer-keys" className="text-blue-600 underline">answer keys</Link> or practise with our{" "}
            <Link href="/test-series" className="text-blue-600 underline">free mock tests</Link>.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
