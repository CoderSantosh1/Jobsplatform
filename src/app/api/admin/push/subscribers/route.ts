import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import PushSubscription from '@/lib/models/PushSubscription';
import { maskFid } from '@/lib/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

type Row = {
  _id: unknown;
  fid: string;
  createdAt?: Date;
  lastSeenAt?: Date;
  receivedCount?: number;
  lastReceivedAt?: Date;
  lastFailedAt?: Date;
  lastError?: string;
};

/** Subscribed browsers, newest first, with whether the last notification reached them. Admin only. */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const page = Math.max(1, Math.floor(Number(new URL(request.url).searchParams.get('page')) || 1));

  try {
    await connectToDatabase();
    const [total, rows] = await Promise.all([
      PushSubscription.countDocuments(),
      PushSubscription.find({})
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .select('fid createdAt lastSeenAt receivedCount lastReceivedAt lastFailedAt lastError')
        .lean<Row[]>(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total,
        page,
        pageSize: PAGE_SIZE,
        items: rows.map((r) => ({
          id: String(r._id),
          browser: maskFid(r.fid),
          subscribedAt: r.createdAt ?? null,
          lastSeenAt: r.lastSeenAt ?? null,
          receivedCount: r.receivedCount ?? 0,
          lastReceivedAt: r.lastReceivedAt ?? null,
          lastFailedAt: r.lastFailedAt ?? null,
          lastError: r.lastError ?? null,
        })),
      },
    });
  } catch (error) {
    console.error('Error loading push subscribers:', error);
    return NextResponse.json({ success: false, error: 'Failed to load subscribers' }, { status: 500 });
  }
}
