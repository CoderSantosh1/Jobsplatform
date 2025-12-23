"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  Clock,
  FileText,
  Trophy,
  ArrowRight,
  Sparkles,
  UserIcon,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";

interface Quiz {
  _id: string;
  title: string;
  description: string;
  timeLimit: number;
  totalMarks: number;
  questions: Array<{
    _id: string;
    text: string;
    options: string[];
    correctAnswer: number;
  }>;
  attempts?: Array<{
    _id: string;
    userId: string;
    score: number;
    completedAt: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
  category: string;
  subcategory: string;
}


const translations = {
  en: {
    welcome: "Welcome",
    ready: "Are you Ready Test?",
    logout: "Logout",
    availableTests: "Available Tests",
    questions: "Questions",
    marks: "Marks",
    minutes: "Minutes",
    testStart: "Test Start",
    noQuizzes: "No Quizzes Available",
    noQuizzesDesc: "Available quizzes Soon....",
    loading: "Loading...",
    TestInstructions: "Test Instructions",
  },
  hi: {
    welcome: "स्वागत है",
    ready: "क्या आप Exam के लिए तैयार हैं?",
    logout: "लॉग आउट",
    availableTests: "उपलब्ध परीक्षाएं",
    questions: "प्रश्न",
    marks: "अंक",
    minutes: "मिनट",
    testStart: "परीक्षा शुरू करें",
    TestInstructions: "परीक्षण निर्देश",
    noQuizzes: "कोई प्रश्नोत्तरी उपलब्ध नहीं",
    noQuizzesDesc: "इस समय कोई प्रश्नोत्तरी उपलब्ध नहीं है COMMING SOON....।",
    loading: "लोड हो रहा है...",
  },
};

function QuizListContent() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState<{
    _id: string;
    name: string;
    mobile: string;
  } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams?.get("category");
  const subcategory = searchParams?.get("subcategory");

  // Get current translations
  const t = translations.en;

