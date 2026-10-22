"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Eye,
  ListChecks,
  LogOut,
  Phone,
  RotateCcw,
  Target,
  Trophy,
  User,
} from "lucide-react"
import { attemptNumbers, grade, percentOf, type AttemptRow, type summarizeAttempts } from "@/lib/attempt-stats"
import { quizPath } from "@/lib/slug"

type Stats = ReturnType<typeof summarizeAttempts>
type Rank = { position: number; totalUsers: number } | null

interface UserProfile {
  _id: string
  name: string
  mobile?: string
  email?: string
  joinedAt?: string
  profileImage?: string
}

const EMPTY_STATS: Stats = { testsTaken: 0, uniqueTests: 0, averagePercent: 0, bestPercent: 0, totalCorrect: 0, totalQuestions: 0 }

function barColor(percent: number) {
  if (percent >= 80) return "bg-green-600"
  if (percent >= 60) return "bg-amber-500"
  return "bg-red-500"
}

function StatCard({ icon: Icon, value, label, hint }: { icon: typeof Trophy; value: React.ReactNode; label: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-amber-800">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
      {hint && <div className="text-xs text-gray-600">{hint}</div>}
    </div>
  )
}

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [checkedLogin, setCheckedLogin] = useState(false)
  const [attempts, setAttempts] = useState<AttemptRow[]>([])
  const [stats, setStats] = useState<Stats>(EMPTY_STATS)
  const [rank, setRank] = useState<Rank>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const data = localStorage.getItem("user")
      if (data) {
        const parsed = JSON.parse(data)
        setUser({ ...parsed, joinedAt: parsed.joinedAt || parsed.createdAt })
        setProfileImage(parsed.profileImage || localStorage.getItem("profileImage"))
      }
    } catch {
      // Bad or blocked storage: treat as logged out.
    } finally {
      setCheckedLogin(true)
    }
  }, [])

  // Test attempts are saved with the mobile number as the user id (see the quiz page's submit).
  const historyId = user?.mobile || user?._id

  const fetchHistory = useCallback(async (id: string) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/quiz-attempts?userId=${encodeURIComponent(id)}`, { cache: "no-store" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Could not load your test history")
      setAttempts(json.data.attempts)
      setStats(json.data.stats)
      setRank(json.data.rank)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your test history")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (historyId) fetchHistory(historyId)
  }, [historyId, fetchHistory])

  const handleLogout = () => {
    localStorage.removeItem("user")
    toast.success("Logged out successfully")
    window.location.href = "/quizzes"
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("userId", user._id)
    try {
      const res = await fetch("/api/profile-image", { method: "POST", body: formData })
      const data = await res.json()
      if (data.success && data.imageUrl) {
        setProfileImage(data.imageUrl)
        localStorage.setItem("profileImage", data.imageUrl)
        setUser((prev) => (prev ? { ...prev, profileImage: data.imageUrl } : prev))
        toast.success("Profile image updated!")
      } else {
        toast.error("Failed to upload image")
      }
    } catch {
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  if (!checkedLogin) return <div className="min-h-screen bg-amber-50" />

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-800">
            <User className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Log in to see your profile</h1>
          <p className="mt-2 text-gray-700">Your test history, scores and rank appear here after you log in and take a mock test.</p>
          <Link
            href="/quizzes"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-700 px-6 py-2.5 font-semibold text-white hover:bg-amber-800"
          >
            Go to Free Mock Tests <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    )
  }

  const numbers = attemptNumbers(attempts)
  const avgGrade = grade(stats.averagePercent)

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Profile header */}
        <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-800" />
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change profile image"
                title="Change profile image"
                className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-600 to-orange-600 text-white shadow"
              >
                {uploading ? (
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8" aria-hidden="true" />
                )}
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold text-gray-900">{user.name}</h1>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
                  {user.mobile && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      {user.mobile}
                    </span>
                  )}
                  {user.joinedAt && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      Joined {new Date(user.joinedAt).toLocaleDateString("en-IN")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 sm:self-auto"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        </section>

        {/* Stats */}
        <section aria-label="Your stats" className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard icon={ListChecks} label="Tests taken" value={loading ? "…" : stats.testsTaken} hint={`${stats.uniqueTests} different tests`} />
          <StatCard
            icon={BarChart3}
            label="Average score"
            value={loading ? "…" : `${stats.averagePercent}%`}
            hint={stats.testsTaken ? `Grade ${avgGrade.grade} · ${avgGrade.label}` : undefined}
          />
          <StatCard
            icon={Trophy}
            label="Best score"
            value={loading ? "…" : `${stats.bestPercent}%`}
            hint={stats.totalQuestions ? `${stats.totalCorrect}/${stats.totalQuestions} correct overall` : undefined}
          />
          <StatCard
            icon={Award}
            label="Rank"
            value={loading ? "…" : rank ? `#${rank.position}` : "—"}
            hint={rank ? `of ${rank.totalUsers} students` : "Take a test to get ranked"}
          />
        </section>

        {/* History */}
        <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-gray-900">Your Test History</h2>
            <Link href="/quizzes" className="inline-flex items-center gap-1 text-sm font-semibold text-amber-800 hover:underline">
              Browse all free mock tests <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {loading ? (
            <ul className="space-y-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <li key={i} className="h-20 animate-pulse rounded-xl bg-amber-50" />
              ))}
            </ul>
          ) : error ? (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
              {error}{" "}
              <button type="button" onClick={() => historyId && fetchHistory(historyId)} className="font-semibold underline">
                Try again
              </button>
            </div>
          ) : attempts.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <Target className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No tests taken yet</h3>
              <p className="mt-1 text-gray-700">Take your first free mock test; your score and progress will appear here.</p>
              <Link
                href="/quizzes"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-700 px-5 py-2 font-semibold text-white hover:bg-amber-800"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Start a mock test
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {attempts.map((a) => {
                const percent = percentOf(a.score, a.total)
                const g = grade(percent)
                const title = a.quiz?.title ?? "Deleted test"
                const when = new Date(a.completedAt)
                return (
                  <li key={a._id} className="rounded-xl border border-amber-100 p-4 transition hover:border-amber-300">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{title}</h3>
                          {numbers[a._id] > 1 && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                              Attempt {numbers[a._id]}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-600">
                          {[a.quiz?.subcategory || a.quiz?.category, `${when.toLocaleDateString("en-IN")}, ${when.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="h-2 w-40 max-w-full overflow-hidden rounded-full bg-gray-200" aria-hidden="true">
                            <div className={`h-full ${barColor(percent)}`} style={{ width: `${percent}%` }} />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {a.score}/{a.total} correct · {percent}%
                          </span>
                          <span className="rounded bg-gray-100 px-1.5 text-xs font-bold text-gray-800" title={g.label}>
                            {g.grade}
                          </span>
                        </div>
                      </div>
                      {a.quiz && (
                        <div className="flex shrink-0 gap-2">
                          <Link
                            href={`/quizzes/${a.quizId}/results?attemptId=${a._id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-50"
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                            View result
                          </Link>
                          <Link
                            href={quizPath(a.quiz)}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-800"
                          >
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                            Start again
                          </Link>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {!loading && attempts.length > 0 && (
            <p className="mt-4 flex items-center gap-1 text-xs text-gray-600">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-700" aria-hidden="true" />
              Rank is based on total correct answers across all tests.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

export default ProfilePage
