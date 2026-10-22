"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { progressByQuiz, type QuizProgress } from "@/lib/attempt-stats";

// One request per page for the signed-in visitor's test history, shared by every quiz card.
let progressPromise: Promise<Record<string, QuizProgress>> | null = null;

function loadMyProgress(): Promise<Record<string, QuizProgress>> {
  if (!progressPromise) {
    progressPromise = (async () => {
      const user = JSON.parse(localStorage.getItem("user") || "null") as { mobile?: string } | null;
      // Attempts are saved with the mobile number as the user id (see the quiz page's submit).
      if (!user?.mobile) return {};
      const res = await fetch(`/api/quiz-attempts?userId=${encodeURIComponent(user.mobile)}`, { cache: "no-store" });
      if (!res.ok) return {};
      const json = await res.json();
      return progressByQuiz(json.data?.attempts ?? []);
    })().catch(() => ({}));
  }
  return progressPromise;
}

/** Bottom of a quiz card: "already taken" badge with the best score, and Start / Start again. */
export function QuizCardAction({ quizId }: { quizId: string }) {
  const [progress, setProgress] = useState<QuizProgress | null>(null);
  useEffect(() => {
    let alive = true;
    loadMyProgress().then((all) => alive && setProgress(all[quizId] ?? null));
    return () => {
      alive = false;
    };
  }, [quizId]);

  return (
    <>
      {progress && (
        <p className="mt-3 inline-flex items-center gap-1 self-start rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-800">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          Already taken{progress.attempts > 1 ? ` ${progress.attempts}×` : ""} · Best {progress.bestScore}/{progress.total}
        </p>
      )}
      <span className="mt-4 inline-flex items-center justify-center gap-1 rounded-lg bg-amber-700 py-2 text-sm font-semibold text-white transition group-hover:bg-amber-800">
        {progress ? "Start again" : "Start Test"}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </>
  );
}

type User = { _id: string; name: string };

/** Greeting and logout button for a signed-in visitor. Renders nothing for guests. */
export function QuizUserBar() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    try {
      const data = localStorage.getItem("user");
      if (data) setUser(JSON.parse(data));
    } catch {
      // Ignore bad or blocked storage.
    }
  }, []);
  if (!user) return null;

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Logged out successfully");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-amber-900 font-semibold">
        Welcome, {user.name}! Are you ready for the test?
      </p>
      <button
        onClick={logout}
        className="bg-white border-2 border-red-300 text-red-600 hover:bg-red-50 px-4 py-1.5 rounded-lg font-semibold"
      >
        Logout
      </button>
    </div>
  );
}
