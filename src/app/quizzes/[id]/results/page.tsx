"use client"
import { logoutUser } from "@/lib/auth-session"

import React, { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Trophy, Target, Clock, CheckCircle2, XCircle, ArrowLeft, Brain, LogOut, User, AlertCircle, FileText } from "lucide-react"
import Link from "next/link"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { idFromParam } from "@/lib/slug";

interface QuizAttempt {
  _id: string
  quizId: string
  userId: string
  answers: number[]
  score: number
  completedAt: string
}

interface Quiz {
  _id: string
  title: string
  description: string
  questions: any[]
  timeLimit: number
  totalMarks: number
}

interface User {
  name: string
  mobile: string
}

export default function QuizResults({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  // URLs may carry a readable slug ("ssc-gd-mock-test-<id>"); everything below uses the bare id.
  const resolvedParams = { id: idFromParam(React.use(params).id) };
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  const handleLogout = async () => {
    await logoutUser()
    window.location.href = "/quizzes"
  }

  const handleStart = () => {
    router.push(`/quizzes/${resolvedParams.id}`);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user")
      if (userData) {
        try {
          setUser(JSON.parse(userData))
        } catch (error) {
          console.error("Error parsing user data:", error)
        }
      }

      const fetchData = async () => {
        try {
          const attemptId = searchParams?.get("attemptId")
          console.log("Attempt ID from URL:", attemptId)
          console.log("Quiz ID from params:", resolvedParams.id)

          if (!attemptId) {
            console.error("No attempt ID provided")
            toast.error("No attempt ID provided")
            return
          }

          const [quizRes, attemptRes] = await Promise.all([
            fetch(`/api/quizzes/${resolvedParams.id}`),
            fetch(`/api/quiz-attempts/${attemptId}`),
          ])

          console.log("Quiz response status:", quizRes.status)
          console.log("Attempt response status:", attemptRes.status)

          if (!quizRes.ok || !attemptRes.ok) {
            const quizError = quizRes.ok ? null : await quizRes.text()
            const attemptError = attemptRes.ok ? null : await attemptRes.text()
            console.error("Quiz fetch error:", quizError)
            console.error("Attempt fetch error:", attemptError)
            throw new Error("Failed to fetch data")
          }

          const [quizData, attemptData] = await Promise.all([quizRes.json(), attemptRes.json()])
          console.log("Quiz data received:", !!quizData)
          console.log("Attempt data received:", !!attemptData)

          // The public quiz has no correct answers; the submitted attempt carries the quiz with its answers.
          setQuiz(attemptData?.quizId?.questions ? attemptData.quizId : quizData)
          setAttempt(attemptData)
        } catch (error) {
          console.error("Error fetching quiz results:", error)
          toast.error("Failed to load quiz results")
        } finally {
          setLoading(false)
        }
      }

      fetchData()
    }
  }, [resolvedParams.id, searchParams])

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-amber-200">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Brain className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-amber-900 mb-2">Processing Results</h2>
              <p className="text-amber-700 mb-6">Calculating your quiz performance...</p>
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-600 border-t-transparent mx-auto"></div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!quiz || !attempt) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-amber-200">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-amber-900 mb-4">
                Results Not Found
              </h1>
              <p className="text-amber-700 mb-6">
                Unable to load your test results. Please try again or contact support if the issue persists.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="bg-white border-amber-300 text-amber-800 hover:bg-amber-50 w-full"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => (window.location.href = "/quizzes")}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white w-full"
                >
                  Return to Test Series
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const calculateScore = () => {
    let correctAnswers = 0
    quiz.questions.forEach((question, index) => {
      if (Number(question.correctAnswer) === Number(attempt.answers[index])) {
        correctAnswers++
      }
    })
    return (correctAnswers / quiz.questions.length) * 100
  }

  const score = calculateScore()
  const correctAnswers = quiz.questions.filter((q, i) => Number(q.correctAnswer) === Number(attempt.answers[i])).length

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "OUTSTANDING"
    if (score >= 80) return "EXCELLENT"
    if (score >= 70) return "VERY GOOD"
    if (score >= 60) return "GOOD"
    if (score >= 50) return "AVERAGE"
    return "NEEDS IMPROVEMENT"
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "from-emerald-400 to-emerald-600"
    if (score >= 80) return "from-green-400 to-green-600"
    if (score >= 70) return "from-blue-400 to-blue-600"
    if (score >= 60) return "from-yellow-400 to-yellow-600"
    if (score >= 50) return "from-orange-400 to-orange-600"
    return "from-red-400 to-red-600"
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* User Profile Section - Textbook Theme */}
          {user && (
            <Card className="mb-6 bg-white/95 backdrop-blur-sm border-2 border-amber-200 shadow-xl rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shadow-lg border-2 border-white">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-amber-900">
                        {user.name}
                      </h3>
                      <p className="text-amber-700 text-sm">Quiz Results</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="bg-white border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 px-4 py-2 font-semibold"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Results Card - Textbook Theme */}
          <Card className="bg-white border-2 border-amber-200 shadow-2xl rounded-xl mb-8">
            {/* Textbook-style header with binding */}
            <div className="h-2 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-800"></div>

            <CardHeader className="bg-gradient-to-br from-amber-50 to-orange-50 p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-amber-900 mb-2">
                  Test Results
                </CardTitle>
                <p className="text-amber-700 text-lg font-medium">{quiz.title}</p>
                <p className="text-amber-600 text-sm mt-1">{quiz.description}</p>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Score Display - Textbook Theme */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Main Score - Textbook Theme */}
                <div className="lg:col-span-2">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-4xl font-black text-amber-900 mb-2">{score.toFixed(1)}%</div>
                    <div className="text-lg font-bold text-amber-800 uppercase tracking-wide">
                      {getScoreGrade(score)}
                    </div>
                  </div>
                </div>

                {/* Stats Sidebar - Textbook Theme */}
                <div className="space-y-4">
                  {/* Total Questions */}
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center">
                    <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-800 mb-1">
                      {quiz.questions.length}
                    </div>
                    <div className="text-sm font-medium text-purple-700">Total Questions</div>
                  </div>

                  {/* Time Limit */}
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
                    <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-800 mb-1">
                      {quiz.timeLimit}
                    </div>
                    <div className="text-sm font-medium text-yellow-700">Time Limit (minutes)</div>
                  </div>

                  {/* Completion Date */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                    <CheckCircle2 className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-bold text-blue-800 mb-1">
                      {new Date(attempt.completedAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm font-medium text-blue-700">Completed On</div>
                  </div>
                </div>
              </div>

              {/* Questions Review - Textbook Theme */}
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-2">
                    Detailed Analysis
                  </h2>
                  <p className="text-amber-700">Review your answers and learn from each question</p>
                </div>

                {quiz.questions.map((question, index) => {
                  const userAnswer = Number(attempt.answers[index])
                  const isCorrect = Number(question.correctAnswer) === userAnswer
                  const wasAnswered = userAnswer !== -1

                  return (
                    <Card key={question._id} className="bg-white border-2 border-amber-200 shadow-lg rounded-xl">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Question Header - Textbook Theme */}
                          <div className="flex items-start gap-4 mb-4">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${
                                isCorrect
                                  ? "bg-green-500"
                                  : wasAnswered
                                    ? "bg-red-500"
                                    : "bg-gray-400"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-800 text-base leading-relaxed mb-3">
                                {question.text}
                              </h3>
                              <div className="flex items-center gap-2">
                                {isCorrect ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                ) : wasAnswered ? (
                                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-gray-400 flex-shrink-0" />
                                )}
                                <span className={`text-sm font-semibold ${
                                  isCorrect ? "text-green-700" : wasAnswered ? "text-red-700" : "text-gray-600"
                                }`}>
                                  {isCorrect ? "Correct" : wasAnswered ? "Incorrect" : "Not Answered"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Options Display */}
                          <div className="space-y-2 ml-14">
                            {question.options.map((option: string, optionIndex: number) => {
                              const isUserAnswer = userAnswer === optionIndex
                              const isCorrectAnswer = Number(question.correctAnswer) === optionIndex

                              return (
                                <div
                                  key={optionIndex}
                                  className={`p-3 rounded-lg border-2 ${
                                    isCorrectAnswer
                                      ? "border-green-300 bg-green-50"
                                      : isUserAnswer && !isCorrectAnswer
                                        ? "border-red-300 bg-red-50"
                                        : "border-gray-200 bg-gray-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                      isCorrectAnswer
                                        ? "bg-green-500 text-white"
                                        : isUserAnswer
                                          ? "bg-red-500 text-white"
                                          : "bg-gray-300 text-gray-600"
                                    }`}>
                                      {String.fromCharCode(65 + optionIndex)}
                                    </div>
                                    <span className={`text-sm ${
                                      isCorrectAnswer
                                        ? "text-green-800 font-medium"
                                        : isUserAnswer && !isCorrectAnswer
                                          ? "text-red-800 font-medium"
                                          : "text-gray-700"
                                    }`}>
                                      {option}
                                    </span>
                                    {isCorrectAnswer && (
                                      <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />
                                    )}
                                    {isUserAnswer && !isCorrectAnswer && (
                                      <XCircle className="w-4 h-4 text-red-600 ml-auto" />
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Action Buttons - Textbook Theme */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                <Link href={`/quizzes/${resolvedParams.id}/instructions`}>
                  <Button
                    variant="outline"
                    className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-6 py-3 font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Take Again
                  </Button>
                </Link>
                <Link href="/quizzes">
                  <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 font-semibold">
                    Back to Quiz List
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-center mt-12 mb-8">
        <Link href="/profile">
          <Button
            variant="outline"
            className="bg-white border-2 border-amber-300 text-amber-800 hover:bg-amber-50 hover:border-amber-400 px-6 py-3 font-semibold"
          >
            View Profile
          </Button>
        </Link>
      </div>
      <Footer />
    </>
  )
}