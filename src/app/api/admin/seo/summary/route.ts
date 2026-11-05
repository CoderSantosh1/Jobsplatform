import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { connectToDatabase } from "@/lib/db";
import SeoReview from "@/lib/models/SeoReview";
import { contentSeoAudit, sitemapInventory } from "@/lib/admin-seo-server";
import { auditSummary } from "@/lib/admin-seo-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Numbers for the SEO dashboard: sitemap size, content issues, test-series audit and review decisions. Read-only. */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    await connectToDatabase();
    const [content, sitemaps, reviews] = await Promise.all([
      contentSeoAudit(),
      sitemapInventory(),
      SeoReview.aggregate([{ $group: { _id: { kind: "$kind", decision: "$decision" }, n: { $sum: 1 } } }]),
    ]);
    const issues: Record<string, number> = {};
    const bySection: Record<string, { total: number; withIssues: number }> = {};
    for (const row of content) {
      const s = (bySection[row.section] ??= { total: 0, withIssues: 0 });
      s.total++;
      if (row.issues.some((i) => i !== "draft")) s.withIssues++;
      for (const i of row.issues) issues[i] = (issues[i] ?? 0) + 1;
    }
    return NextResponse.json({
      success: true,
      data: {
        content: { total: content.length, issues, bySection },
        sitemaps: sitemaps.map((s) => ({ name: s.name, count: s.urls.length, missingLastmod: s.urls.filter((u) => !u.lastmod).length })),
        testSeries: auditSummary(),
        reviews: (reviews as { _id: { kind: string; decision: string }; n: number }[]).map((r) => ({ ...r._id, count: r.n })),
      },
    });
  } catch (error) {
    console.error("admin SEO summary failed", error);
    return NextResponse.json({ success: false, error: "Could not load the SEO summary." }, { status: 500 });
  }
}
