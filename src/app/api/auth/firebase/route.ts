import { NextResponse } from "next/server";
import { upsertAuthUser, verifyFirebaseRequest } from "@/lib/firebase-auth-server";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

const allow = createRateLimiter({ limit: 30, windowMs: 60_000 });

/** Creates or updates the profile of the user a verified Firebase ID token belongs to. */
export async function POST(request: Request) {
  if (!allow(clientIp(request.headers))) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute and try again." }, { status: 429 });
  }
  try {
    const decoded = await verifyFirebaseRequest(request.headers.get("authorization"));
    if (!decoded) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

    const body = await request.json().catch(() => null);
    const user = await upsertAuthUser(decoded, (body as { name?: unknown } | null)?.name);
    return NextResponse.json({
      user: {
        _id: String(user._id),
        name: user.name,
        email: user.email,
        firebaseUid: user.firebaseUid,
        emailVerified: !!user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Firebase login error:", error);
    return NextResponse.json({ error: "Could not finish signing in. Please try again." }, { status: 500 });
  }
}
