import Link from "next/link";
import { SECTION_LABEL, type RelatedLink } from "@/lib/content";
import type { Section } from "@/lib/slug";

/** Latest jobs, admit cards, answer keys and results whose title mentions an exam. */
export default function ExamUpdates({ name, posts }: { name: string; posts: Record<Section, RelatedLink[]> }) {
  const sections = (Object.keys(posts) as Section[]).filter((s) => posts[s].length > 0);
  if (!sections.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-red-800 mb-3">Latest {name} Updates</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <div key={s} className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-2">
              {name} {SECTION_LABEL[s]}
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {posts[s].map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className="text-blue-700 hover:underline">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
