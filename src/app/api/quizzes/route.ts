import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Quiz from '@/lib/models/Quiz';
import Question from '@/lib/models/Question';
import { requireAdmin } from '@/lib/admin-guard';
import {
  QUIZ_FACETS_PIPELINE,
  buildQuizFacets,
  bulkStatusFilter,
  parseQuizListParams,
  parseQuizStatus,
  quizListPipeline,
} from '@/lib/admin-quiz-list';

/**
 * Publish or unpublish quizzes in bulk. Admin only.
 * Body: `{ status: "published" | "draft", ids: string[] }` or `{ status, category, subcategory? }`.
 */
export async function PATCH(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const status = parseQuizStatus(body.status);
  if (!status) return NextResponse.json({ success: false, error: 'status must be "published" or "draft"' }, { status: 400 });
  const target = bulkStatusFilter(body);
  if ('error' in target) return NextResponse.json({ success: false, error: target.error }, { status: 400 });
  try {
    await connectDB();
    const result = await Quiz.updateMany(target.filter, { $set: { status } });
    return NextResponse.json({ success: true, data: { matched: result.matchedCount, modified: result.modifiedCount, status } });
  } catch (error) {
    console.error('Error updating quiz status:', error);
    return NextResponse.json({ success: false, error: 'Failed to update quiz status' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    await connectDB();
    const body = await request.json();
    const { title, description, category, subcategory, timeLimit, totalMarks, questions } = body;

    // Create quiz first
    const quiz = await Quiz.create({
      title,
      description,
      category,
      subcategory,
      timeLimit,
      totalMarks,
      status: parseQuizStatus(body.status) ?? 'draft',
      questions: [], // Initialize with empty questions array
    });

    // Create questions with the quiz ID
    const createdQuestions = await Question.create(
      questions.map((q: any) => ({
        quizId: quiz._id,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
      }))
    );

    // Update quiz with question references
    quiz.questions = createdQuestions.map((q: any) => q._id);
    await quiz.save();

    // Populate questions for the response
    const populatedQuiz = await Quiz.findById(quiz._id).populate('questions');

    return NextResponse.json(populatedQuiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    );
  }
}

/**
 * Admin only.
 * - `?facets=1`: category → subcategory quiz counts, for the Quiz Management filters.
 * - `?page=N` (with optional `limit`, `category`, `subcategory`, `q`, `status`): one page of quizzes with a question
 *   count instead of the questions, plus totals. This is what Quiz Management uses, so it loads in one small request.
 * - no parameters: every quiz with its questions and answers (~12 MB; kept for the older Content page list).
 */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { searchParams } = new URL(request.url);
  try {
    await connectDB();
    if (searchParams.get('facets') === '1') {
      const rows = await Quiz.aggregate(QUIZ_FACETS_PIPELINE as any);
      return NextResponse.json({ success: true, data: buildQuizFacets(rows) });
    }
    if (searchParams.has('page')) {
      const params = parseQuizListParams(searchParams);
      const [result] = await Quiz.aggregate(quizListPipeline(params) as any);
      const total: number = result?.total?.[0]?.n ?? 0;
      const pages = Math.max(1, Math.ceil(total / params.limit));
      // Past the last page (e.g. after deletes or an old link): report the last page so the list moves there.
      const page = Math.min(params.page, pages);
      return NextResponse.json({
        success: true,
        data: page === params.page ? (result?.items ?? []) : [],
        page,
        limit: params.limit,
        total,
        pages,
      });
    }
    const quizzes = await Quiz.find().populate('questions');
    return NextResponse.json({ success: true, data: quizzes });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
} 