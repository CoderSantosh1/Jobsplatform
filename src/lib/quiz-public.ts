// What a test-taker may see of a quiz. Pure function, so unit tests can load this file directly.

type QuestionLike = { correctAnswer?: unknown; [key: string]: unknown };
type QuizLike = { questions?: unknown; [key: string]: unknown };

/**
 * Removes the correct answers from a quiz before it is sent to someone taking the test. Answers are only revealed
 * with a submitted attempt (GET /api/quiz-attempts/:id) or to the admin.
 */
export function withoutAnswers<T extends QuizLike>(quiz: T): T {
  const questions = Array.isArray(quiz.questions)
    ? quiz.questions.map((q) => {
        if (!q || typeof q !== "object") return q;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { correctAnswer, ...rest } = q as QuestionLike;
        return rest;
      })
    : quiz.questions;
  return { ...quiz, questions };
}
