import { SITEMAP_NAMES, XML_HEADERS, getSitemapEntries, urlsetXml, type SitemapName } from "@/lib/sitemap";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return SITEMAP_NAMES.map((name) => ({ name: `${name}.xml` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const name = (await params).name.replace(/\.xml$/, "") as SitemapName;
  if (!SITEMAP_NAMES.includes(name)) return new Response("Not found", { status: 404 });
  try {
    return new Response(urlsetXml(await getSitemapEntries(name)), { headers: XML_HEADERS });
  } catch (error) {
    // A 503 tells Google to retry later instead of caching an empty sitemap.
    console.error(`sitemap ${name} failed`, error);
    return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "Retry-After": "600" } });
  }
}
