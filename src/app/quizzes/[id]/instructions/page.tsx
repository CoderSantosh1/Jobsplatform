"use client"
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import React, { useEffect, useState } from "react"
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileText,
  Target,
  RotateCcw,
  Globe,
} from "lucide-react"
import { instructions } from "./lang"
import AuthModal from '@/components/AuthModal'
import { idFromParam } from "@/lib/slug";

const statusLegend = {
  en: [
    { color: "bg-gray-400", label: "You have not visited the question yet." },
    { color: "bg-red-500", label: "You have not answered the question." },
    { color: "bg-green-500", label: "You have answered the question." },
    { color: "bg-purple-400", label: "You have NOT answered the question, but have marked the question for review." },
    { color: "bg-purple-700", label: "You have answered the question, but marked it for review." },
  ],
  hi: [
    { color: "bg-gray-400", label: "आपने अभी तक प्रश्न नहीं देखा है।" },
    { color: "bg-red-500", label: "आपने प्रश्न का उत्तर नहीं दिया है।" },
    { color: "bg-green-500", label: "आपने प्रश्न का उत्तर दिया है।" },
    { color: "bg-purple-400", label: "आपने प्रश्न का उत्तर नहीं दिया है, लेकिन समीक्षा के लिए चिह्नित किया है।" },
    { color: "bg-purple-700", label: "आपने प्रश्न का उत्तर दिया है, लेकिन समीक्षा के लिए चिह्नित किया है।" },
  ]
};

export default function QuizInstructions({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  // URLs may carry a readable slug ("ssc-gd-mock-test-<id>"); everything below uses the bare id.
  const resolvedParams = { id: idFromParam(React.use(params).id) };
  const [lang, setLang] = useState<'en' | 'hi'>('en')
  const [languageLoading, setLanguageLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState<{ name: string; mobile: string } | null>(null);

  useEffect(() => {
    // Set language from localStorage or default to 'en'
    const stored = typeof window !== "undefined" ? localStorage.getItem("lang") : null;
    if (stored === "hi" || stored === "en") setLang(stored);

    // Registration check
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (!userData) {
        setShowRegister(true);
      } else {
        try {
          setUser(JSON.parse(userData));
        } catch {
          setShowRegister(true);
        }
      }
    }
  }, []);

  const handleRegister = (user: { name: string; mobile: string }) => {
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    setShowRegister(false);
  };

  const t = instructions[lang]

  const handleStart = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`quiz-instructions-acknowledged-${resolvedParams.id}`, 'true');
    }
    router.push(`/quizzes/${resolvedParams.id}`);
  }

  const handlePrevious = () => {
    router.back()
  }

  const handleLanguageChange = async (languageCode: 'en' | 'hi') => {
    if (languageCode === lang) {
      return;
    }

    setLanguageLoading(true);

    try {
      // Update language
      setLang(languageCode);

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem("lang", languageCode);
      }
    } catch (error) {
      console.error("Error changing language:", error);
    } finally {
      setLanguageLoading(false);
    }
  }


  if (showRegister) {
    return <AuthModal onSuccess={handleRegister} />;
  }

  return (
    <>
      <Header />
        {/* Mobile Language Selector - Shows after header */}
        <div className="sm:hidden px-6 pb-4">
              <div className="flex justify-center">
                <div className="flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
                  <Globe className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <select
                    value={lang}
                    onChange={(e) => handleLanguageChange(e.target.value as 'hi' | 'en')}
                    className="bg-transparent border-none outline-none text-amber-800 font-medium"
                    disabled={languageLoading}
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी</option>
                  </select>
                </div>
              </div>
            </div>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
        <div className="container mx-auto max-w-8xl">
          <div className="bg-white/95 backdrop-blur-sm border-2 border-amber-200 shadow-2xl mb-6 sm:mb-8 rounded-xl overflow-hidden">

            {/* Textbook-style header with binding */}
            <div className="h-2 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-800"></div>

            {/* Language Selector - Desktop: top-right, Mobile: after header */}
            <div className="hidden sm:block absolute top-4 right-4 z-20">
              <div className="flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
                <Globe className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <select
                  value={lang}
                  onChange={(e) => handleLanguageChange(e.target.value as 'hi' | 'en')}
                  className="bg-transparent border-none outline-none text-amber-800 font-medium"
                  disabled={languageLoading}
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                </select>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 sm:p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-amber-900 mb-2">
                  {t.title}
                </h1>
                <p className="text-amber-700 font-medium text-lg">{t.subtitle}</p>
              </div>
            </div>

          

            {/* Language Loading Indicator */}
            {languageLoading && (
              <div className="mb-6 flex items-center justify-center gap-3 text-amber-700 bg-amber-100/80 px-6 py-3 rounded-lg border border-amber-300 mx-auto max-w-xs">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-amber-600"></div>
                <span className="text-sm font-medium">Changing language...</span>
              </div>
            )}

            <div className="p-6">
              <div className="space-y-6">
                {/* Question Status Guide - Textbook Style */}
                <Card className="bg-white border-2 border-blue-200 shadow-lg rounded-xl">
                  <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50 pb-4">
                    <CardTitle className="flex items-center gap-3 text-blue-900">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xl font-bold">{t.statusGuide}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-gray-700 leading-relaxed mb-6 text-base">
                      {t.instructions}
                    </p>

                    {/* Status Grid - Academic Style */}
                    <div className="grid gap-4">
                      {statusLegend[lang].map((status: { color: string; label: string }) => (
                        <div
                          key={status.label}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full ${status.color} flex-shrink-0`} />
                            <span className="text-gray-800 font-medium">{status.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Question Paper View - Textbook Style */}
                <Card className="bg-white border-2 border-indigo-200 shadow-lg rounded-xl">
                  <CardHeader className="bg-gradient-to-br from-indigo-50 to-purple-50 pb-4">
                    <CardTitle className="flex items-center gap-3 text-indigo-900">
                      <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xl font-bold">{t.QuestionPaperView}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-gray-700 leading-relaxed text-base">
                      {t.QuestionPaperViewall}
                    </p>
                  </CardContent>
                </Card>

                {/* Answering Instructions - Textbook Style */}
                <Card className="bg-white border-2 border-green-200 shadow-lg rounded-xl">
                  <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50 pb-4">
                    <CardTitle className="flex items-center gap-3 text-green-900">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xl font-bold">{t.AnsweringaQuestion}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white font-bold text-sm">A</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-base">
                          {t.ChooseAnswer}
                        </p>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <RotateCcw className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-gray-700 leading-relaxed text-base">
                          {t.NotchooseAnswer}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons - Textbook Style */}
                <div className="flex flex-col sm:flex-row justify-between gap-6 mt-8">
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-8 py-4 text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    {t.previous}
                  </Button>

                  <Button
                    onClick={handleStart}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-12 py-4 text-lg font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                  >
                    <span className="flex items-center justify-center gap-3">
                      {t.start}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}