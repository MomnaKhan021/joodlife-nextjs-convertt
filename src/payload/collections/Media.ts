import type { CollectionConfig } from "payload";

import { isAdmin } from "../access/isAdmin";
import { isPublic } from "../access/isLoggedIn";

/**
 * Media collection.
 *
 * Originally configured with Payload's `upload: {}` block, which sent
 * file POSTs to /api/media → disk write → fails on Vercel's read-only
 * function filesystem ("Something went wrong" toast).
 *
 * Now a regular collection with explicit fields. Admins upload via the
 * custom <BlobUploadField> component (file picker → POST to
 * /api/blob-upload → returns a public Vercel Blob URL → fills the URL
 * field on this form), then click Save. Save just runs an INSERT —
 * no upload pipeline, no disk writes, no Vercel filesystem issues.
 *
 * The url + filename + mimeType + filesize columns mirror what
 * Payload's upload adapter would have written, so the rest of the
 * codebase (lib/products.ts, products_images join) keeps working
 * untouched.
 */
export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    useAsTitle: "alt",
    defaultColumns: ["alt", "url", "mimeType", "filesize", "createdAt"],
    group: "Content",
  },
  access: {
    read: isPublic,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: { description: "Short description used as the image alt text." },
    },
    {
      name: "caption",
      type: "text",
      admin: { description: "Optional caption shown under the image." },
    },
    {
      name: "uploader",
      type: "ui",
      admin: {
        components: {
          Field:
            "@/components/admin/BlobUploadField#BlobUploadField",
        },
      },
    },
    {
      name: "url",
      type: "text",
      required: true,
      admin: {
        description:
          "Public URL where the file lives. Filled automatically when you pick a file above; can also be pasted manually (e.g. a Blob / CDN URL).",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "filename",
          type: "text",
          admin: { width: "50%" },
        },
        {
          name: "mimeType",
          type: "text",
          admin: { width: "50%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "filesize",
          type: "number",
          admin: { width: "50%", description: "Bytes." },
        },
        {
          name: "width",
          type: "number",
          admin: { width: "25%" },
        },
        {
          name: "height",
          type: "number",
          admin: { width: "25%" },
        },
      ],
    },
  ],
};

export default Media;
