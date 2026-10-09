/** Largest image the CMS accepts. Uploads go browser → Vercel Blob directly,
 *  so this is our own cap, not Vercel's 4.5 MB function body limit. */
export const CMS_IMAGE_MAX_BYTES = 25 * 1024 * 1024;
