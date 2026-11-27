import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";
import { connectToDatabase } from "@/lib/db";
import News from "@/lib/models/News";
import { pageMetadata } from "@/lib/seo";
import { detailPath } from "@/lib/slug";
import { PUBLIC_FILTER } from "@/lib/content";
import { withoutRedirectedPosts } from "@/lib/live-redirects";
import { NEWS_GUIDE } from "@/lib/section-guides";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Latest Sarkari Exam News 2026",
  description:
    "Latest exam and recruitment news 2026: notification updates, exam date changes, vacancy increases and important announcements for government exams.",
  path: "/news",
});

interface NewsItem {
  _id: string;
  title: string;
  imageUrl?: string;
  image?: string;
}

function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export default async function NewsListPage() {
  await connectToDatabase();
  const news = await withoutRedirectedPosts(
    "news",
    toPlain(await News.find(PUBLIC_FILTER.news).sort({ postedDate: -1 }).select("_id title").lean()) as unknown as NewsItem[],
  );

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-8 w-full">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Latest News</h1>
        <div className="w-full overflow-x-auto hide-scrollbar">
          <table className="w-full table-fixed border-collapse border border-orange-500 text-xs sm:text-sm md:text-base">
            <thead>
              <tr className="bg-red-600 text-[#FCFCD8] font-bold">
                <th className="p-2 text-center break-words whitespace-normal">Latest News</th>
              </tr>
            </thead>
            <tbody>
              {news.map((item) => (
                <tr key={item._id} className="border-t-2 border-red-500 bg-[#FFF8CC]">
                  <td className="p-2 border-x text-left align-top break-words whitespace-pre-wrap flex flex-col sm:flex-row items-center gap-2 justify-center">
                    <Link href={detailPath("news", item)} className="text-[#014F59] hover:underline hover:text-blue-800">
                      {item.title}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {news.length === 0 && (
            <div className="text-center text-gray-600 dark:text-gray-400 mt-8">
              No news available at the moment.
            </div>
          )}
        </div>

        <section className="mt-8 max-w-4xl">
          <h2 className="text-xl font-bold text-red-800 mb-2">{NEWS_GUIDE.heading}</h2>
          <ol className="list-decimal pl-6 space-y-1 text-gray-800">
            {NEWS_GUIDE.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>

        <section className="mt-6 max-w-4xl">
          <h2 className="text-xl font-bold text-red-800 mb-2">Frequently Asked Questions</h2>
          <dl className="space-y-3">
            {NEWS_GUIDE.faqs.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold">{f.q}</dt>
                <dd className="text-gray-800">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <Footer />
    </>
  );
}
