import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

import { Users } from "./src/payload/collections/Users";
import { Products } from "./src/payload/collections/Products";
import { Orders } from "./src/payload/collections/Orders";
import { Discounts } from "./src/payload/collections/Discounts";
import { Media } from "./src/payload/collections/Media";
import { applyDiscountEndpoint } from "./src/payload/endpoints/applyDiscount";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * Resolve the Postgres connection string from a list of likely env
 * vars. Vercel's Neon integration auto-creates a pile of these (often
 * with a custom prefix like `Jood_database_*`), and we don't want to
 * force users to manually create a `DATABASE_URI` mirror.
 *
 * Order of preference: the canonical Payload var, then unpooled /
 * non-pooling variants (Drizzle prefers a direct connection because
 * PgBouncer breaks prepared statements), then any pooled fallback.
 */
function resolveDatabaseUrl(): string {
  const candidates = Object.keys(process.env).filter((k) => process.env[k]);

  const preferredOrder = [
    "DATABASE_URI",
    // Standard names
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
    "DATABASE_URL",
    "POSTGRES_URL",
  ];

  // Match exact preferred names first
  for (const name of preferredOrder) {
    if (process.env[name]) return process.env[name] as string;
  }

  // Fallback: any var ending in one of the preferred suffixes
  // (catches integration-prefixed names like `Jood_database_DATABASE_URL_UNPOOLED`)
  const suffixOrder = [
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
    "DATABASE_URL",
    "POSTGRES_URL",
  ];
  for (const suffix of suffixOrder) {
    const match = candidates.find((k) => k.endsWith(suffix));
    if (match) return process.env[match] as string;
  }

  return "";
}

const DATABASE_URL = resolveDatabaseUrl();

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
  db: postgresAdapter({
    pool: {
      connectionString: DATABASE_URL,
    },
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
