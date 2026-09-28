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
 * They shipped switched off and stayed off while the rest of the CMS was
 * watched on the live site. They are now on by default, because the articles
 * are meant to be edited from here. The switch stays as a way back:
 *
 *   CMS_BLOG_ENABLED=false  → blog editors, the starter import, and the
 *                             free-text category field are all hidden again
 *   unset / anything else   → they are available
 *
 * Turning it back off hides the editors; it does not undo the one schema
 * change the switch covers (`posts.category` from a fixed list to free
 * text). That change only widens the column - every stored value survives it
 * - so the old select field reads the same rows it always did.
 *
 * One switch covers the UI, the API route, the Payload field type and the
 * schema change, because half-applying those is how a column ends up out of
 * step with the code that writes it.
 */
export function blogCmsEnabled(): boolean {
  return process.env.CMS_BLOG_ENABLED !== "false";
}
