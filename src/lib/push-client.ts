// Browser-only FCM setup. Load with `await import("@/lib/push-client")` from a client component.
import { getApps, initializeApp } from "firebase/app";
import { getMessaging, isSupported, onMessage, onRegistered, onUnregistered, register } from "firebase/messaging";
import { firebaseVapidKey, firebaseWebConfig } from "./push-config";
import { parseStoredTime, PUSH_FID_KEY, PUSH_SYNCED_KEY, shouldSaveFid } from "./push-prompt";

const SW_SCOPE = "/firebase-cloud-messaging-push-scope";
const REGISTER_TIMEOUT_MS = 20_000;

let started: Promise<string> | null = null;

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

async function saveFid(fid: string, method: "POST" | "DELETE") {
  const store = storage();
  if (method === "POST") {
    // onRegistered fires on every page load; only write to the server when something changed.
    if (store && !shouldSaveFid(fid, store.getItem(PUSH_FID_KEY), parseStoredTime(store.getItem(PUSH_SYNCED_KEY)), Date.now())) return;
  } else if (store?.getItem(PUSH_FID_KEY) === fid) {
    store.removeItem(PUSH_FID_KEY);
    store.removeItem(PUSH_SYNCED_KEY);
  }

  const res = await fetch("/api/push/subscribe", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fid }),
    keepalive: true,
  });
  if (method === "POST") {
    if (!res.ok) throw Object.assign(new Error("Subscription not saved"), { code: "messaging/registration-failed" });
    try {
      store?.setItem(PUSH_FID_KEY, fid);
      store?.setItem(PUSH_SYNCED_KEY, String(Date.now()));
    } catch {
      // Storage full or disabled: the FID is simply re-sent next time.
    }
  }
}

/** The service worker reads the public config from its query string, so no Firebase values are hard-coded in /public. */
function serviceWorkerUrl(): string {
  return `/firebase-messaging-sw.js?${new URLSearchParams(firebaseWebConfig).toString()}`;
}

/**
 * Registers this browser with FCM (permission must already be granted) and saves its Firebase Installation ID.
 * Also shows foreground messages, since FCM only displays notifications itself when no page of the site is focused.
 * Resolves with the FID once the server has stored it.
 */
export function startPushMessaging(): Promise<string> {
  if (started) return started;
  started = (async () => {
    if (!(await isSupported())) throw Object.assign(new Error("Unsupported"), { code: "messaging/unsupported-browser" });

    let registration: ServiceWorkerRegistration;
    try {
      registration = await navigator.serviceWorker.register(serviceWorkerUrl(), { scope: SW_SCOPE });
    } catch (error) {
      throw Object.assign(new Error(String(error)), { code: "messaging/failed-service-worker-registration" });
    }

    const app = getApps()[0] ?? initializeApp(firebaseWebConfig);
    const messaging = getMessaging(app);

    onMessage(messaging, (payload) => {
      const title = payload.notification?.title;
      if (!title) return;
      const url = payload.fcmOptions?.link || payload.data?.url;
      // Same tag as the background notification, so one message never shows twice.
      registration
        .showNotification(title, {
          body: payload.notification?.body,
          icon: payload.notification?.icon || "/logo.png",
          tag: payload.data?.type && payload.data?.id ? `${payload.data.type}-${payload.data.id}` : undefined,
          data: { url },
        })
        .catch((error) => console.error("Could not show notification", error));
    });

    onUnregistered(messaging, (fid) => {
      saveFid(fid, "DELETE").catch(() => {});
    });

    const fid = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(Object.assign(new Error("Timed out"), { code: "messaging/registration-failed" })),
        REGISTER_TIMEOUT_MS,
      );
      onRegistered(messaging, (id) => {
        saveFid(id, "POST").then(
          () => {
            clearTimeout(timer);
            resolve(id);
          },
          (error) => {
            clearTimeout(timer);
            reject(error);
          },
        );
      });
      register(messaging, { vapidKey: firebaseVapidKey, serviceWorkerRegistration: registration }).catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
    return fid;
  })();
  // Let a later click retry after a failure.
  started.catch(() => {
    started = null;
  });
  return started;
}
