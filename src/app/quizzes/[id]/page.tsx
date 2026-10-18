"use client";

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, type ButtonProps } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock, CheckCircle2, Flag, ArrowRight, Brain, ArrowLeft, User, FileText } from 'lucide-react';
import Link from "next/link"
import { title } from 'process';
import { LANG } from "./lang";
import { idFromParam } from "@/lib/slug";

// Dynamic imports for non-critical components to reduce render-blocking
const Header = React.lazy(() => import('@/components/Header'));
const Footer = React.lazy(() => import('@/components/Footer'));
const AuthModal = React.lazy(() => import('@/components/AuthModal'));
const ConfirmationModal = React.lazy(() => import("../../../components/ui/ConfirmationModal"));

enum QuestionStatus {
  NotViewed = 'not-viewed',
  Viewed = 'viewed',
  Attempted = 'attempted',
  ToReview = 'to-review',
  AttemptedAndMarkedForReview = 'attempted-review',
}

interface Question {
  _id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  timeLimit: number;
  totalMarks: number;
  questions: Question[];
}

const getStatusColor = (status: QuestionStatus): string => {
  switch (status) {
    case QuestionStatus.Attempted:
      return "from-lime-400 to-lime-600";
    case QuestionStatus.Viewed:
      return "from-red-400 to-red-600";
    case QuestionStatus.NotViewed:
      return "from-gray-500 to-gray-700";
    case QuestionStatus.ToReview:
      return "from-cyan-400 to-cyan-600";
    case QuestionStatus.AttemptedAndMarkedForReview:
      return "from-red-400 to-red-600";
    default:
      return "from-gray-500 to-gray-700";
  }
};

