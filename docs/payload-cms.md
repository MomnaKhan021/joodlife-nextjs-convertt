# Payload CMS Integration

Payload 3.x runs inside this Next.js App Router project as the admin UI
and headless API. The marketing pages (root `app/` routes) are untouched;
everything Payload-owned lives in the `(payload)` route group and
`src/payload/`.

## 1. Install

The `package.json` already lists the dependencies. After pulling, install
them (stop the dev server first on Windows so the file locks clear):

```bash
npm install
```

Required runtime packages:

- `payload` — core
- `@payloadcms/db-mongodb` — Mongo adapter
- `@payloadcms/next` — App Router integration (admin UI + API)
- `@payloadcms/richtext-lexical` — rich-text editor
- `@payloadcms/ui` — admin UI components
- `graphql` — GraphQL peer dep
- `sharp` — image processing for `Media`

## 2. Environment

Copy `.env.example` to `.env` and set:

```
DATABASE_URI=mongodb://127.0.0.1:27017/joodlife
PAYLOAD_SECRET=<openssl rand -base64 32>
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
SEED_ADMIN_EMAIL=admin@joodlife.com
SEED_ADMIN_PASSWORD=ChangeMe123!
```

For production swap `mongodb://…` for your Mongo Atlas / hosted URL.

## 3. Seed data

```bash
npm run seed
```

This creates:
- one admin user (email/password from `.env`)
- three medication products (Mounjaro, Wegovy, Saxenda)
- one discount code `WELCOME10` (10% off, 90-day expiry)

## 4. Run the admin

```bash
npm run dev
```

- Admin UI → http://localhost:3000/admin
- REST API → http://localhost:3000/api/{collection}
- GraphQL → http://localhost:3000/api/graphql
- GraphQL Playground → http://localhost:3000/api/graphql-playground
- Custom discount apply → `POST /api/discounts/apply` `{ code, subtotal }`
- Custom storefront order → `POST /api/storefront/orders`

## 5. File structure

```
/payload.config.ts               # root config
/next.config.ts                  # wrapped with withPayload
/app/
  /(payload)/                    # admin + API routes (not a URL segment)
    /layout.tsx                  # Payload admin root layout
    /custom.scss                 # admin style overrides (empty by default)
    /admin/
      /importMap.js              # component import map (generated)
      /[[...segments]]/
        /page.tsx                # Payload admin app
        /not-found.tsx
    /api/
      /[...slug]/route.ts        # REST handlers (GET/POST/PATCH/…)
      /graphql/route.ts
      /graphql-playground/route.ts
  /shop/                         # Example storefront pages
    /page.tsx
    /[slug]/page.tsx
  /api/
    /storefront/
      /orders/route.ts           # Custom order-create endpoint
/src/
  /payload/
    /collections/                # Users, Products, Orders, Discounts, Media
    /access/                     # isAdmin, isAdminOrSelf, isLoggedIn
    /hooks/                      # reduceStock, validateDiscount
    /endpoints/                  # applyDiscount
    /seed.ts                     # `npm run seed`
/lib/
  /payload.ts                    # getPayloadInstance() + payloadFetch()
/public/
  /payload-media/                # Upload target (git-ignored)
```

## 6. Access model

| Collection  | Read                | Create         | Update         | Delete |
| ----------- | ------------------- | -------------- | -------------- | ------ |
| `users`     | admin or self       | public         | admin or self  | admin  |
| `products`  | public              | admin          | admin          | admin  |
| `orders`    | admin or own rows   | logged-in user | admin          | admin  |
| `discounts` | logged-in           | admin          | admin          | admin  |
| `media`     | public              | admin          | admin          | admin  |

The `role` field on `users` is itself protected: only admins can change it.

## 7. Hooks

- **`reduceStockAfterOrder`** ([src/payload/hooks/reduceStock.ts](../src/payload/hooks/reduceStock.ts)) —
  `afterChange` on `orders`. Decrements `products.stock` whenever a new
  order is created OR an existing order transitions to `paid`.
- **`normalizeDiscount`** + **`evaluateDiscount`**
  ([src/payload/hooks/validateDiscount.ts](../src/payload/hooks/validateDiscount.ts)) —
  `beforeValidate` on `discounts` normalises the code/value; the shared
  `evaluateDiscount()` function is used by both the custom endpoint and
  the storefront order route.

## 8. Custom endpoints

### `POST /api/discounts/apply`

Validate a coupon without exposing the `discounts` collection publicly.

```ts
const res = await fetch("/api/discounts/apply", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ code: "WELCOME10", subtotal: 199 }),
}).then((r) => r.json());
// => { valid: true, amount: 19.9, total: 179.1, code: "WELCOME10", subtotal: 199 }
```

### `POST /api/storefront/orders`

Creates an order for the authenticated user; server-recomputes subtotal
and discount so the client can't forge prices.

```ts
const res = await fetch("/api/storefront/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    items: [{ productId: "PROD_ID", quantity: 2 }],
    discountCode: "WELCOME10",
    paymentMethod: "card",
  }),
}).then((r) => r.json());
```

## 9. Fetching from Server Components

```ts
// app/shop/page.tsx
import { getPayloadInstance } from "@/lib/payload";

export default async function Shop() {
  const payload = await getPayloadInstance();
  const { docs } = await payload.find({
    collection: "products",
    where: { isActive: { equals: true } },
    limit: 24,
    depth: 2,
  });
  return <pre>{JSON.stringify(docs, null, 2)}</pre>;
}
```

`getPayloadInstance()` calls the Local API in-process (no HTTP round-trip).
For client-side use, hit the REST endpoints at `/api/{collection}`.

## 10. Generating types

Run after any collection change:

```bash
npm run generate:types
```

Output lands at `src/payload/payload-types.ts` (git-ignored) — import
from there for strongly-typed queries.

## 11. Next.js 16 note

This repo runs Next.js 16. Payload 3.x officially supports Next.js 14/15
at the time of writing. The integration is mostly drop-in, but if you
hit issues, pin `next` to the latest `15.x` release or check the Payload
release notes for 16 compatibility.

## 12. Production checklist

- [ ] Set `DATABASE_URI` to a managed Mongo (Atlas/Railway/etc.)
- [ ] Rotate `PAYLOAD_SECRET` to a long random string
- [ ] Tighten `users` `create: () => true` (add captcha / email verify)
- [ ] Swap the local `Media` upload dir for S3 / Vercel Blob
- [ ] Add payment provider webhook → set `orders.status` to `paid`
- [ ] Add rate limiting on `/api/discounts/apply` + `/api/storefront/orders`
