import path from "path";
import { fileURLToPath } from "url";
import type { CollectionConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isPublic } from "../access/isLoggedIn";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    group: "Content",
  },
  access: {
    read: isPublic, // product images are public
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  upload: {
    // Writes uploaded files to /public/payload-media so Next.js can serve them.
    // On Vercel this filesystem is read-only — connect Vercel Blob and set
    // BLOB_READ_WRITE_TOKEN + JOOD_BLOB_ENABLED=true for persistent uploads.
    staticDir: path.resolve(dirname, "../../../public/payload-media"),
    // Accept both images and video. Videos skip the imageSizes pipeline.
    mimeTypes: ["image/*", "video/mp4", "video/webm", "video/quicktime"],
    imageSizes: [
      { name: "thumb", width: 320, height: 320, position: "centre" },
      { name: "card", width: 640, height: 640, position: "centre" },
      { name: "feature", width: 1200 },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
    {
      name: "caption",
      type: "text",
    },
  ],
};

export default Media;
