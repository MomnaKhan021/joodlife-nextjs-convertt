import type { GlobalConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isPublic } from "../access/isLoggedIn";

/**
 * The blog listing page at /blogs — its furniture, not its articles.
 *
 * One json field per section, in page order: the photo hero, the heading
 * above the post grid, the newsletter block and the closing banner. The
 * posts themselves are the Posts collection, edited in /cms/blogs.
 *
 * Anything missing falls back to lib/blogPageContentTypes.ts, so an empty
 * global renders the page exactly as it ships.
 */
export const BlogPage: GlobalConfig = {
  slug: "blog-page",
  admin: {
    group: "Content",
    description: "The /blogs listing page — hero, newsletter and banner.",
  },
  access: { read: isPublic, update: isAdmin },
  fields: [
    {
      name: "hero",
      type: "json",
      admin: { description: "The photo hero at the top of the listing." },
    },
    {
      name: "list",
      type: "json",
      admin: { description: "The heading and intro above the post grid." },
    },
    {
      name: "newsletter",
      type: "json",
      admin: { description: "The subscribe block." },
    },
    {
      name: "cta",
      type: "json",
      admin: { description: "The closing banner above the footer." },
    },
  ],
};

export default BlogPage;
