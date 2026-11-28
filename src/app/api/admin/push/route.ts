import { NextResponse } from 'next/server';
import type { Model } from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { verifyAdminAuthorization } from '@/lib/admin-auth';
import {
  firebaseAdminEnvProblems,
  isFirebaseAdminConfigured,
  missingFirebaseAdminEnv,
  pushErrorDetail,
} from '@/lib/firebase-admin';
import { sendPushToAll } from '@/lib/push-send';
import { PUBLIC_FILTER } from '@/lib/content';
import Job from '@/lib/models/Job';
import Result from '@/lib/models/Result';
import AdmitCard from '@/lib/models/AdmitCard';
import AnswerKey from '@/lib/models/AnswerKey';
import Admission from '@/lib/models/Admission';
import Quiz from '@/lib/models/Quiz';
import PushSubscription from '@/lib/models/PushSubscription';
import PushNotificationLog from '@/lib/models/PushNotificationLog';
import {
  defaultPushMessage,
  parsePushSendInput,
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
  quizzes: Quiz,
};

const PUBLIC: Record<PushContentType, Record<string, unknown>> = {
  ...PUBLIC_FILTER,
  quizzes: { status: 'published' },
};

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
        missingEnv: missingFirebaseAdminEnv(),
        envProblems: firebaseAdminEnvProblems(),
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
    const envProblems = firebaseAdminEnvProblems();
    return NextResponse.json(
      {
        success: false,
        error: `Firebase is not configured on the server: ${envProblems.join('; ')}`,
        missingEnv: missingFirebaseAdminEnv(),
        envProblems,
      },
      { status: 503 }
    );
  }

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

    const data = await sendPushToAll(log._id, { ...notification, tag: `${type}-${id}`, data: { type, id } });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send notification',
        detail: pushErrorDetail(error),
        envProblems: firebaseAdminEnvProblems(),
      },
      { status: 500 }
    );
  }
}
