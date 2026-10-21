# Web push notifications (exam alerts)

Visitors can opt in to browser notifications for new jobs, results, admit cards, answer keys, admissions, news and free test series. Admins send a notification for one published item from the admin dashboard. Sending never happens automatically on create, edit or import.

Provider: Firebase Cloud Messaging (FCM) Web Push, using Firebase Installation IDs (FIDs) through `register()` / `onRegistered()`. The older `getToken()` registration-token API is deprecated in the current SDK and is not used.

## How it works

| Piece | File |
| --- | --- |
| Opt-in card ("Get exam alerts"), mounted in the root layout | `src/components/PushOptIn.tsx` |
| Prompt rules (when to show, dismiss cooldown, error text) | `src/lib/push-prompt.ts` |
| Browser FCM setup: service worker, `register()`, foreground messages | `src/lib/push-client.ts` (loaded on demand) |
| Public Firebase config from env | `src/lib/push-config.ts` |
| Service worker (background notifications, click handling) | `public/firebase-messaging-sw.js` |
| Save / remove a browser's FID (public, rate limited) | `POST` / `DELETE /api/push/subscribe` |
| Preview and send (admin only) | `GET` / `POST /api/admin/push` |
| Admin "Send push" button + preview dialog | `src/app/admin/components/SendPushButton.tsx` |
| Validation, default messages, destination URLs | `src/lib/push.ts` |
| Admin JWT check | `src/lib/admin-auth.ts` |
| Mongo collections | `PushSubscription` (FID only), `PushNotificationLog` (send history) |

Visitor flow:
1. On a public page, after about 8 seconds, browsers that support push and haven't decided yet see a small card. Nothing is requested on page load.
2. **Enable notifications** calls `Notification.requestPermission()` from that click. **Not now** or the close button hides the card for 30 days. If the visitor blocks notifications, the card tells them how to change it in browser settings and does not ask again.
3. When permission is granted, the service worker is registered at scope `/firebase-cloud-messaging-push-scope`, so it never controls page loads. The FID is then stored through `/api/push/subscribe`. On later visits the FID is sent again only if it changed, or once a day.

Admin flow: write your own message at any time:
1. In `/admin`, open the **Notifications** tab.
2. Fill in a title, a message and an optional link. The link must be a page on this site, such as `/jobs` or a full `https://www.sarkariresultsnow.com/...` URL; leave it empty to open the homepage.
3. Check the preview, click **Send notification** and confirm. The right-hand side lists the last 20 notifications sent, both custom and per-item, with delivery counts.
4. This uses `GET` / `POST /api/admin/push/custom` (admin only). Each custom message gets its own tag, so two announcements never replace each other on a device.

Admin flow: send for one item:
1. In `/admin`, each published item in the Jobs, Results, Admit Cards, Answer Keys, Admissions, News and Quizzes lists has a **Send push** button.
2. The dialog shows the default title and message (both editable), the destination URL, the subscriber count and when the item was last sent.
3. The admin confirms before anything is sent. If the item was already sent, the admin must tick **Send again** first.
4. The server builds the destination from the database record (`/jobs/<slug>-<id>`, `/quizzes/<slug>-<id>/instructions`, …), so a destination can't be pointed at another site. It sends in batches of 500 and deletes FIDs that FCM reports as no longer registered. One bad FID doesn't stop delivery to the rest.

Clicking a notification opens the item's page. When a page of the site is already open and focused, the page shows the notification with the same tag, so it only appears once.

## One-time setup

### Firebase
1. Create a Firebase project, or reuse one, at https://console.firebase.google.com.
2. **Project settings → General → Your apps → Add app → Web.** Copy `apiKey`, `projectId`, `messagingSenderId` and `appId`.
3. **Project settings → Cloud Messaging → Web Push certificates → Generate key pair.** Copy the public key: this is the VAPID key.
4. Check that the **Firebase Cloud Messaging API** and the **FCM Registration API** are enabled for the project in Google Cloud console → APIs & Services. New projects have them on by default.
5. **Project settings → Service accounts → Generate new private key.** This downloads a JSON file. Do not commit it.

### Vercel environment variables
Add these for **Production**, and for **Preview**/**Development** if wanted. Ideally use a separate Firebase project for non-production.

| Variable | Value | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | web app `apiKey` | no (public) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` | no |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` | no |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` | no |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Web Push public key | no |
| `FIREBASE_PROJECT_ID` | `project_id` from the service-account JSON | yes |
| `FIREBASE_CLIENT_EMAIL` | `client_email` from the JSON | yes |
| `FIREBASE_PRIVATE_KEY` | `private_key` from the JSON, as one line with `\n` | yes |

`NEXT_PUBLIC_*` values are built into the browser bundle, so **redeploy after changing them**. Without the public values, the opt-in card never appears. Without the server values, the admin dialog says Firebase is not configured and sending is refused.

See `.env.example` for the format. For local development, copy it to `.env.local`.

### Rotating credentials
- **Service-account key:** generate a new key, update `FIREBASE_PRIVATE_KEY` (and `FIREBASE_CLIENT_EMAIL` if it changed) in Vercel, redeploy, then delete the old key in Google Cloud → IAM → Service accounts → Keys.
- **VAPID key pair:** changing it invalidates existing browser subscriptions. Avoid it unless the key has leaked. After rotating, subscribers re-register automatically on their next visit.

### Keeping the SDK version in step
`public/firebase-messaging-sw.js` loads the Firebase compat scripts from gstatic at `FIREBASE_SDK_VERSION`. When you upgrade the `firebase` npm package, update that constant to match.

## Testing
1. Run the site over HTTPS, or on `http://localhost`, which browsers treat as secure.
2. Open a public page, wait for the card and click **Enable notifications**. Allow the browser prompt.
3. Check that a document now exists in the `pushsubscriptions` collection.
4. Log in to `/admin`, click **Send push** on a published item and confirm. Then:
   - With the site tab in the background or closed, a system notification should appear. Clicking it opens the item.
   - With the site tab focused, the notification is shown by the page.
5. Reset a test browser by clearing site data, or by resetting the notification permission in the browser's site settings.

Automated tests: `pnpm test` (`tests/unit/push.test.ts`) covers validation, destinations, prompt and permission rules, admin authorization and rate limiting.

## Limitations and troubleshooting
- **Delivery isn't guaranteed.** It depends on browser and OS notification settings, focus/do-not-disturb modes, battery savers, connectivity and FCM itself. Messages expire after 24 hours (`TTL`).
- **iOS / iPadOS** (16.4+) only supports web push for sites added to the Home Screen as a web app, which needs a web app manifest. This site doesn't have one yet, so iPhone Safari visitors won't see the card.
- **Firefox and Safari on macOS** are supported. Some browsers, such as Brave, need push messaging enabled in their settings. In-app browsers, like those inside Instagram or Telegram, usually don't support push.
- **Card never appears:** check the `NEXT_PUBLIC_*` variables and redeploy. The browser may not support push, permission may already be granted or denied, or the visitor may have dismissed the card in the last 30 days (`localStorage` key `srn-push-dismissed-at`).
- **"Could not subscribe":** check the browser console. A common cause is the FCM Registration API being disabled, or a VAPID key from a different Firebase project.
- **Admin gets "Admin session expired":** the admin token lasts 1 hour, so log in again.
- **The rate limit** on `/api/push/subscribe` (10 requests/minute per IP) is per server instance. It is basic abuse protection, not a global quota.
