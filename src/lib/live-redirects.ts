// Loads the post redirects approved in the admin Redirect Manager. Read once per request (React cache), so a new
// approval applies on the next page build; the approval API also revalidates the affected pages straight away.
import { cache } from "react";
import { connectToDatabase } from "@/lib/db";
import SeoReview from "@/lib/models/SeoReview";
import { buildPostRedirectMap, dropRedirectedPosts, postRedirectFor, type PostRedirectMap } from "@/lib/post-redirects";
import type { Section } from "@/lib/slug";

export const getPostRedirects = cache(async (): Promise<PostRedirectMap> => {
  try {
    await connectToDatabase();
    const rows = (await SeoReview.find({ kind: "redirect", decision: "approved" }).select("path target").lean()) as unknown as {
      path: string;
      target: string;
    }[];
    return buildPostRedirectMap(rows);
  } catch (error) {
    // Never break a page because the redirect list could not be read.
    console.error("getPostRedirects failed", error);
    return new Map();
  }
});

/** Approved redirect target for a post URL param, or null. */
export async function postRedirectTarget(section: Section, param: string): Promise<string | null> {
  return postRedirectFor(await getPostRedirects(), section, param);
}

/** Drop rows whose post has an approved redirect. */
export async function withoutRedirectedPosts<T extends { _id: unknown }>(section: Section, rows: T[]): Promise<T[]> {
  return dropRedirectedPosts(await getPostRedirects(), section, rows);
}
