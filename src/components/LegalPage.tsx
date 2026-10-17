import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const LAST_UPDATED = "18 October 2026";

/** Shared shell for About, Privacy Policy, Disclaimer and Terms pages. */
export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white rounded shadow p-6 text-gray-800 leading-relaxed space-y-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#1a124d] [&_h2]:mt-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:text-blue-600 [&_a]:underline">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a124d]">{title}</h1>
          <p className="text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}
