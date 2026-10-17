import Link from "next/link";
import JsonLd from "./JsonLd";
import { SITE_URL } from "@/lib/seo";

export type Crumb = { name: string; href: string };

/** Visible breadcrumb trail plus BreadcrumbList structured data. "Home" is added automatically. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ name: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-gray-600 mb-3">
        <ol className="flex flex-wrap items-center gap-1">
          {all.map((c, i) => (
            <li key={c.href} className="flex items-center gap-1 min-w-0">
              {i > 0 && <span aria-hidden="true">›</span>}
              {i === all.length - 1 ? (
                <span aria-current="page" className="text-gray-800 truncate max-w-[60vw] md:max-w-md">
                  {c.name}
                </span>
              ) : (
                <Link href={c.href} className="text-blue-700 hover:underline">
                  {c.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            item: `${SITE_URL}${c.href}`,
          })),
        }}
      />
    </>
  );
}
