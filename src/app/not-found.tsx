import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Page Not Found</h1>
        <p className="mt-3 text-gray-700">
          This page may have been moved or removed. Try one of these sections instead:
        </p>
        <ul className="mt-6 flex flex-wrap justify-center gap-3">
          {[
            ["/jobs", "Latest Jobs"],
            ["/results", "Results"],
            ["/admit-cards", "Admit Cards"],
            ["/answer-keys", "Answer Keys"],
            ["/quizzes", "Free Mock Tests"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="inline-block rounded border px-4 py-2 text-blue-700 hover:bg-blue-50">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}
