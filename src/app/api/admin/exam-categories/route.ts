import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { connectToDatabase } from "@/lib/db";
import Quiz from "@/lib/models/Quiz";
import QuizCategory from "@/lib/models/QuizCategory";
import { testSeriesPath } from "@/lib/slug";
import { auditSnapshot } from "@/lib/admin-seo-audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Group = { _id: { c?: string; s?: string }; tests: number; published: number; questions: number; latest: unknown };
type Sub = { name: string; url: string; tests: number; published: number; questions: number; lastAdded: string | null; action: string | null };
type Cat = { name: string; url: string; action: string | null; inCategoryList: boolean; tests: number; questions: number; subs: Sub[] };

/** Exam categories and subcategories with test/question counts, public URL and audit recommendation. Read-only. */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    await connectToDatabase();
    const [groups, defined] = await Promise.all([
      Quiz.aggregate<Group>([
        {
          $group: {
            _id: { c: "$category", s: "$subcategory" },
            tests: { $sum: 1 },
            published: { $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] } },
            questions: { $sum: { $size: { $ifNull: ["$questions", []] } } },
            latest: { $max: "$_id" },
          },
        },
      ]),
      QuizCategory.find().select("name").lean<{ name: string }[]>(),
    ]);
    const audit = new Map(auditSnapshot().rows.map((r) => [r.path, r.action as string]));
    const definedNames = new Set(defined.map((d) => d.name));
    const cats = new Map<string, Cat>();
    const blank = (name: string): Cat => ({
      name,
      url: testSeriesPath(name),
      action: audit.get(testSeriesPath(name)) ?? null,
      inCategoryList: definedNames.has(name),
      tests: 0,
      questions: 0,
      subs: [],
    });

    for (const g of groups) {
      const name = String(g._id.c ?? "");
      const cat = cats.get(name) ?? blank(name);
      cat.tests += g.tests;
      cat.questions += g.questions;
      const url = testSeriesPath(name, String(g._id.s ?? ""));
      // ObjectIds start with their creation time in seconds.
      const lastAdded = g.latest ? new Date(parseInt(String(g.latest).slice(0, 8), 16) * 1000).toISOString() : null;
      cat.subs.push({ name: String(g._id.s ?? ""), url, tests: g.tests, published: g.published, questions: g.questions, lastAdded, action: audit.get(url) ?? null });
      cats.set(name, cat);
    }
    // Categories in the category list that have no tests yet.
    for (const d of defined) if (!cats.has(d.name)) cats.set(d.name, blank(d.name));

    const data = [...cats.values()].map((c) => ({ ...c, subs: c.subs.sort((a, b) => b.tests - a.tests) })).sort((a, b) => b.tests - a.tests);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("admin exam categories failed", error);
    return NextResponse.json({ success: false, error: "Could not load exam categories." }, { status: 500 });
  }
}
