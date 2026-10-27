import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Quiz from "@/lib/models/Quiz";
import QuizAttempt from "@/lib/models/QuizAttempt";
import mongoose from "mongoose";
import { rankFromTotals, summarizeAttempts, type AttemptRow } from "@/lib/attempt-stats";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { isMobileNumber, isObjectIdString, isValidAnswerList } from "@/lib/upload-rules";

// Public endpoint (students log in with their mobile number only), so it is rate limited and validated.
const allow = createRateLimiter({ limit: 20, windowMs: 60_000 });

export async function POST(request: Request) {
  if (!allow(clientIp(request.headers))) {
    return NextResponse.json({ error: "Too many submissions. Please wait a minute." }, { status: 429 });
  }
  try {
    const body = await request.json().catch(() => null);
    const { quizId, userId, answers } = (body ?? {}) as { quizId?: unknown; userId?: unknown; answers?: unknown };
    if (!isObjectIdString(quizId) || !isMobileNumber(userId)) {
      return NextResponse.json({ error: "Invalid quiz or user" }, { status: 400 });
    }

    await connectDB();
    // Only registered students can be scored and ranked (attempts are stored under the mobile number).
    const user = await mongoose.connection.db?.collection("users").findOne({ mobile: userId }, { projection: { _id: 1 } });
    if (!user) {
      return NextResponse.json({ error: "Please register before submitting a test" }, { status: 401 });
    }

    // Fetch the quiz to get the correct answers
    const quiz = await Quiz.findById(quizId).populate("questions");
    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }
    if (!isValidAnswerList(answers, quiz.questions.length)) {
      return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
    }

    // Calculate score
    let score = 0;
    quiz.questions.forEach((question: { correctAnswer: unknown }, index: number) => {
      if (answers[index] === Number(question.correctAnswer)) {
        score++;
      }
    });

    const attempt = await QuizAttempt.create({
      quizId,
      userId,
      answers,
      score,
    });

    return NextResponse.json(attempt);
  } catch (error) {
    console.error("Error submitting quiz attempt:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz attempt" },
      { status: 500 }
    );
  }
}

/**
 * One user's test history (newest first) with a small summary of each test, overall stats and leaderboard rank.
 * Attempts are stored with the user's mobile number as `userId`. Never returns other users' attempts or questions.
 */
export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId")?.trim();
  if (!userId) {
    return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const [attempts, totals] = await Promise.all([
      QuizAttempt.find({ userId })
        .sort({ completedAt: -1 })
        .limit(500)
        .select("quizId score answers completedAt")
        .lean<{ _id: unknown; quizId: unknown; score: number; answers?: number[]; completedAt: Date }[]>(),
      QuizAttempt.aggregate<{ _id: string; total: number }>([{ $group: { _id: "$userId", total: { $sum: "$score" } } }]),
    ]);

    const quizIds = [...new Set(attempts.map((a) => String(a.quizId)))];
    const quizzes = await Quiz.aggregate<{
      _id: unknown;
      title: string;
      category?: string;
      subcategory?: string;
      timeLimit?: number;
      totalMarks?: number;
      questionCount: number;
    }>([
      { $match: { _id: { $in: quizIds.filter((id) => mongoose.isValidObjectId(id)).map((id) => new mongoose.Types.ObjectId(id)) } } },
      {
        $project: {
          title: 1,
          category: 1,
          subcategory: 1,
          timeLimit: 1,
          totalMarks: 1,
          questionCount: { $size: { $ifNull: ["$questions", []] } },
        },
      },
    ]);
    const byId = new Map(quizzes.map((q) => [String(q._id), q]));

    const rows: AttemptRow[] = attempts.map((a) => {
      const q = byId.get(String(a.quizId));
      return {
        _id: String(a._id),
        quizId: String(a.quizId),
        score: a.score,
        total: q?.questionCount || a.answers?.length || 0,
        completedAt: new Date(a.completedAt).toISOString(),
        quiz: q
          ? {
              _id: String(q._id),
              title: q.title,
              category: q.category,
              subcategory: q.subcategory,
              timeLimit: q.timeLimit,
              totalMarks: q.totalMarks,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        attempts: rows,
        stats: summarizeAttempts(rows),
        rank: rankFromTotals(totals.map((t) => ({ userId: String(t._id), total: t.total })), userId),
      },
    });
  } catch (error) {
    console.error("Error fetching quiz attempts:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch quiz attempts" }, { status: 500 });
  }
}
