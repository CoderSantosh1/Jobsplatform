import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Quiz from "@/lib/models/Quiz";
import Question from "@/lib/models/Question";
import QuizAttempt from "@/lib/models/QuizAttempt";
import { requireAdmin } from '@/lib/admin-guard';

export async function GET(req: any, ctx: any) {
  try {
    const { id } = await ctx.params;

    await connectDB();
    const quiz = await Quiz.findById(id).populate("questions");

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}

export async function PUT(req: any, ctx: any) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;

    await connectDB();
    const quizData = await req.json();
    console.log("PUT request received for quiz ID:", id);
    console.log("Payload received:", quizData);

    const quiz = await Quiz.findByIdAndUpdate(
      id,
      {
        title: quizData.title,
        description: quizData.description,
        category: quizData.category,
        subcategory: quizData.subcategory,
        timeLimit: quizData.timeLimit,
        totalMarks: quizData.totalMarks || 0,
      },
      { new: true }
    );

    console.log("Quiz after findByIdAndUpdate:", quiz);

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    for (const questionData of quizData.questions || []) {
      if (questionData._id) {
        await Question.findByIdAndUpdate(questionData._id, {
          text: questionData.text,
          options: questionData.options,
          correctAnswer: questionData.correctAnswer,
        });
      } else {
        const newQuestion = new Question({
          quizId: quiz._id,
          text: questionData.text,
          options: questionData.options,
          correctAnswer: questionData.correctAnswer,
        });
        await newQuestion.save();
        // @ts-ignore
        quiz.questions.push(newQuestion._id);
      }
    }

    await quiz.save();

    const updatedQuiz = await Quiz.findById(quiz._id).populate("questions");
    console.log("Quiz before sending response:", updatedQuiz);

    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error("Error updating quiz:", error);
    return NextResponse.json(
      { error: "Failed to update quiz" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: any, ctx: any) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const { id } = await ctx.params;

    await connectDB();
    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    await Question.deleteMany({ quizId: id });
    await QuizAttempt.deleteMany({ quizId: id });
    await quiz.deleteOne();

    return NextResponse.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}
