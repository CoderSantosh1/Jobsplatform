import { NextResponse } from 'next/server';
import type { Model } from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { verifyAdminAuthorization } from '@/lib/admin-auth';
import { getAdminMessaging, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { PUBLIC_FILTER } from '@/lib/content';
import Job from '@/lib/models/Job';
import Result from '@/lib/models/Result';
import AdmitCard from '@/lib/models/AdmitCard';
import AnswerKey from '@/lib/models/AnswerKey';
import Admission from '@/lib/models/Admission';
import News from '@/lib/models/News';
import Quiz from '@/lib/models/Quiz';
import PushSubscription from '@/lib/models/PushSubscription';
import PushNotificationLog from '@/lib/models/PushNotificationLog';
import {
  chunk,
  defaultPushMessage,
  isStaleSubscriptionError,
  parsePushSendInput,
  PUSH_SITE_URL,
  pushContentPath,
  pushDestinationUrl,
  type PushContentType,
} from '@/lib/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/* eslint-disable @typescript-eslint/no-explicit-any */
const MODELS: Record<PushContentType, Model<any>> = {
  jobs: Job,
  results: Result,
  'admit-cards': AdmitCard,
  'answer-keys': AnswerKey,
  admissions: Admission,
  news: News,
  quizzes: Quiz,
};

const PUBLIC: Record<PushContentType, Record<string, unknown>> = {
  ...PUBLIC_FILTER,
  quizzes: { status: 'published' },
};

const FCM_BATCH = 500;

/** Loads a published item and builds its notification. The destination URL is always derived server-side. */
async function loadNotification(type: PushContentType, id: string, overrides: { title?: string; body?: string }) {
  const doc = await MODELS[type].findOne({ _id: id, ...PUBLIC[type] }).select('title').lean<{ _id: unknown; title?: string }>();
  if (!doc) return null;
  const url = pushDestinationUrl(pushContentPath(type, doc));
  if (!url) return null;
  const defaults = defaultPushMessage(type, doc.title ?? '');
  return { title: overrides.title ?? defaults.title, body: overrides.body ?? defaults.body, url };
}

function lastSentFor(type: PushContentType, id: string) {
  return PushNotificationLog.findOne({ contentType: type, contentId: id, status: { $ne: 'failed' } })
    .sort({ createdAt: -1 })
    .select('createdAt status')
    .lean<{ createdAt: Date; status: string }>();
}

/** Preview: default title/body, destination, subscriber count and when this item was last sent. */
export async function GET(request: Request) {
  const auth = verifyAdminAuthorization(request.headers.get('authorization'));
  if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const parsed = parsePushSendInput({ type: params.get('type'), id: params.get('id') });
  if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  const { type, id } = parsed.value;

  try {
    await connectToDatabase();
    const notification = await loadNotification(type, id, {});
    if (!notification) {
      return NextResponse.json({ success: false, error: 'Only published items can be sent' }, { status: 404 });
    }
    const [subscribers, last] = await Promise.all([PushSubscription.estimatedDocumentCount(), lastSentFor(type, id)]);
    return NextResponse.json({
      success: true,
      data: {
        ...notification,
        subscribers,
        lastSentAt: last?.createdAt ?? null,
        configured: isFirebaseAdminConfigured(),
      },
    });
  } catch (error) {
    console.error('Error preparing push preview:', error);
    return NextResponse.json({ success: false, error: 'Failed to prepare preview' }, { status: 500 });
  }
}

/** Sends a notification for one published item to every subscriber. Admin only; never triggered by content edits. */
export async function POST(request: Request) {
  const auth = verifyAdminAuthorization(request.headers.get('authorization'));
  if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  const parsed = parsePushSendInput(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  const { type, id, resend } = parsed.value;

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ success: false, error: 'Push notifications are not configured on the server' }, { status: 503 });
  }

  let logId: unknown;
  let successCount = 0;
  let failureCount = 0;
  try {
    await connectToDatabase();
    const notification = await loadNotification(type, id, parsed.value);
    if (!notification) {
      return NextResponse.json({ success: false, error: 'Only published items can be sent' }, { status: 404 });
    }

    const last = await lastSentFor(type, id);
    if (last && !resend) {
      return NextResponse.json(
        { success: false, error: 'A notification was already sent for this item', lastSentAt: last.createdAt },
        { status: 409 }
      );
    }

    // Written before sending so a double-click sees it and gets the "already sent" response.
    const log = await PushNotificationLog.create({
      contentType: type,
      contentId: id,
      ...notification,
      sentBy: auth.email,
    });
    logId = log._id;

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
            tag: `${type}-${id}`,
          },
          fcmOptions: { link: notification.url },
          data: { url: notification.url, type, id },
        },
      });
      successCount += response.successCount;
      failureCount += response.failureCount;
      response.responses.forEach((r, i) => {
        if (!r.success && isStaleSubscriptionError(r.error?.code)) stale.push(batch[i]);
      });
    }

    if (stale.length) await PushSubscription.deleteMany({ fid: { $in: stale } });

    await PushNotificationLog.updateOne(
      { _id: logId },
      {
        $set: {
          status: 'sent',
          subscriberCount: fids.length,
          successCount,
          failureCount,
          removedCount: stale.length,
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: { subscribers: fids.length, successCount, failureCount, removedCount: stale.length },
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    // If some batches already went out, keep the item marked as sent so it is not re-sent without a warning.
    if (logId) {
      await PushNotificationLog.updateOne(
        { _id: logId },
        { $set: { status: successCount > 0 ? 'sent' : 'failed', successCount, failureCount } }
      ).catch(() => {});
    }
    return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 });
  }
}
