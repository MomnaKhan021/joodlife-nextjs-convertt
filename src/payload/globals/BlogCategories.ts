import type { GlobalConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isPublic } from "../access/isLoggedIn";

/**
 * The blog category list, editable in /cms/blog-categories.
 *
 * Held as json rather than as a collection because it is a short, ordered
 * list read on every /blogs render — a row per category would mean a join
 * and an ordering column for no benefit.
 *
 * An empty global falls back to the categories in lib/postCategories, so the
 * filter tabs on /blogs are never blank.
 */
export const BlogCategories: GlobalConfig = {
  slug: "blog-categories",
  admin: {
    group: "Content",
    description: "Blog categories — edit in /cms/blog-categories.",
  },
  access: { read: isPublic, update: isAdmin },
  fields: [
    {
      name: "items",
      type: "json",
      admin: {
        description:
          "Array of { value, label }. Values are permanent — posts are filed under them.",
      },
    },
  ],
};

export default BlogCategories;
