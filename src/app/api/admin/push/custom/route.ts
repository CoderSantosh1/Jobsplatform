import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { verifyAdminAuthorization } from '@/lib/admin-auth';
import {
  firebaseAdminEnvProblems,
  isFirebaseAdminConfigured,
  missingFirebaseAdminEnv,
  pushErrorDetail,
} from '@/lib/firebase-admin';
import { sendPushToAll } from '@/lib/push-send';
import { parseCustomPushInput } from '@/lib/push';
import PushSubscription from '@/lib/models/PushSubscription';
import PushNotificationLog from '@/lib/models/PushNotificationLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Subscriber count, server configuration and the most recent notifications (custom and per-item). */
export async function GET(request: Request) {
  const auth = verifyAdminAuthorization(request.headers.get('authorization'));
  if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    await connectToDatabase();
    const [subscribers, history] = await Promise.all([
      PushSubscription.estimatedDocumentCount(),
      PushNotificationLog.find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .select('contentType title body url status sentBy successCount failureCount removedCount subscriberCount createdAt')
        .lean(),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        subscribers,
        configured: isFirebaseAdminConfigured(),
        missingEnv: missingFirebaseAdminEnv(),
        envProblems: firebaseAdminEnvProblems(),
        history,
      },
    });
  } catch (error) {
    console.error('Error loading push notifications:', error);
    return NextResponse.json({ success: false, error: 'Failed to load notifications' }, { status: 500 });
  }
}

/** Sends a message the admin wrote, whenever they choose. Admin only. */
export async function POST(request: Request) {
  const auth = verifyAdminAuthorization(request.headers.get('authorization'));
  if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  const parsed = parseCustomPushInput(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });

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
    const log = await PushNotificationLog.create({
      contentType: 'custom',
      contentId: '-',
      ...parsed.value,
      sentBy: auth.email,
    });
    // Unique tag per message, so two different announcements never replace each other on a device.
    const data = await sendPushToAll(log._id, { ...parsed.value, tag: `custom-${log._id}`, data: { type: 'custom' } });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error sending custom push notification:', error);
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
