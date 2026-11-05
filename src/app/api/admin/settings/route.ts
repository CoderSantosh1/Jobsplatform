import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdmin } from "@/lib/admin-guard";
import { connectToDatabase } from "@/lib/db";
import { SITE_NAME, SITE_URL, TITLE_MAX } from "@/lib/seo";
import { missingPushPublicEnv } from "@/lib/push-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Which settings are present. Only yes/no is returned, never a value.
const ENV: { name: string; group: string; use: string; required: boolean }[] = [
  { name: "MONGODB_URI", group: "Database", use: "All content, tests and accounts", required: true },
  { name: "JWT_SECRET", group: "Admin login", use: "Signs admin sessions", required: true },
  { name: "ADMIN_EMAIL", group: "Admin login", use: "Admin login email", required: true },
  { name: "ADMIN_PASSWORD", group: "Admin login", use: "Admin login password", required: true },
  { name: "CLOUDINARY_CLOUD_NAME", group: "Uploads", use: "Image/PDF uploads", required: false },
  { name: "CLOUDINARY_API_KEY", group: "Uploads", use: "Image/PDF uploads", required: false },
  { name: "CLOUDINARY_API_SECRET", group: "Uploads", use: "Image/PDF uploads", required: false },
  { name: "FIREBASE_PROJECT_ID", group: "Firebase (server)", use: "Push sending, sign-in checks", required: false },
  { name: "FIREBASE_CLIENT_EMAIL", group: "Firebase (server)", use: "Push sending", required: false },
  { name: "FIREBASE_PRIVATE_KEY", group: "Firebase (server)", use: "Push sending", required: false },
  { name: "NEXT_PUBLIC_FIREBASE_API_KEY", group: "Firebase (browser)", use: "Google/email sign-in, push", required: false },
  { name: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", group: "Firebase (browser)", use: "Google/email sign-in, push", required: false },
  { name: "NEXT_PUBLIC_FIREBASE_APP_ID", group: "Firebase (browser)", use: "Google/email sign-in, push", required: false },
  { name: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", group: "Firebase (browser)", use: "Push", required: false },
  { name: "NEXT_PUBLIC_FIREBASE_VAPID_KEY", group: "Firebase (browser)", use: "Push", required: false },
  { name: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", group: "Firebase (browser)", use: "Sign-in popup domain", required: false },
];

const COLLECTIONS = ["jobs", "results", "admitcards", "answerkeys", "admissions", "news", "quizzes", "questions", "quizattempts", "authusers", "pushsubscriptions", "pushnotificationlogs", "seoreviews"];

/** Site configuration status for the admin panel: settings present (yes/no only), database and deployment. Read-only. */
export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const env = ENV.map((e) => ({ ...e, set: Boolean(process.env[e.name]?.trim()) }));
  const deployment = {
    host: process.env.VERCEL ? "Vercel" : process.env.NETLIFY ? "Netlify" : "Other / local",
    environment: process.env.VERCEL_ENV ?? process.env.CONTEXT ?? process.env.NODE_ENV ?? "",
    commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.COMMIT_REF ?? "").slice(0, 7) || null,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? process.env.BRANCH ?? null,
    region: process.env.VERCEL_REGION ?? null,
    node: process.version,
  };

  let database: { ok: boolean; ms: number | null; name: string | null; collections: { name: string; count: number | null }[]; error?: string };
  const started = Date.now();
  try {
    await connectToDatabase();
    const db = mongoose.connection.db!;
    await db.command({ ping: 1 });
    const ms = Date.now() - started;
    const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name));
    const collections = await Promise.all(
      COLLECTIONS.filter((n) => existing.has(n)).map(async (name) => ({ name, count: await db.collection(name).estimatedDocumentCount().catch(() => null) })),
    );
    database = { ok: true, ms, name: db.databaseName, collections };
  } catch (error) {
    console.error("admin settings: database check failed", error);
    database = { ok: false, ms: null, name: null, collections: [], error: "Could not reach the database." };
  }

  return NextResponse.json({
    success: true,
    data: {
      site: { name: SITE_NAME, url: SITE_URL, titleMax: TITLE_MAX },
      env,
      pushPublicMissing: missingPushPublicEnv(),
      deployment,
      database,
    },
  });
}