  // Function to check if quiz has been started
  const isQuizStarted = (quizId: string) => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`quiz-started-${quizId}`) === "true";
  };

  useEffect(() => {
    // Get user and language preference from localStorage
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          setLoggedInUser(JSON.parse(userData));
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }

    }

    const fetchQuizzes = async () => {
      try {
        const response = await fetch("/api/quizzes");
        if (!response.ok) {
          throw new Error("Failed to fetch quizzes");
        }
        const data = await response.json();
        console.log("Fetched quizzes data:", data);
        setQuizzes(data.data);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        toast.error("Failed to load quizzes");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setLoggedInUser(null);
    toast.success("Logged out successfully");
  };

  const handleAuthSuccess = (user: {
    _id: string;
    name: string;
    mobile: string;
  }) => {
    setLoggedInUser(user);
    toast.success(`${t.welcome}, ${user.name}!`);
  };


  // Filter quizzes based on category and subcategory, and exclude started quizzes
  const filteredQuizzes = quizzes.filter((quiz) => {
    // Hide quizzes that have been started
    if (isQuizStarted(quiz._id)) {
      return false;
    }

    if (category && subcategory) {
      return quiz.category === category && quiz.subcategory === subcategory;
    } else if (category) {
      return quiz.category === category;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-900 font-semibold">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (filteredQuizzes.length === 0) {
    return (
      <>
        <Header />
        <div className="container mx-auto py-16 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 min-h-screen">
          <div className="text-center max-w-2xl mx-auto px-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-amber-200">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-4 text-amber-900">
                {t.noQuizzes}
              </h1>
              <p className="text-amber-700 mb-8 text-lg">{t.noQuizzesDesc}</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Header />
      {/* User Profile Section */}
      {loggedInUser && (
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6">
          <Card className="border-2 border-amber-300 bg-white/95 backdrop-blur-sm shadow-2xl max-w-7xl mx-auto rounded-xl">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4 sm:gap-6 flex-1">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shadow-lg border-4 border-white">
                    <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-amber-900 mb-1">
                      {t.welcome}, {loggedInUser.name}
                    </h2>
                    <p className="text-amber-700 text-base sm:text-lg font-medium">
                      {t.ready}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-amber-600">Online</span>
                    </div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="text-center mb-8 sm:mb-4 px-4">
        <h1 className="text-[20px] sm:text-[20px] lg:text-5xl font-bold text-amber-900 mb-4 leading-tight">
          {t.availableTests}
        </h1>
      </div>
      <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-4 sm:px-6 md:px-8 lg:px-12">
        {filteredQuizzes.map((quiz) => (
          <Card
            key={quiz._id}
            className="group bg-white border-2 border-amber-200 hover:border-amber-400 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-xl overflow-hidden hover:-translate-y-1"
          >
            {/* Textbook-style header with binding */}
            <div className="h-2 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-800"></div>

            <CardHeader className="p-6 bg-gradient-to-br from-amber-50 to-orange-50">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold border border-green-200">
                  Available
                </div>
              </div>

              <CardTitle className="text-xl font-bold text-amber-900 leading-tight mb-2 line-clamp-2">
                {quiz.title}
              </CardTitle>
              <p className="text-amber-700 text-sm leading-relaxed">
                {quiz.description}
              </p>
            </CardHeader>

            <CardContent className="p-6 bg-white">
              {/* Academic Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <FileText className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-blue-800">
                    {quiz.questions.length}
                  </p>
                  <p className="text-xs text-blue-600 font-medium">
                    {t.questions}
                  </p>
                </div>

                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                  <Trophy className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-green-800">
                    {quiz.totalMarks}
                  </p>
                  <p className="text-xs text-green-600 font-medium">
                    {t.marks}
                  </p>
                </div>

                <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <Clock className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-purple-800">
                    {quiz.timeLimit}
                  </p>
                  <p className="text-xs text-purple-600 font-medium">
                    {t.minutes}
                  </p>
                </div>
              </div>

              {/* Subject/Category Badge */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium border border-amber-200">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  {quiz.category} • {quiz.subcategory}
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={`/quizzes/${quiz._id}/instructions`}
                className="block"
              >
                <Button className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 group/btn">
                  <span className="flex items-center justify-center gap-2">
                    {t.testStart}
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </span>
                </Button>
              </Link>

              {/* Textbook-style footer */}
              <div className="mt-4 pt-4 border-t border-amber-100">
                <div className="flex items-center justify-between text-xs text-amber-600">
                  <span>Test Series</span>
                  <span>Practice Mode</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-center mt-12 mb-8">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="bg-white border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-md"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t.logout}
        </Button>
      </div>

      {/* Community Section - Textbook Style */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 mb-12">
        <Card className="bg-white/95 backdrop-blur-sm border-2 border-amber-200 shadow-xl rounded-xl">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-amber-900 mb-2">Join Our Learning Community</h3>
              <p className="text-amber-700">Connect with fellow students and get the latest updates</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <button
                onClick={() => router.push("https://t.me/sarkariresultsnow")}
                className="bg-blue-50 border-2 border-blue-200 text-blue-700 px-6 py-4 rounded-lg font-semibold hover:bg-blue-100 hover:border-blue-300 transition-all duration-300 flex items-center justify-center gap-3 shadow-md"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">T</span>
                </div>
                Telegram
              </button>

              <button
                onClick={() =>
                  router.push("https://chat.whatsapp.com/BA5S3uiul7iHKwi4jIeuuf")
                }
                className="bg-green-50 border-2 border-green-200 text-green-700 px-6 py-4 rounded-lg font-semibold hover:bg-green-100 hover:border-green-300 transition-all duration-300 flex items-center justify-center gap-3 shadow-md"
              >
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">W</span>
                </div>
                WhatsApp
              </button>

              <button
                onClick={() =>
                  router.push("https://www.instagram.com/sarkariresultsnow/")
                }
                className="bg-pink-50 border-2 border-pink-200 text-pink-700 px-6 py-4 rounded-lg font-semibold hover:bg-pink-100 hover:border-pink-300 transition-all duration-300 flex items-center justify-center gap-3 shadow-md"
              >
                <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">I</span>
                </div>
                Instagram
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

export default function QuizList() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizListContent />
    </Suspense>
  );
}
