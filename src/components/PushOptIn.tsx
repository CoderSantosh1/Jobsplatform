"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isPushConfigured, isPushSupportedBrowser } from "@/lib/push-config";
import PushOptInCard from "@/components/PushOptInCard";
import {
  parseStoredTime,
  pushErrorMessage,
  PUSH_DISMISSED_KEY,
  shouldShowPushPrompt,
  type PushPermission,
} from "@/lib/push-prompt";

// Wait a little after load so the prompt never competes with the page content.
const SHOW_DELAY_MS = 3000;

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

  return <PushOptInCard status={status} message={message} onEnable={enable} onNotNow={dismiss} onClose={dismiss} />;
}
