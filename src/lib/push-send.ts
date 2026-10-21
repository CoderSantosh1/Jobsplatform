// Sends one notification to every subscriber and records the outcome. Server only.
import { getAdminMessaging } from '@/lib/firebase-admin';
import PushSubscription from '@/lib/models/PushSubscription';
import PushNotificationLog from '@/lib/models/PushNotificationLog';
import { chunk, PUSH_SITE_URL, splitSendResults } from '@/lib/push';

/** Best-effort: remembers per subscriber whether this notification arrived, for the admin subscriber list. */
async function recordDelivery(received: string[], failed: { fid: string; code: string }[]) {
  const now = new Date();
  try {
    if (received.length) {
      await PushSubscription.updateMany(
        { fid: { $in: received } },
        { $set: { lastReceivedAt: now }, $inc: { receivedCount: 1 } }
      );
    }
    if (failed.length) {
      await PushSubscription.bulkWrite(
        failed.map(({ fid, code }) => ({
          updateOne: { filter: { fid }, update: { $set: { lastFailedAt: now, lastError: code } } },
        }))
      );
    }
  } catch (error) {
    console.error('Could not record per-subscriber push delivery:', error);
  }
}

const FCM_BATCH = 500;

export type PushSendResult = { subscribers: number; successCount: number; failureCount: number; removedCount: number };

/**
 * `logId` is a PushNotificationLog row created (status "sending") before calling this.
 * Batches of 500, and FIDs that FCM reports as gone are deleted, so one bad subscription never blocks the rest.
 */
export async function sendPushToAll(
  logId: unknown,
  notification: { title: string; body: string; url: string; tag: string; data?: Record<string, string> }
): Promise<PushSendResult> {
  let successCount = 0;
  let failureCount = 0;
  try {
    const fids = (await PushSubscription.find({}, { fid: 1, _id: 0 }).lean<{ fid: string }[]>()).map((s) => s.fid);
    const messaging = getAdminMessaging();
    const stale: string[] = [];

    for (const batch of chunk(fids, FCM_BATCH)) {
      const response = await messaging.sendEachForMulticast({
        fids: batch,
        webpush: {
          headers: { TTL: String(24 * 60 * 60), Urgency: 'high' },
          notification: {
            title: notification.title,
            body: notification.body,
            icon: `${PUSH_SITE_URL}/logo.png`,
            tag: notification.tag,
          },
          fcmOptions: { link: notification.url },
          data: { ...notification.data, url: notification.url, tag: notification.tag },
        },
      });
      successCount += response.successCount;
      failureCount += response.failureCount;
      const outcome = splitSendResults(batch, response.responses);
      stale.push(...outcome.stale);
      await recordDelivery(outcome.received, outcome.failed);
    }

    if (stale.length) await PushSubscription.deleteMany({ fid: { $in: stale } });

    const result = { subscribers: fids.length, successCount, failureCount, removedCount: stale.length };
    await PushNotificationLog.updateOne(
      { _id: logId },
      { $set: { status: 'sent', subscriberCount: result.subscribers, successCount, failureCount, removedCount: result.removedCount } }
    );
    return result;
  } catch (error) {
    // If some batches already went out, keep the row marked as sent so it is not re-sent without a warning.
    await PushNotificationLog.updateOne(
      { _id: logId },
      { $set: { status: successCount > 0 ? 'sent' : 'failed', successCount, failureCount } }
    ).catch(() => {});
    throw error;
  }
}
