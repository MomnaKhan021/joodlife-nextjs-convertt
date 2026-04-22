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
    // Writes uploaded files to /public/payload-media so Next.js can serve them
    staticDir: path.resolve(dirname, "../../../public/payload-media"),
    mimeTypes: ["image/*"],
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
