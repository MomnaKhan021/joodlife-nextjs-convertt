/**
 * Checkout API — hardened.
 *
 *   POST /api/checkout
 *     - Zod-validates the body shape
 *     - Verifies Origin header matches our own host (basic CSRF gate)
 *     - Rate limits per IP (sliding 60-second window)
 *     - Re-prices every line item from the DB — client-supplied
 *       prices are ignored, never trusted
 *     - Optional auth gate via JOOD_REQUIRE_AUTH_FOR_CHECKOUT=1 env
 *     - Idempotency-Key header support (returns same order on retry)
 *     - Auto-attaches user_id when a logged-in customer checks out
 *     - Inserts via raw SQL through Drizzle into orders.items_json
 *
 *   GET /api/checkout?orderNumber=JL-XXXXX
 *     Public summary used by the success page.
 */
import { NextResponse, after, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { z } from "zod";

import { getPayloadInstance } from "@/lib/payload";
import { addNoteToContact, createDeal, fireHubSpot, mapOrderStageId, upsertContact } from "@/lib/hubspot";
import { sendOrderConfirmationEmail } from "@/lib/account-email";
import { nextOrderNumber } from "@/lib/orderNumber";
import {
  sanitizeText,
  sanitizeMultiline,
  sanitizeEmail,
  sanitizePhone,
} from "@/lib/sanitize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

const CartItemSchema = z.object({
  productId: z.number().int().positive(),
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  dose: z.string().max(80).nullable().optional(),
  // We accept the client price for display continuity but recompute
  // it server-side before saving. Never trusted.
  price: z.number().nonnegative().optional(),
  quantity: z.number().int().min(1).max(99),
  imageUrl: z.string().max(2000).nullable().optional(),
});

const CheckoutSchema = z.object({
  items: z.array(CartItemSchema).min(1).max(50),
  customer: z.object({
    name: z.string().min(1).max(120),
    email: z.string().email().max(200),
    phone: z.string().max(40).optional().default(""),
    address: z.string().min(5).max(2000),
    notes: z.string().max(2000).optional().default(""),
  }),
  // Optional discount code — validated + applied server-side below.
  discountCode: z.string().max(40).optional(),
});

type ValidatedItem = z.infer<typeof CartItemSchema>;

/* ------------------------------------------------------------------ */
/* Origin (CSRF) check                                                 */
/* ------------------------------------------------------------------ */

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");
  if (!host) return false;
  // Same-origin POSTs come with origin === host. Allow same-host
  // referer too (some browsers omit Origin on same-origin GETs but
  // POSTs always include it on modern browsers).
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Rate limit (sliding 60s window, in-memory)                          */
/* ------------------------------------------------------------------ */

const RATE_BUCKETS = new Map<string, number[]>();
const RATE_LIMIT_MAX = 8; // 8 checkouts/min/IP — generous for a real flow, blocks bots
const RATE_LIMIT_WINDOW_MS = 60_000;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const arr = RATE_BUCKETS.get(ip) ?? [];
  const recent = arr.filter((t) => t > cutoff);
  if (recent.length >= RATE_LIMIT_MAX) {
    RATE_BUCKETS.set(ip, recent);
    return false;
  }
  recent.push(now);
  RATE_BUCKETS.set(ip, recent);
  return true;
}

function clientIp(req: NextRequest): string {
  // Vercel sets x-forwarded-for; first entry is the real client.
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/* ------------------------------------------------------------------ */
/* Idempotency (in-memory, 10 min TTL)                                 */
/* ------------------------------------------------------------------ */

type IdempotencyEntry = { ts: number; orderNumber: string; orderId: number; total: number };
const IDEMPOTENT_KEYS = new Map<string, IdempotencyEntry>();
const IDEMPOTENCY_TTL_MS = 10 * 60_000;

function idempotencyLookup(key: string): IdempotencyEntry | null {
  const cutoff = Date.now() - IDEMPOTENCY_TTL_MS;
  const hit = IDEMPOTENT_KEYS.get(key);
  if (!hit || hit.ts < cutoff) {
    if (hit) IDEMPOTENT_KEYS.delete(key);
    return null;
  }
  return hit;
}

function idempotencyStore(key: string, entry: Omit<IdempotencyEntry, "ts">) {
  IDEMPOTENT_KEYS.set(key, { ...entry, ts: Date.now() });
  // Opportunistic GC — every 100 inserts, sweep stale entries.
  if (IDEMPOTENT_KEYS.size % 100 === 0) {
    const cutoff = Date.now() - IDEMPOTENCY_TTL_MS;
    for (const [k, v] of IDEMPOTENT_KEYS.entries()) {
      if (v.ts < cutoff) IDEMPOTENT_KEYS.delete(k);
    }
  }
}

/* ------------------------------------------------------------------ */
/* DB helpers                                                          */
/* ------------------------------------------------------------------ */

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };

