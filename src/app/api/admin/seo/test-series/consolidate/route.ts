import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { connectToDatabase } from "@/lib/db";
import Quiz from "@/lib/models/Quiz";
import Question from "@/lib/models/Question";
import QuizAttempt from "@/lib/models/QuizAttempt";
import { CONSOLIDATED_TEST_SERIES_REDIRECTS } from "@/lib/test-series-seo";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Pair = {
  sourcePath: string;
  destinationPath: string;
  sourceCatSlug: string;
  sourceSubSlug: string;
  destCatSlug: string;
  destSubSlug: string;
};

function parsePairs(): Pair[] {
  return CONSOLIDATED_TEST_SERIES_REDIRECTS.map((r) => {
    const [, , sc, ss] = r.source.split("/");
    const [, , dc, ds] = r.destination.split("/");
    return {
      sourcePath: r.source,
      destinationPath: r.destination,
      sourceCatSlug: sc,
      sourceSubSlug: ss,
      destCatSlug: dc,
      destSubSlug: ds,
    };
  });
}

async function buildPreview() {
  await connectToDatabase();
  const quizzes = await Quiz.find().select("_id title category subcategory questions attempts").lean<
    { _id: unknown; title: string; category: string; subcategory: string; questions?: unknown[]; attempts?: unknown[] }[]
  >();

  const pairs = parsePairs();
  const previews = await Promise.all(
    pairs.map(async (p) => {
      const srcQuizzes = quizzes.filter(
        (q) => slugify(q.category) === p.sourceCatSlug && slugify(q.subcategory) === p.sourceSubSlug,
      );
      const destQuizzes = quizzes.filter(
        (q) => slugify(q.category) === p.destCatSlug && slugify(q.subcategory) === p.destSubSlug,
      );
      const srcQuizIds = srcQuizzes.map((q) => q._id);
      const [questionCount, attemptCount] = srcQuizIds.length
        ? await Promise.all([
            Question.countDocuments({ quizId: { $in: srcQuizIds } }),
            QuizAttempt.countDocuments({ quizId: { $in: srcQuizIds } }),
          ])
        : [0, 0];

      const destTitles = new Set(destQuizzes.map((q) => q.title.trim().toLowerCase()));
      const duplicateQuizTitles = srcQuizzes.filter((q) => destTitles.has(q.title.trim().toLowerCase())).map((q) => q.title);

      // Resolve canonical destination category/subcategory display names from existing destination quizzes.
      const destCategoryName =
        destQuizzes[0]?.category ??
        quizzes.find((q) => slugify(q.category) === p.destCatSlug)?.category ??
        p.destCatSlug;
      const destSubcategoryName = destQuizzes[0]?.subcategory ?? srcQuizzes[0]?.subcategory ?? p.destSubSlug;

      return {
        ...p,
        destCategoryName,
        destSubcategoryName,
        sourceQuizCount: srcQuizzes.length,
        destinationQuizCount: destQuizzes.length,
        sourceQuestionCount: questionCount,
        sourceAttemptCount: attemptCount,
        duplicateQuizTitles,
        sourceQuizIds: srcQuizIds.map(String),
      };
    }),
  );

  return previews;
}

/** Dry-run preview of the 6 CONSOLIDATE test-series pairs, quiz/question/attempt counts, and duplicate checks. */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const pairs = await buildPreview();
    return NextResponse.json({ success: true, data: { pairs } });
  } catch (error) {
    console.error("test-series consolidation preview failed", error);
    return NextResponse.json({ success: false, error: "Could not load consolidation preview." }, { status: 500 });
  }
}

/**
 * Execute safe consolidation (requires `{ confirm: true }`).
 * Reassigns `Quiz.category` and `Quiz.subcategory` in place inside a MongoDB transaction when supported,
 * preserving all `Quiz._id`, `Question.quizId`, and `QuizAttempt.quizId` references without deleting records.
 */
export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as { confirm?: boolean };
  if (body.confirm !== true) {
    return NextResponse.json({ success: false, error: "Explicit confirmation (confirm: true) is required." }, { status: 400 });
  }

  try {
    const previews = await buildPreview();
    const session = await mongoose.startSession();
    let migratedQuizzes = 0;

    const runUpdates = async (sess?: mongoose.ClientSession) => {
      for (const p of previews) {
        if (p.sourceQuizIds.length === 0) continue;
        // Skip quizzes whose exact title already exists in the destination to prevent duplicate quiz titles.
        const destQuizzes = await Quiz.find({
          _id: { $nin: p.sourceQuizIds },
        })
          .select("title category subcategory")
          .session(sess ?? null)
          .lean<{ title: string; category: string; subcategory: string }[]>();
        const destTitleSet = new Set(
          destQuizzes
            .filter((q) => slugify(q.category) === p.destCatSlug && slugify(q.subcategory) === p.destSubSlug)
            .map((q) => q.title.trim().toLowerCase()),
        );

        const srcDocs = await Quiz.find({ _id: { $in: p.sourceQuizIds } })
          .select("_id title")
          .session(sess ?? null)
          .lean<{ _id: unknown; title: string }[]>();
        const safeIds = srcDocs.filter((q) => !destTitleSet.has(q.title.trim().toLowerCase())).map((q) => q._id);

        if (safeIds.length > 0) {
          const res = await Quiz.updateMany(
            { _id: { $in: safeIds } },
            { $set: { category: p.destCategoryName, subcategory: p.destSubcategoryName } },
            sess ? { session: sess } : undefined,
          );
          migratedQuizzes += res.modifiedCount ?? 0;
        }
      }
    };

    try {
      await session.withTransaction(async () => {
        await runUpdates(session);
      });
    } catch (txErr) {
      // Standalone MongoDB instances do not support replica-set transactions; fall back safely if transaction error.
      const msg = txErr instanceof Error ? txErr.message : "";
      if (/Transaction numbers are only allowed/i.test(msg)) {
        migratedQuizzes = 0;
        await runUpdates(undefined);
      } else {
        throw txErr;
      }
    } finally {
      await session.endSession();
    }

    return NextResponse.json({
      success: true,
      data: { migratedQuizzes, pairsChecked: previews.length },
    });
  } catch (error) {
    console.error("test-series consolidation failed", error);
    return NextResponse.json({ success: false, error: "Could not execute test-series consolidation." }, { status: 500 });
  }
}
