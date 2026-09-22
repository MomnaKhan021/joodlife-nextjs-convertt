/**
 * Feature switch for the blog half of the CMS.
 *
 * Everything else in /cms writes to tables that only the CMS reads: empty
 * means "render the design as shipped", so the worst a mistake can do is
 * change how a page looks. The blog editors are the exception — they read and
 * WRITE the `posts` table, which already holds the live articles. Publishing,
 * unpublishing or editing there changes real content, and importing the
 * starter articles adds rows.
 *
 * So the blog editors ship switched OFF and are turned on deliberately, once
 * the rest has been watched on the live site for a while. Unset means off:
 * a deploy that forgets the variable is the safe one, not the risky one.
 *
 *   CMS_BLOG_ENABLED=true   → blog editors, the starter import, and the
 *                             free-text category field are all available
 *   unset / anything else   → they are not, and `posts` keeps exactly the
 *                             shape and behaviour it has today
 *
 * One switch covers the UI, the API route, the Payload field type and the
 * schema change, because half-applying those is how a column ends up out of
 * step with the code that writes it.
 */
export function blogCmsEnabled(): boolean {
  return process.env.CMS_BLOG_ENABLED === "true";
}
