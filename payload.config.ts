import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

import { Users } from "./src/payload/collections/Users";
import { Products } from "./src/payload/collections/Products";
import { Orders } from "./src/payload/collections/Orders";
import { Discounts } from "./src/payload/collections/Discounts";
import { Media } from "./src/payload/collections/Media";
import { applyDiscountEndpoint } from "./src/payload/endpoints/applyDiscount";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: " · JoodLife CMS",
    },
    // /admin is the default route for Payload 3.x with the Next.js plugin.
  },
  editor: lexicalEditor(),
  collections: [Users, Products, Orders, Discounts, Media],
  endpoints: [applyDiscountEndpoint],
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "src/payload/payload-types.ts"),
  },
  graphQL: {
    schemaOutputFile: path.resolve(dirname, "src/payload/schema.graphql"),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || "",
  }),
  cors: [
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
  ].filter(Boolean),
  csrf: [
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
  ].filter(Boolean),
  upload: {
    limits: {
      fileSize: 10_000_000, // 10 MB
    },
  },
});
