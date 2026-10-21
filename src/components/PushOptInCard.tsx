"use client";

import { Bell, X } from "lucide-react";

export type PushOptInStatus = "prompt" | "working" | "done" | "error";

/**
 * The "Get exam alerts" card. Purely visual: PushOptIn drives it on the site, and the admin Notifications tab
 * renders it inline as a preview so admins see exactly what visitors see.
 */
export default function PushOptInCard({
  status,
  message = "",
  onEnable,
  onNotNow,
  onClose,
  inline = false,
}: {
  status: PushOptInStatus;
  message?: string;
  onEnable?: () => void;
  onNotNow?: () => void;
  onClose?: () => void;
  /** Render in place (admin preview) instead of fixed to the bottom of the screen. */
  inline?: boolean;
}) {
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Exam alerts"
      className={`${
        inline ? "relative w-full max-w-sm" : "fixed bottom-4 left-4 right-4 z-50 sm:right-auto sm:w-96"
      } rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900`}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-2 top-2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex gap-3 pr-5">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
          <Bell className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-gray-100">Get exam alerts</p>
          {status === "prompt" || status === "working" ? (
            <>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Latest jobs, results, admit cards, answer keys, exam dates and free test series, even when this site is closed.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={onEnable}
                  disabled={status === "working"}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {status === "working" ? "Enabling…" : "Enable notifications"}
                </button>
                <button
                  type="button"
                  onClick={onNotNow}
                  disabled={status === "working"}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Not now
                </button>
              </div>
            </>
          ) : (
            <p
              className={`mt-1 text-sm ${
                status === "error" ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
