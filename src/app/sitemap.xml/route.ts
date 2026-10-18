import { XML_HEADERS, sitemapIndexItems, sitemapIndexXml } from "@/lib/sitemap";

// Sitemap index: one child sitemap per section so each stays small.
export const revalidate = 3600;

export async function GET() {
  try {
    return new Response(sitemapIndexXml(await sitemapIndexItems()), { headers: XML_HEADERS });
  } catch (error) {
    console.error("sitemap index failed", error);
    return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "Retry-After": "600" } });
  }
}
