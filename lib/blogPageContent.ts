import "server-only";

import {
  mergeBlogPage,
  type BlogPageContent,
} from "@/lib/blogPageContentTypes";
import { getPayloadInstance } from "@/lib/payload";

/**
 * Server-side reader for the blog listing page.
 *
 * Falls back to the shipped copy on any failure, so a missing table or an
 * unreachable database renders /blogs unchanged rather than blank.
 */

export * from "@/lib/blogPageContentTypes";

export async function getBlogPageContent(): Promise<BlogPageContent> {
  try {
    const payload = await getPayloadInstance();
    const doc = (await payload.findGlobal({
      slug: "blog-page",
      depth: 0,
      overrideAccess: true,
    })) as Record<string, unknown>;
    return mergeBlogPage(doc);
  } catch {
    // Same merge with nothing stored, so the shipped copy comes back whole.
    return mergeBlogPage(null);
  }
}