async function getDrizzle(): Promise<{
  payload: Awaited<ReturnType<typeof getPayloadInstance>>;
  drizzle: DrizzleLike;
  sql: { raw: (s: string) => unknown };
}> {
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as {
      drizzle?: { execute?: (q: unknown) => Promise<unknown> };
    }
  ).drizzle;
  if (!drizzle?.execute) {
    throw new Error("payload.db.drizzle.execute unavailable");
  }
  const { sql: drizzleSql } = (await import("drizzle-orm")) as {
    sql: { raw: (s: string) => unknown };
  };
  return { payload, drizzle: drizzle as DrizzleLike, sql: drizzleSql };
}

const esc = (s: string | null | undefined) =>
  s === null || s === undefined ? "NULL" : "'" + s.replace(/'/g, "''") + "'";

/**
 * Look up the trusted price for each cart item. Reads `from_price`
 * + `variants_json` for the product, matches the variant by `dose`
 * label (case-insensitive), and returns:
 *   - newItem: the item with its trusted price + image
 *   - error:   present when the line is invalid (missing product /
 *              dose / inactive product / out of stock)
 */
async function repriceItems(
  drizzle: DrizzleLike,
  sql: { raw: (s: string) => unknown },
  items: ValidatedItem[]
): Promise<
  | { ok: true; items: Required<ValidatedItem>[]; total: number }
  | { ok: false; error: string }
> {
  // Match by SLUG, not numeric id. The product detail pages use a static
  // catalog with their own placeholder ids (e.g. 1001/1002/1003), which don't
  // match the Payload products table ids — so an id lookup wrongly reported
  // "Product not found" at checkout. The slug is stable across both, so we
  // reprice by slug (the cart always carries it).
  const slugs = [...new Set(items.map((i) => i.slug).filter(Boolean))];
  if (slugs.length === 0) return { ok: false, error: "No items" };
  const inList = slugs
    .map((s) => `'${String(s).replace(/'/g, "''")}'`)
    .join(",");

  const result = (await drizzle.execute(
    sql.raw(
      `SELECT id, slug, title, from_price, subscription_price, hero_image_url, variants_json, is_active
       FROM products
       WHERE slug IN (${inList})`
    )
  )) as
    | { rows?: Array<Record<string, unknown>> }
    | Array<Record<string, unknown>>;
  const rows = Array.isArray(result) ? result : (result.rows ?? []);
  const bySlug = new Map(rows.map((r) => [String(r.slug), r]));

  const repriced: Required<ValidatedItem>[] = [];
  for (const item of items) {
    const product = bySlug.get(item.slug);
    if (!product) {
      return { ok: false, error: `Product "${item.slug}" not found` };
    }
    if (!product.is_active) {
      return { ok: false, error: `Product "${product.title}" is no longer available` };
    }

    // Base price: from_price, else subscription_price (a simple product may
    // be priced only via the subscription field). Variant match below can
    // still override this for dosed products.
    let trustedPrice: number | null =
      product.from_price !== null
        ? Number(product.from_price)
        : product.subscription_price !== null
          ? Number(product.subscription_price)
          : null;

    // If the cart row has a dose, match it against variants_json.
    // The product page appends "mg" to bare-number dashboard labels
    // ("2.5" -> "2.5mg") for display, so the cart's dose string can differ
    // from the raw variant label by unit/whitespace. Normalise both sides
    // (drop spaces + a trailing "mg") so "2.5", "2.5mg" and "2.5 mg" match.
    if (item.dose) {
      const normDose = (s: string) =>
        s.trim().toLowerCase().replace(/\s+/g, "").replace(/mg$/, "");
      const wanted = normDose(item.dose);
      const variants = Array.isArray(product.variants_json)
        ? (product.variants_json as Array<{ label?: string; price?: number }>)
        : [];
      const match = variants.find(
        (v) => normDose(v?.label ?? "") === wanted
      );
      if (!match) {
        return {
          ok: false,
          error: `Dose "${item.dose}" not available for ${product.title}`,
        };
      }
      if (typeof match.price === "number") trustedPrice = match.price;
    }

    if (trustedPrice === null || !Number.isFinite(trustedPrice)) {
      return { ok: false, error: `No price configured for ${product.title}` };
    }

    repriced.push({
      productId: item.productId,
      slug: String(product.slug ?? item.slug),
      title: String(product.title ?? item.title),
      dose: item.dose ?? null,
      price: trustedPrice,
      quantity: item.quantity,
      imageUrl: (product.hero_image_url as string | null) ?? item.imageUrl ?? null,
    });
  }

  const total =
    Math.round(
      repriced.reduce((acc, i) => acc + i.price * i.quantity, 0) * 100
    ) / 100;
  return { ok: true, items: repriced, total };
}

/* ------------------------------------------------------------------ */
/* POST                                                                */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  // 1. CSRF / origin guard
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "Cross-origin request rejected" },
      { status: 403 }
    );
  }

  // 2. Rate limit
  const ip = clientIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many checkouts — try again in a minute" },
      { status: 429 }
    );
  }

  // 3. Parse + validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Validation failed",
        issues: parsed.error.issues.slice(0, 8),
      },
      { status: 400 }
    );
  }
  // 3b. Sanitise customer fields. Zod validates shape; sanitisation
  //     normalises whitespace, strips HTML/control chars, and clamps
  //     length so we never store hostile or oversized strings.
  const rawCustomer = parsed.data.customer;
  const customer = {
    name: sanitizeText(rawCustomer.name, 120),
    email: sanitizeEmail(rawCustomer.email),
    phone: sanitizePhone(rawCustomer.phone ?? ""),
    address: sanitizeMultiline(rawCustomer.address, 2000),
    notes: sanitizeMultiline(rawCustomer.notes ?? "", 2000),
  };
  if (!customer.name || !customer.email || !customer.address) {
    return NextResponse.json(
      { ok: false, error: "Required customer field missing after sanitisation" },
      { status: 400 }
    );
  }
  const items = parsed.data.items;

  // 4. Idempotency-Key replay protection
  const idempotencyKey = req.headers.get("idempotency-key");
  if (idempotencyKey) {
    const existing = idempotencyLookup(idempotencyKey);
    if (existing) {
      return NextResponse.json({
        ok: true,
        id: existing.orderId,
        orderNumber: existing.orderNumber,
        totalAmount: existing.total,
        idempotent: true,
      });
    }
  }

  // 5. Init Payload + drizzle
  let payload: Awaited<ReturnType<typeof getPayloadInstance>>;
  try {
    payload = await getPayloadInstance();
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Payload init failed", detail: String(err) },
      { status: 500 }
    );
  }

  // 6. Optional auth gate
  let userId: number | null = null;
  let user: unknown = null;
  try {
    const auth = await payload.auth({ headers: await nextHeaders() });
    user = auth.user;
    if (auth.user)
      userId = Number((auth.user as unknown as { id: number | string }).id);
  } catch {
    // anonymous OK below unless gate is on
  }
  if (process.env.JOOD_REQUIRE_AUTH_FOR_CHECKOUT === "true" && !user) {
    return NextResponse.json(
      {
        ok: false,
        error: "You must be signed in to place an order.",
      },
      { status: 401 }
    );
  }

  // 7. Re-price every line from the DB (server-trusted prices)
  let drizzle: DrizzleLike;
  let sql: { raw: (s: string) => unknown };
  try {
    const d = await getDrizzle();
    drizzle = d.drizzle;
    sql = d.sql;
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "DB init failed", detail: String(err) },
      { status: 500 }
    );
  }
  const repriced = await repriceItems(drizzle, sql, items);
  if (!repriced.ok) {
    return NextResponse.json(
      { ok: false, error: repriced.error },
      { status: 400 }
    );
  }

  // 7b. Apply a discount code (optional). Recomputed server-side against the
  //     trusted (re-priced) subtotal so the charge always matches what the
  //     customer was shown. A supplied-but-invalid code fails the order
  //     rather than silently charging full price.
  let discountAmount = 0;
  let appliedCode: string | null = null;
  const rawDiscountCode = parsed.data.discountCode?.trim();
  if (rawDiscountCode) {
    const { applyDiscountCode } = await import("@/lib/discounts");
    const applied = await applyDiscountCode(rawDiscountCode, repriced.total);
    if (!applied.valid) {
      return NextResponse.json(
        { ok: false, error: applied.reason ?? "This discount code isn’t valid." },
        { status: 400 }
      );
    }
    discountAmount = applied.amount;
    appliedCode = applied.code ?? rawDiscountCode.toUpperCase();
  }
  const finalTotal =
    Math.round(Math.max(0, repriced.total - discountAmount) * 100) / 100;

  // A 100%/large discount can bring the total to £0. Stripe rejects a £0
  // PaymentIntent, so a free order skips Stripe entirely: it's recorded as
  // already paid here and the client redirects straight to the success page.
  // Values must match the Orders collection options so the admin dashboard
  // renders them. A £0 order has nothing left to collect, so it's a completed
  // PAID order (status=paid) — not stuck in "pending"/payment-pending limbo.
  // Card orders still start pending until Stripe confirms the charge.
  const isFree = finalTotal <= 0;
  const orderStatus = isFree ? "paid" : "pending";
  const payMethod = isFree ? "test" : "card";
  const payStatus = isFree ? "paid" : "unpaid";

  // 8. Insert — sequential order number (JL3000, JL3001, …)
  const orderNumber = await nextOrderNumber(drizzle, sql);

  // Audit fields — recorded with every order
  const userAgent = sanitizeText(req.headers.get("user-agent") ?? "", 500);
  const ipForAudit = ip; // already clientIp(req)

  try {
    const stmt = `
      INSERT INTO "orders"
        (order_number, user_id, customer_name, customer_email, customer_phone,
         shipping_address, items_json, total_amount, discount_amount,
         status, payment_method, payment_status, ip_address, user_agent,
         notes, updated_at, created_at)
      VALUES
        (${esc(orderNumber)}, ${userId ?? "NULL"},
         ${esc(customer.name)}, ${esc(customer.email)}, ${esc(customer.phone)},
         ${esc(customer.address)},
         ${esc(JSON.stringify(repriced.items))}::jsonb,
         ${finalTotal}, ${discountAmount},
         ${esc(orderStatus)}, ${esc(payMethod)}, ${esc(payStatus)},
         ${esc(ipForAudit)}, ${esc(userAgent)},
         ${esc(customer.notes)},
         now(), now())
      RETURNING id;
    `;
    const result = (await drizzle.execute(sql.raw(stmt))) as
      | { rows?: Array<{ id: number }> }
      | Array<{ id: number }>;
    const rows = Array.isArray(result) ? result : (result.rows ?? []);
    const id = rows[0]?.id;
    if (!id) throw new Error("Insert did not return an id");

    // Cart recovered — drop this shopper out of the Abandoned Checkout queue.
    try {
      await drizzle.execute(
        sql.raw(
          `UPDATE "abandoned_carts" SET recovered_at = now(), updated_at = now()
           WHERE LOWER(email) = ${esc(customer.email.toLowerCase())} AND recovered_at IS NULL`,
        ),
      );
    } catch {
      /* non-fatal — never let cart cleanup break an order */
    }

    if (idempotencyKey) {
      idempotencyStore(idempotencyKey, {
        orderId: id,
        orderNumber,
        total: finalTotal,
      });
    }

    // Best-effort: increment the discount's redemption counter. Never let a
    // counter failure break the order.
    if (appliedCode) {
      try {
        await drizzle.execute(
          sql.raw(
            `UPDATE "discounts"
             SET usage_count = COALESCE(usage_count, 0) + 1
             WHERE upper(code) = upper(${esc(appliedCode)})`
          )
        );
      } catch {
        /* ignore */
      }
    }

    // ── HubSpot mirror ───────────────────────────────────────────
    // Upsert the contact + create a Deal worth the order total. Runs via
    // after() so it completes AFTER the response is sent without being
    // killed when the Vercel serverless function freezes on return.
    {
      const [first, ...rest] = customer.name.split(" ");
      const itemSummary = repriced.items
        .map(
          (i) =>
            `${i.title}${i.dose ? ` (${i.dose})` : ""} × ${i.quantity}`,
        )
        .join(", ");
      const gbp = (n: number) =>
        `£${Number(n || 0).toLocaleString("en-GB", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      const itemLines = repriced.items
        .map(
          (i) =>
            `<b>${i.title}${i.dose ? ` (${i.dose})` : ""}</b> × ${i.quantity} — ${gbp(
              Number(i.price ?? 0) * i.quantity,
            )}`,
        )
        .join("<br/>");
      const noteBody =
        `<p><b>JoodLife order ${orderNumber}</b><br/>` +
        `Status: ${orderStatus} · Payment: ${payMethod}</p>` +
        `<hr/><p>${itemLines}</p>` +
        (discountAmount > 0 ? `<p>Discount: −${gbp(discountAmount)}</p>` : "") +
        `<p><b>Total: ${gbp(finalTotal)}</b></p>` +
        `<hr/><p><b>Ship to:</b><br/>${(customer.address || "—").replace(/\n/g, "<br/>")}</p>` +
        (customer.notes
          ? `<p><b>Customer note:</b><br/>${customer.notes.replace(/\n/g, "<br/>")}</p>`
          : "");

      // HubSpot push is AWAITED (not after()) so it reliably runs during the
      // request — background after() work was not consistently executing on
      // Vercel, so orders never reached HubSpot. Bounded by a hard timeout and
      // wrapped so a HubSpot failure can never break the order itself.
      try {
        await Promise.race([
          (async () => {
            await fireHubSpot("checkout:contact", () =>
              upsertContact({
                email: customer.email,
                firstName: first || null,
                lastName: rest.join(" ") || null,
                phone: customer.phone || null,
                extra: {
                  jood_last_order_number: orderNumber,
                  jood_last_order_total: finalTotal,
                },
              }),
            );
            await fireHubSpot("checkout:deal", () =>
              createDeal({
                name: `JoodLife — ${orderNumber}`,
                amount: finalTotal,
                contactEmail: customer.email,
                dealStage: mapOrderStageId(orderStatus, payStatus),
                extra: {
                  jood_order_number: orderNumber,
                  jood_order_items: itemSummary,
                  jood_order_status: orderStatus,
                  jood_payment_method: payMethod,
                },
              }),
            );
            await fireHubSpot("checkout:note", () =>
              addNoteToContact(customer.email, noteBody),
            );
          })(),
          new Promise((resolve) => setTimeout(resolve, 9000)),
        ]);
      } catch (err) {
        payload?.logger?.error?.({ msg: "HubSpot order push failed (non-fatal)", err });
      }

      // Confirmation email can stay in the background — it's not time-critical.
      after(async () => {
        try {
          // A reorder is any order beyond the first — check if the customer had
          // prior orders (the current one is already inserted, so count > 1).
          let isReorder = false;
          try {
            const countRes = (await drizzle.execute(
              sql.raw(
                `SELECT COUNT(*) AS n FROM "orders" WHERE lower(customer_email) = lower(${esc(customer.email)}) AND status != 'cancelled'`
              )
            )) as { rows?: Array<{ n: string | number }> } | Array<{ n: string | number }>;
            const countRows = Array.isArray(countRes) ? countRes : (countRes.rows ?? []);
            isReorder = Number(countRows[0]?.n ?? 0) > 1;
          } catch { /* non-fatal */ }

          await sendOrderConfirmationEmail(payload, {
            email: customer.email,
            name: customer.name,
            orderNumber,
            total: finalTotal,
            isReorder,
            items: repriced.items.map((i) => ({
              title: i.title,
              dose: i.dose ?? null,
              quantity: i.quantity,
              price: i.price,
              imageUrl: i.imageUrl ?? null,
            })),
          });
        } catch (err) {
          payload?.logger?.error?.({ msg: "Order email failed (non-fatal)", err });
        }
      });
    }

    return NextResponse.json({
      ok: true,
      id,
      orderNumber,
      totalAmount: finalTotal,
      discountAmount,
      free: isFree,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Order insert failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/* GET — public order summary for the success page                     */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("orderNumber");
  if (!orderNumber || !/^JL[A-Z0-9-]+$/i.test(orderNumber)) {
    return NextResponse.json(
      { ok: false, error: "Bad orderNumber" },
      { status: 400 }
    );
  }

  try {
    const { drizzle, sql } = await getDrizzle();
    const safe = orderNumber.replace(/'/g, "''");
    const result = (await drizzle.execute(
      sql.raw(
        `SELECT order_number, customer_name, customer_email, items_json,
                total_amount, status, created_at
         FROM "orders"
         WHERE order_number = '${safe}'
         LIMIT 1`
      )
    )) as
      | { rows?: Array<Record<string, unknown>> }
      | Array<Record<string, unknown>>;
    const rows = Array.isArray(result) ? result : (result.rows ?? []);
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    const r = rows[0];
    return NextResponse.json({
      ok: true,
      order: {
        orderNumber: r.order_number,
        customerName: r.customer_name,
        customerEmail: r.customer_email,
        items: r.items_json ?? [],
        totalAmount: Number(r.total_amount),
        status: r.status,
        createdAt: r.created_at,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "Read failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
