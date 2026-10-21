"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, X } from "lucide-react";
import { isPushConfigured, isPushSupportedBrowser } from "@/lib/push-config";
import {
  parseStoredTime,
  pushErrorMessage,
  PUSH_DISMISSED_KEY,
  shouldShowPushPrompt,
  type PushPermission,
} from "@/lib/push-prompt";

// Wait a little after load so the prompt never competes with the page content.
const SHOW_DELAY_MS = 8000;

type Status = "hidden" | "prompt" | "working" | "done" | "error";

function readTime(key: string): number | null {
  try {
    return parseStoredTime(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function writeTime(key: string) {
  try {
    localStorage.setItem(key, String(Date.now()));
  } catch {
    // Private mode or storage disabled: the prompt may show again next visit.
  }
}

async function startMessaging() {
  const { startPushMessaging } = await import("@/lib/push-client");
  return startPushMessaging();
}

/** Small "Get exam alerts" card. Browser permission is requested only when the visitor clicks Enable. */
export default function PushOptIn() {
  const pathname = usePathname() ?? "/";
  const [status, setStatus] = useState<Status>("hidden");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isPushSupportedBrowser() || !isPushConfigured() || pathname.startsWith("/admin")) return;
    const permission = Notification.permission as PushPermission;

    // Already subscribed: re-register quietly (picks up a changed FID) and show messages while a page is open.
    if (permission === "granted") {
      startMessaging().catch((error) => console.warn("Push alerts unavailable:", error));
      return;
    }

    const timer = setTimeout(() => {
      const show = shouldShowPushPrompt({
        supported: true,
        configured: true,
        permission: Notification.permission as PushPermission,
        dismissedAt: readTime(PUSH_DISMISSED_KEY),
        now: Date.now(),
        pathname,
      });
      if (show) setStatus("prompt");
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
    // Only decide once per page load; navigating should not re-open a dismissed card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = useCallback(() => {
    writeTime(PUSH_DISMISSED_KEY);
    setStatus("hidden");
  }, []);

  const enable = useCallback(async () => {
    setStatus("working");
    let permission: NotificationPermission;
    try {
      // Called directly from the click so browsers treat it as user-initiated.
      permission = await Notification.requestPermission();
    } catch (error) {
      setMessage(pushErrorMessage(error));
      setStatus("error");
      return;
    }

    if (permission !== "granted") {
      writeTime(PUSH_DISMISSED_KEY);
      if (permission === "denied") {
        setMessage(pushErrorMessage({ code: "messaging/permission-blocked" }));
        setStatus("error");
      } else {
        setStatus("hidden");
      }
      return;
    }

    try {
      await startMessaging();
      setMessage("Done! You'll get alerts for new jobs, results and admit cards.");
      setStatus("done");
      setTimeout(() => setStatus("hidden"), 5000);
    } catch (error) {
      console.error("Could not enable push alerts:", error);
      setMessage(pushErrorMessage(error));
      setStatus("error");
    }
  }, []);

  if (status === "hidden") return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Exam alerts"
      className="fixed bottom-4 left-4 right-4 z-50 sm:right-auto sm:w-96 rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900"
    >
      <button
        type="button"
        onClick={dismiss}
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
                  onClick={enable}
                  disabled={status === "working"}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {status === "working" ? "Enabling…" : "Enable notifications"}
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  disabled={status === "working"}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Not now
                </button>
              </div>
            </>
          ) : (
            <p className={`mt-1 text-sm ${status === "error" ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
