"use client";

import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

/** Hides a quiz card once the visitor has started that quiz (tracked in localStorage by the quiz page). */
export function HideIfStarted({ quizId, children }: { quizId: string; children: ReactNode }) {
  const [started, setStarted] = useState(false);
  useEffect(() => {
    try {
      setStarted(localStorage.getItem(`quiz-started-${quizId}`) === "true");
    } catch {
      // Storage blocked: show the card.
    }
  }, [quizId]);
  return started ? null : <>{children}</>;
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
