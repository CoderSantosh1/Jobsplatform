import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { connectToDatabase } from "@/lib/db";
import Question from "@/lib/models/Question";
import Quiz from "@/lib/models/Quiz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE = 25;
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Question bank: every question across all mock tests, searchable and filterable by category.
 * Admin only and read-only (questions are edited inside their test, so question IDs never change here).
 */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const p = new URL(request.url).searchParams;
  const q = (p.get("q") ?? "").trim().slice(0, 200);
  const category = (p.get("category") ?? "").trim();
  const duplicates = p.get("duplicates") === "1";
  const page = Math.max(0, Math.floor(Number(p.get("page")) || 0));
  try {
    await connectToDatabase();
    const match: Record<string, unknown> = {};
    if (q) match.text = { $regex: escapeRegex(q), $options: "i" };
    if (category) match.quizId = { $in: await Quiz.find({ category }).distinct("_id") };

    const [categories, totalQuestions] = await Promise.all([Quiz.distinct("category"), Question.estimatedDocumentCount()]);
    const base = { totalQuestions, page, pageSize: PAGE, categories: (categories as string[]).filter(Boolean).sort() };

    if (duplicates) {
      // The same question text used more than once (shared questions make exam pages look alike).
      const groups = await Question.aggregate([
        { $match: { ...match, text: match.text ?? { $type: "string", $ne: "" } } },
        { $group: { _id: { $toLower: { $trim: { input: "$text" } } }, n: { $sum: 1 }, quizzes: { $addToSet: "$quizId" }, text: { $first: "$text" } } },
        { $match: { n: { $gt: 1 } } },
        { $sort: { n: -1, _id: 1 } },
        { $facet: { total: [{ $count: "n" }], rows: [{ $skip: page * PAGE }, { $limit: PAGE }] } },
      ]).allowDiskUse(true);
      const rows = (groups[0]?.rows ?? []) as { text: string; n: number; quizzes: unknown[] }[];
      return NextResponse.json({
        success: true,
        data: { ...base, mode: "duplicates", total: groups[0]?.total?.[0]?.n ?? 0, rows: rows.map((r) => ({ text: r.text, uses: r.n, quizCount: r.quizzes.length })) },
      });
    }

    const [total, rows] = await Promise.all([
      Object.keys(match).length ? Question.countDocuments(match) : Promise.resolve(totalQuestions),
      Question.aggregate([
        { $match: match },
        { $sort: { _id: -1 } },
        { $skip: page * PAGE },
        { $limit: PAGE },
        {
          $lookup: {
            from: Quiz.collection.name,
            localField: "quizId",
            foreignField: "_id",
            as: "quiz",
            pipeline: [{ $project: { title: 1, category: 1, subcategory: 1 } }],
          },
        },
        { $project: { text: 1, options: 1, correctAnswer: 1, quiz: { $first: "$quiz" } } },
      ]),
    ]);
    return NextResponse.json({ success: true, data: { ...base, mode: "list", total, rows } });
  } catch (error) {
    console.error("admin question bank failed", error);
    return NextResponse.json({ success: false, error: "Could not load questions." }, { status: 500 });
  }
}
