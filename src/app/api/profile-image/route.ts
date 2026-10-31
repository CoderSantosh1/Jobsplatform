// @ts-ignore: Could not find module 'cloudinary' types
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import mongoose from "mongoose";
import AuthUser from "@/lib/models/AuthUser";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { isObjectIdString, PROFILE_IMAGE_MAX_BYTES, sniffImageType } from "@/lib/upload-rules";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Public endpoint (students have no password yet), so it is rate limited and only accepts real images.
const allow = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

const fail = (error: string, status: number) => NextResponse.json({ success: false, error }, { status });

/**
 * Uploads a student's profile photo to Cloudinary (one image per user, replaced on re-upload). Previously files were
 * written to public/uploads with a name built from the request (path traversal, any file type served from our
 * domain, no size limit) — and Vercel's filesystem is read-only, so that never worked in production anyway.
 */
export async function POST(request: Request) {
  if (!allow(clientIp(request.headers))) return fail("Too many uploads. Please try again later.", 429);
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return fail("Image upload is not configured", 503);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const userId = formData.get("userId");
    if (!(file instanceof File) || !isObjectIdString(userId)) return fail("Missing file or invalid user", 400);
    if (file.size > PROFILE_IMAGE_MAX_BYTES) return fail("Image must be 2 MB or smaller", 413);

    const buffer = Buffer.from(await file.arrayBuffer());
    const kind = sniffImageType(buffer);
    if (!kind) return fail("Only JPG, PNG or WebP images are allowed", 415);

    await connectToDatabase();
    const user = await mongoose.connection.db
      ?.collection("users")
      .findOne({ _id: new mongoose.Types.ObjectId(userId) }, { projection: { _id: 1 } });
    const authUser = user ? null : await AuthUser.exists({ _id: userId });
    if (!user && !authUser) return fail("Unknown user", 404);

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "profile-images",
            public_id: userId,
            overwrite: true,
            resource_type: "image",
            allowed_formats: ["jpg", "png", "webp"],
            transformation: [{ width: 256, height: 256, crop: "fill", gravity: "face" }],
          },
          (error: Error | undefined, res: UploadApiResponse | undefined) => (error || !res ? reject(error) : resolve(res)),
        )
        .end(buffer);
    });

    return NextResponse.json({ success: true, imageUrl: result.secure_url });
  } catch (error) {
    console.error("Profile image upload error:", error);
    return fail("Failed to upload image", 500);
  }
}