export default function TakeQuiz({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  // URLs may carry a readable slug ("ssc-gd-mock-test-<id>"); everything below uses the bare id.
  const resolvedParams = { id: idFromParam(React.use(params).id) };
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [questionStatuses, setQuestionStatuses] = useState<QuestionStatus[]>([]);
  const [showRegister, setShowRegister] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({
    title: "",
    message: "",
    confirmText: "",
    cancelText: "",
    type: "warning" as "warning" | "danger" | "success" | "info",
    unansweredCount: 0,
  });
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const t = LANG[lang];

  // Initialize user check
  useEffect(() => {
    if (typeof window !== "undefined") {
      const quizStarted = localStorage.getItem(`quiz-started-${resolvedParams.id}`);
      if (!quizStarted) {
        // First open: skip validations
        setIsInitializing(false);
        return;
      }
      // If quiz already started, enforce validations
      const user = localStorage.getItem("user");
      if (!user) {
        setShowRegister(true);
        setIsInitializing(false);
        return;
      }
      const acknowledged = localStorage.getItem(`quiz-instructions-acknowledged-${resolvedParams.id}`);
      if (!acknowledged) {
        router.replace(`/quizzes/${resolvedParams.id}/instructions`);
        return;
      }
      setIsInitializing(false);
    }
  }, [resolvedParams.id, router]);

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`/api/quizzes/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch quiz');
        }
        const data = await response.json();
        setQuiz(data);
        // Only set timer if timeLimit is a positive number
        if (data.timeLimit && data.timeLimit > 0) {
          setTimeLeft(data.timeLimit * 60); // Convert minutes to seconds
        } else {
          setTimeLeft(-1); // Special value for no/invalid time limit
        }
        setAnswers(new Array(data.questions.length).fill(-1));
        setQuestionStatuses(new Array(data.questions.length).fill(QuestionStatus.NotViewed));
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast.error('Failed to load quiz. Please check your internet connection and try again.');
        // Don't redirect immediately, give user a chance to retry
        setTimeout(() => router.push('/quizzes'), 3000);
      } finally {
        setLoading(false);
      }
    };

    if (!isInitializing && !showRegister) {
      fetchQuiz();
    }
  }, [resolvedParams.id, router, isInitializing, showRegister]);

  // Timer effect
  useEffect(() => {
    // Only run timer if timeLeft is positive
    if (timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Warning effect
  useEffect(() => {
    if (timeLeft <= 300) { // 5 minutes
      setShowWarning(true);
    }
  }, [timeLeft]);

  const handleRegister = (user: { name: string, mobile: string }) => {
    localStorage.setItem("user", JSON.stringify(user));
    setShowRegister(false);
  };

  const showSubmitConfirmation = () => {
    const unanswered = answers.filter((answer) => answer === -1).length;

    if (unanswered > 0) {
      setConfirmModalData({
        title: "Submit Quiz?",
        message: "Are you sure you want to submit your quiz? This action cannot be undone.",
        confirmText: "Submit Quiz",
        cancelText: "Continue Quiz",
        type: "warning",
        unansweredCount: unanswered,
      });
    } else {
      setConfirmModalData({
        title: "Submit Quiz?",
        message: "You have answered all questions. Are you ready to submit your quiz?",
        confirmText: "Submit Quiz",
        cancelText: "Review Answers",
        type: "success",
        unansweredCount: 0,
      });
    }

    setShowConfirmModal(true);
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    if (!quiz) {
      toast.error("Quiz data is missing. Please reload the page.");
      return;
    }

    const user = (() => {
      if (typeof window === "undefined") return null;
      try {
        const userData = localStorage.getItem("user");
        return userData ? JSON.parse(userData) : null;
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem("user"); // Clear corrupted data
        return null;
      }
    })();
    if (!user || !user.mobile) {
      toast.error("User not found. Please register again.");
      setShowRegister(true);
      return;
    }

    setSubmitting(true);
    try {
      console.log("Submitting quiz attempt with quizId:", quiz._id, "userId:", user.mobile, "answers:", answers);
      const response = await fetch('/api/quiz-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: quiz._id,
          userId: user.mobile,
          answers,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const attempt = await response.json();
      toast.success('Quiz submitted successfully!');
      router.push(`/quizzes/${resolvedParams.id}/results?attemptId=${attempt._id}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
      setSubmitting(false);
    }
  }, [submitting, answers, quiz, resolvedParams.id, router, setShowRegister]);

  // Handle time expiration
  useEffect(() => {
    // Only trigger expiration if timeLeft is zero and was set from a valid timeLimit
    if (timeLeft === 0 && quiz && quiz.timeLimit && quiz.timeLimit > 0 && !submitting) {
      setConfirmModalData({
        title: "Time Expired!",
        message: "Your quiz time has expired. Your answers will be automatically submitted.",
        confirmText: "Submit Now",
        cancelText: "",
        type: "danger",
        unansweredCount: answers.filter((answer) => answer === -1).length,
      });
      setShowConfirmModal(true);
      setTimeout(() => {
        handleSubmit();
        // After 3 seconds, reset the quiz state so user can start again
        setTimeout(() => {
          // Reset quiz state to initial
          setCurrentQuestion(0);
          setAnswers(new Array(quiz.questions.length).fill(-1));
          setQuestionStatuses(new Array(quiz.questions.length).fill(QuestionStatus.NotViewed));
          setTimeLeft(quiz.timeLimit * 60);
          setShowConfirmModal(false);
        }, 3000);
      }, 3000);
    }
  }, [timeLeft, submitting, handleSubmit, answers, quiz]);

  const handleAnswerChange = (value: string) => {
    try {
      // Mark quiz as started on first answer
      if (typeof window !== "undefined") {
        const quizStarted = localStorage.getItem(`quiz-started-${resolvedParams.id}`);
        if (!quizStarted) {
          localStorage.setItem(`quiz-started-${resolvedParams.id}`, "true");
        }
      }

      const answerIndex = parseInt(value);
      if (isNaN(answerIndex) || answerIndex < 0 || answerIndex >= (quiz?.questions[currentQuestion]?.options?.length || 0)) {
        console.error('Invalid answer value:', value);
        return;
      }

      const newAnswers = [...answers];
      newAnswers[currentQuestion] = answerIndex;
      setAnswers(newAnswers);

      const newStatuses = [...questionStatuses];
      newStatuses[currentQuestion] = QuestionStatus.Attempted;
      setQuestionStatuses(newStatuses);
    } catch (error) {
      console.error('Error handling answer change:', error);
      toast.error('Failed to save your answer. Please try again.');
    }
  };

  const handleNext = () => {
    try {
      if (currentQuestion < (quiz?.questions.length || 0) - 1) {
        setCurrentQuestion((prev) => {
          if (prev < 0 || prev >= questionStatuses.length) {
            console.error('Invalid current question index:', prev);
            return prev;
          }
          const newStatuses = [...questionStatuses];
          if (newStatuses[prev] === QuestionStatus.NotViewed) {
            newStatuses[prev] = QuestionStatus.Viewed;
          }
          setQuestionStatuses(newStatuses);
          return prev + 1;
        });
      }
    } catch (error) {
      console.error('Error navigating to next question:', error);
    }
  };

  const handlePrevious = () => {
    try {
      if (currentQuestion > 0) {
        setCurrentQuestion((prev) => {
          if (prev < 0 || prev >= questionStatuses.length) {
            console.error('Invalid current question index:', prev);
            return prev;
          }
          const newStatuses = [...questionStatuses];
          if (newStatuses[prev] === QuestionStatus.NotViewed) {
            newStatuses[prev] = QuestionStatus.Viewed;
          }
          setQuestionStatuses(newStatuses);
          return prev - 1;
        });
      }
    } catch (error) {
      console.error('Error navigating to previous question:', error);
    }
  };

  const handleQuestionNavigation = (index: number) => {
    setCurrentQuestion(index);
    const newStatuses = [...questionStatuses];
    if (newStatuses[index] === QuestionStatus.NotViewed) {
      newStatuses[index] = QuestionStatus.Viewed;
    }
    setQuestionStatuses(newStatuses);
  };

  const handleMarkForReview = () => {
    const newStatuses = [...questionStatuses];
    if (newStatuses[currentQuestion] === QuestionStatus.Attempted) {
      newStatuses[currentQuestion] = QuestionStatus.AttemptedAndMarkedForReview;
    } else {
      newStatuses[currentQuestion] = QuestionStatus.ToReview;
    }
    setQuestionStatuses(newStatuses);
  };

  const handleClearResponse = () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = -1;
    setAnswers(newAnswers);

    const newStatuses = [...questionStatuses];
    if (newStatuses[currentQuestion] === QuestionStatus.Attempted) {
      newStatuses[currentQuestion] = QuestionStatus.Viewed;
    } else if (newStatuses[currentQuestion] === QuestionStatus.AttemptedAndMarkedForReview) {
      newStatuses[currentQuestion] = QuestionStatus.ToReview;
    } else if (newStatuses[currentQuestion] === QuestionStatus.ToReview) {
      newStatuses[currentQuestion] = QuestionStatus.Viewed;
    }
    setQuestionStatuses(newStatuses);
  };



  // Set language from localStorage or default to 'en' on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lang');
      if (stored === 'hi' || stored === 'en') {
        setLang(stored);
      }
      // If stored is not 'hi' or 'en', keep the default 'en'
    }
  }, []);

  // Set dynamic page title for SEO
  useEffect(() => {
    if (quiz && quiz.title) {
      document.title = `${quiz.title} - Quiz Test | Sarkari Results Now`;
    } else {
      document.title = 'Take Quiz - Sarkari Results Now';
    }
  }, [quiz]);


  // Show register modal if user is not registered
  if (showRegister) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-600 border-t-transparent"></div></div>}>
        <AuthModal onSuccess={handleRegister} />
      </Suspense>
    );
  }

  // Show loading state while initializing - maintain layout structure to prevent CLS
  if (isInitializing) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Skeleton for main quiz container */}
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-200 overflow-hidden mb-6">
              {/* Skeleton for header section */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-200 p-6">
                {/* Skeleton for user profile */}
                <div className="flex items-center justify-between mb-6 min-h-[60px]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 animate-pulse"></div>
                    <div>
                      <div className="h-5 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-32 mb-1 animate-pulse"></div>
                      <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Skeleton for title and description */}
                <div className="text-center mb-6">
                  <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-64 mx-auto mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-48 mx-auto animate-pulse"></div>
                </div>

                {/* Skeleton for stats grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-center">
                      <div className="w-6 h-6 bg-gradient-to-r from-gray-300 to-gray-400 rounded mx-auto mb-2 animate-pulse"></div>
                      <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-16 mx-auto mb-1 animate-pulse"></div>
                      <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-20 mx-auto animate-pulse"></div>
                    </div>
                  ))}
                </div>

                {/* Skeleton for progress bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-16 animate-pulse"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-12 animate-pulse"></div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-gray-300 to-gray-400 animate-pulse w-1/3"></div>
                  </div>
                </div>
              </div>

              {/* Skeleton for main content */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
                <div className="lg:col-span-3">
                  <div className="bg-white border-2 border-gray-200 shadow-lg rounded-lg">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                      <div className="h-6 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-32 animate-pulse"></div>
                    </div>
                    <div className="p-6">
                      <div className="mb-6">
                        <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-full mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-3/4 animate-pulse"></div>
                      </div>
                      <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                            <div className="flex items-center space-x-4">
                              <div className="h-5 w-5 bg-gradient-to-r from-gray-300 to-gray-400 rounded animate-pulse"></div>
                              <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded flex-1 animate-pulse"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <div className="bg-white border-2 border-gray-200 shadow-lg rounded-lg">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                      <div className="h-6 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-24 animate-pulse"></div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-4 gap-2 mb-6">
                        {Array.from({ length: 16 }, (_, i) => (
                          <div key={i} className="w-10 h-10 bg-gradient-to-r from-gray-300 to-gray-400 rounded-lg animate-pulse"></div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full animate-pulse"></div>
                            <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-20 animate-pulse"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Skeleton for main quiz container */}
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-200 overflow-hidden mb-6">
              {/* Skeleton for header section */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-200 p-6">
                {/* Skeleton for user profile */}
                <div className="flex items-center justify-between mb-6 min-h-[60px]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 animate-pulse"></div>
                    <div>
                      <div className="h-5 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-32 mb-1 animate-pulse"></div>
                      <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Skeleton for title and description */}
                <div className="text-center mb-6">
                  <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-64 mx-auto mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-48 mx-auto animate-pulse"></div>
                </div>

                {/* Skeleton for stats grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-center">
                      <div className="w-6 h-6 bg-gradient-to-r from-gray-300 to-gray-400 rounded mx-auto mb-2 animate-pulse"></div>
                      <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-16 mx-auto mb-1 animate-pulse"></div>
                      <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-20 mx-auto animate-pulse"></div>
                    </div>
                  ))}
                </div>

                {/* Skeleton for progress bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-16 animate-pulse"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-12 animate-pulse"></div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-gray-300 to-gray-400 animate-pulse w-1/4"></div>
                  </div>
                </div>
              </div>

              {/* Skeleton for main content */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
                <div className="lg:col-span-3">
                  <div className="bg-white border-2 border-gray-200 shadow-lg rounded-lg">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                      <div className="h-6 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-32 animate-pulse"></div>
                    </div>
                    <div className="p-6">
                      <div className="mb-6">
                        <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-full mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-3/4 animate-pulse"></div>
                      </div>
                      <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                            <div className="flex items-center space-x-4">
                              <div className="h-5 w-5 bg-gradient-to-r from-gray-300 to-gray-400 rounded animate-pulse"></div>
                              <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded flex-1 animate-pulse"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <div className="bg-white border-2 border-gray-200 shadow-lg rounded-lg">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                      <div className="h-6 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-24 animate-pulse"></div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-4 gap-2 mb-6">
                        {Array.from({ length: 16 }, (_, i) => (
                          <div key={i} className="w-10 h-10 bg-gradient-to-r from-gray-300 to-gray-400 rounded-lg animate-pulse"></div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full animate-pulse"></div>
                            <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 rounded w-20 animate-pulse"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <>
        <Suspense fallback={<div className="h-16 bg-white shadow-sm animate-pulse"></div>}>
          <Header />
        </Suspense>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-amber-200">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-amber-900 mb-4">
                Quiz Not Found
              </h1>
              <p className="text-amber-700 mb-6">
                The quiz you're looking for is not available or has been removed.
              </p>
              <Button
                onClick={() => router.push("/quizzes")}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold px-6 py-3 rounded-lg"
              >
                Return to Quiz List
              </Button>
            </div>
          </div>
        </div>
        <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse"></div>}>
          <Footer />
        </Suspense>
      </>
    );
  }

  // Show a message if no valid time limit is set
  if (quiz && (!quiz.timeLimit || quiz.timeLimit <= 0)) {
    return (
      <>
        <Suspense fallback={<div className="h-16 bg-white shadow-sm animate-pulse"></div>}>
          <Header />
        </Suspense>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-amber-200">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-amber-900 mb-4">
                Time Limit Not Set
              </h1>
              <p className="text-amber-700 mb-6">
                This quiz doesn't have a valid time limit set. Please contact the administrator.
              </p>
              <Button
                onClick={() => router.push("/quizzes")}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold px-6 py-3 rounded-lg"
              >
                Return to Quiz List
              </Button>
            </div>
          </div>
        </div>
        <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse"></div>}>
          <Footer />
        </Suspense>
      </>
    );
  }

  const currentQuestionData = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const answeredQuestions = answers.filter((answer) => answer !== -1).length;


  return (
    <>
      <Suspense fallback={<div className="h-16 bg-white shadow-sm animate-pulse"></div>}>
        <Header />
      </Suspense>
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="container mx-auto px-4 py-6 max-w-7xl">


          {/* Main Quiz Container */}
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-200 overflow-hidden mb-6">
            {/* Header Section */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-200 p-6">
              {/* User Profile Display - Always reserve space to prevent CLS */}
              <div className="flex items-center justify-between mb-6 min-h-[60px]">
                {(() => {
                  try {
                    const userData = typeof window !== "undefined" ? localStorage.getItem("user") : null;
                    const user = userData ? JSON.parse(userData) : null;
                    return user && user.name ? (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shadow-lg border-2 border-white">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-amber-900">
                            {user.name}
                          </h3>
                          <p className="text-amber-700 text-sm">Test in Progress</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 opacity-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shadow-lg border-2 border-white">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-amber-900">Placeholder Name</h3>
                          <p className="text-amber-700 text-sm">Test in Progress</p>
                        </div>
                      </div>
                    );
                  } catch (error) {
                    console.error('Error parsing user data in profile display:', error);
                    return (
                      <div className="flex items-center gap-4 opacity-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shadow-lg border-2 border-white">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-amber-900">Placeholder Name</h3>
                          <p className="text-amber-700 text-sm">Test in Progress</p>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>

              <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-2">
                  {quiz.title}
                </h1>
                <p className="text-amber-700 text-base">{quiz.description}</p>
              </div>

              {/* Stats Grid - Textbook Style */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {/* Time Left */}
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
                  <Clock className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-800 mb-1">
                    {minutes}:{seconds.toString().padStart(2, "0")}
                  </div>
                  <div className="text-sm font-medium text-red-700">Time Remaining</div>
                </div>

                {/* Answered Questions */}
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-800 mb-1">
                    {answeredQuestions}/{quiz.questions.length}
                  </div>
                  <div className="text-sm font-medium text-green-700">Answered</div>
                </div>

                {/* Current Question */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                  <Brain className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-800 mb-1">
                    {currentQuestion + 1}/{quiz.questions.length}
                  </div>
                  <div className="text-sm font-medium text-blue-700">Current Question</div>
                </div>
              </div>

              {/* Progress Bar - Fixed dimensions to prevent CLS */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-amber-800">Progress</span>
                  <span className="text-sm font-bold text-amber-900">{Math.round(progress)}%</span>
                </div>
                <div className="relative h-3 bg-amber-100 rounded-full border border-amber-200 overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
              {/* Question Section */}
              <div className="lg:col-span-3">
                <Card className="bg-white border-2 border-amber-200 shadow-lg">
                  <CardHeader className="bg-gradient-to-br from-amber-50 to-orange-50 pb-4">
                    <h2 className="flex items-center gap-3 text-amber-900 text-xl font-bold">
                      <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <span>Question {currentQuestion + 1}</span>
                    </h2>
                  </CardHeader>

                  <CardContent className="p-6">
                    {/* LCP-critical content - question text */}
                    <div className="mb-6">
                      <p
                        className="text-lg text-gray-800 leading-relaxed font-medium"
                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 200px' }}
                      >
                        {currentQuestionData.text}
                      </p>
                    </div>

                    <RadioGroup
                      value={answers[currentQuestion]?.toString() || ""}
                      onValueChange={handleAnswerChange}
                      className="space-y-3"
                    >
                      {currentQuestionData.options.map((option, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                            answers[currentQuestion] === index
                              ? "border-amber-500 bg-amber-50 shadow-md"
                              : "border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-amber-25"
                          }`}
                          onClick={() => handleAnswerChange(index.toString())}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <RadioGroupItem
                                value={index.toString()}
                                id={`option-${index}`}
                                className="h-5 w-5 border-2 border-amber-400 text-amber-600"
                              />
                            </div>
                            <Label
                              htmlFor={`option-${index}`}
                              className="text-gray-700 cursor-pointer flex-1 font-medium text-base leading-relaxed"
                            >
                              {option}
                            </Label>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleClearResponse}
                      variant="outline"
                      className="bg-white border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 px-4 py-2 font-semibold"
                    >
                      Clear Response
                    </Button>
                    <Button
                      onClick={handleMarkForReview}
                      variant="outline"
                      className="bg-white border-2 border-yellow-300 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-400 px-4 py-2 font-semibold"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Mark for Review
                    </Button>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handlePrevious}
                      disabled={currentQuestion === 0}
                      variant="outline"
                      className="bg-white border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 px-4 py-2 font-semibold disabled:opacity-50"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>

                    {currentQuestion === quiz.questions.length - 1 ? (
                      <Button
                        onClick={showSubmitConfirmation}
                        disabled={submitting}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-2 font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {submitting ? (
                          <span className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            Submitting...
                          </span>
                        ) : (
                          <>
                            Submit Quiz
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-2 font-bold shadow-md hover:shadow-lg"
                      >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
                </div>

              {/* Question Overview Sidebar */}
              <div className="lg:col-span-1">
                <Card className="bg-white border-2 border-amber-200 shadow-lg">
                  <CardHeader className="bg-gradient-to-br from-amber-50 to-orange-50 pb-4">
                    <h3 className="text-amber-900">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">Questions</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-green-700 font-medium">Active</span>
                        </div>
                      </div>
                    </h3>
                  </CardHeader>

                  <CardContent className="p-4">
                    {/* Question Grid */}
                    <div className="grid grid-cols-4 gap-2 mb-6">
                      {quiz.questions.map((_, index) => {
                        const status = questionStatuses[index] || QuestionStatus.NotViewed;
                        const isActive = currentQuestion === index;

                        return (
                          <button
                            key={index}
                            onClick={() => handleQuestionNavigation(index)}
                            className={`
                              relative w-10 h-10 rounded-lg font-bold text-white transition-all duration-200 hover:scale-110 shadow-md
                              ${isActive ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-white" : ""}
                              ${status === QuestionStatus.Attempted ? "bg-green-500 hover:bg-green-600" :
                                status === QuestionStatus.Viewed ? "bg-red-500 hover:bg-red-600" :
                                status === QuestionStatus.NotViewed ? "bg-gray-400 hover:bg-gray-500" :
                                "bg-blue-500 hover:bg-blue-600"}
                            `}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>

                    {/* Status Legend */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-3">Legend</h4>
                      {[
                        { label: "Answered", color: "bg-green-500" },
                        { label: "Not Answered", color: "bg-red-500" },
                        { label: "Not Visited", color: "bg-gray-400" },
                        { label: "Marked for Review", color: "bg-blue-500" },
                      ].map(({ label, color }) => (
                        <div key={label} className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${color}`}></div>
                          <span className="text-gray-700 text-sm">{label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        <Suspense fallback={null}>
          <ConfirmationModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={handleSubmit}
            title={confirmModalData.title}
            message={confirmModalData.message}
            confirmText={confirmModalData.confirmText}
            cancelText={confirmModalData.cancelText}
            type={confirmModalData.type}
            unansweredCount={confirmModalData.unansweredCount}
          />
        </Suspense>
      </main>
      <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse"></div>}>
        <Footer />
      </Suspense>
    </>
  );
}