import Link from "next/link";
import type { RelatedLink } from "@/lib/content";
import type { TestLink } from "@/lib/exam-links";
import { SECTION_LABEL } from "@/lib/content";
import { formatDate } from "@/lib/seo";

const SOCIAL = [
  { name: "Telegram", href: "https://t.me/sarkariresultsnow", cls: "text-blue-600 border-blue-600 hover:bg-blue-600" },
  { name: "WhatsApp", href: "https://chat.whatsapp.com/BA5S3uiul7iHKwi4jIeuuf", cls: "text-green-600 border-green-600 hover:bg-green-600" },
  { name: "Instagram", href: "https://www.instagram.com/sarkariresultsnow/", cls: "text-pink-600 border-pink-600 hover:bg-pink-600" },
];

/** Bylines, source note, community links and related posts shown under every detail page. */
export default function PostFooter({
  updatedAt,
  officialUrl,
  related = [],
  testLinks = [],
  latest = [],
  latestTitle,
}: {
  updatedAt?: string | Date;
  officialUrl?: string;
  related?: RelatedLink[];
  /** Free test pages for the post's exam, listed first under Related Updates. */
  testLinks?: TestLink[];
  latest?: RelatedLink[];
  latestTitle?: string;
}) {
  const updated = formatDate(updatedAt);
  return (
    <div className="mt-6 space-y-4">
      <div className="text-sm text-gray-600 border-t pt-3 space-y-1">
        <p>
          Written by <Link href="/about" className="text-blue-700 hover:underline">Sarkari Results Now Team</Link>
          {updated && <> · Last updated: <time dateTime={new Date(updatedAt as string).toISOString()}>{updated}</time></>}
        </p>
        <p>
          Source:{" "}
          {officialUrl ? (
            <a href={officialUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-700 hover:underline">
              official website
            </a>
          ) : (
            "official notification"
          )}
          . Please verify all details on the official website before applying.
        </p>
      </div>

      <div className="p-4 border border-blue-700 bg-white rounded">
        <p className="text-sm font-medium text-gray-800 mb-3">Get every new job and result on your phone:</p>
        <div className="flex flex-col sm:flex-row gap-3">
          {SOCIAL.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-block w-full sm:w-auto border px-4 py-2 rounded font-semibold hover:text-white transition text-center ${s.cls}`}
            >
              Join {s.name}
            </a>
          ))}
        </div>
      </div>

      {(related.length > 0 || testLinks.length > 0) && (
        <section>
          <h2 className="text-lg font-bold text-red-800 mb-2">Related Updates</h2>
          <ul className="list-disc pl-6 space-y-1">
            {testLinks.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className="font-semibold text-blue-700 hover:underline">
                  {t.title}
                </Link>{" "}
                <span className="text-xs text-gray-500">(Free Mock Test)</span>
              </li>
            ))}
            {related.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="text-blue-700 hover:underline">
                  {r.title}
                </Link>{" "}
                <span className="text-xs text-gray-500">({SECTION_LABEL[r.section]})</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {latest.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-red-800 mb-2">{latestTitle ?? "More Updates"}</h2>
          <ul className="list-disc pl-6 space-y-1">
            {latest.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="text-blue-700 hover:underline">
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
